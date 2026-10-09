const assert = require("assert");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const {
  escapeHtml,
  parseFrontMatter,
  readPosts,
  serializePost,
  siteRoot
} = require("./blog-lib");

const requireMvpFixture = process.argv.includes("--mvp");
const allowedImageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const maximumImageBytes = 1024 * 1024;
const errors = [];
const warnings = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function validatePanelConfig() {
  const configPath = path.join(siteRoot, ".pages.yml");
  check(fs.existsSync(configPath), ".pages.yml não foi encontrado.");
  if (!fs.existsSync(configPath)) return;

  try {
    const config = YAML.parse(fs.readFileSync(configPath, "utf8"));
    const newsCollection = config.content?.find((entry) => entry.name === "noticias");
    check(newsCollection, "A coleção noticias não existe em .pages.yml.");
    check(newsCollection?.path === "noticias/posts", "A coleção noticias deve apontar para noticias/posts.");
    check(newsCollection?.fields?.some((field) => field.name === "status"), "O painel precisa do campo status.");
    check(newsCollection?.fields?.some((field) => field.name === "body" && field.type === "rich-text"), "O painel precisa de um editor rich-text para body.");
    check(newsCollection?.operations?.rename === false, "O painel deve bloquear a renomeação de posts.");
    check(newsCollection?.operations?.delete === false, "O painel deve bloquear a exclusão de posts.");
  } catch (error) {
    errors.push(`.pages.yml inválido: ${error.message}`);
  }
}

function validateWorkflow() {
  const workflowPath = path.join(siteRoot, ".github", "workflows", "blog-publish.yml");
  check(fs.existsSync(workflowPath), "O workflow blog-publish.yml não foi encontrado.");
  if (!fs.existsSync(workflowPath)) return;

  try {
    const workflow = YAML.parse(fs.readFileSync(workflowPath, "utf8"));
    check(workflow.jobs?.build, "O workflow não possui o job build.");
    check(workflow.permissions?.contents === "write", "O workflow precisa de contents: write para registrar as páginas geradas.");
    const workflowText = fs.readFileSync(workflowPath, "utf8");
    check(workflowText.includes("npm run test:mvp"), "O workflow precisa executar o teste completo do ciclo editorial.");
    check(workflowText.includes("npm run blog:validate:production"), "O workflow precisa validar o resultado publicado no Cloudflare.");
  } catch (error) {
    errors.push(`Workflow blog-publish.yml inválido: ${error.message}`);
  }
}

function validateYamlCompatibility() {
  const fixture = serializePost({
    title: "Teste: metadados YAML",
    slug: "teste-metadados-yaml",
    date: "2026-10-01",
    createdAt: "2026-10-01T09:30:00-03:00",
    status: "draft",
    author: "Equipe MLC",
    category: "Tecnologia e energia",
    excerpt: "Texto suficiente para validar o resumo usado no card da notícia.",
    description: "Descrição multilinha gerada por uma interface de gerenciamento de conteúdo.",
    deck: "Texto de abertura usado apenas pelo teste automatizado de compatibilidade.",
    image: "/assets/img/bess-o-que-e.webp",
    imageAlt: "Sistema de armazenamento de energia instalado em ambiente empresarial",
    tags: ["BESS", "Teste"]
  }, "Conteúdo do teste.");

  try {
    const parsed = parseFrontMatter(fixture, "fixture-painel.md");
    assert.equal(parsed.title, "Teste: metadados YAML");
    assert.deepEqual(parsed.tags, ["BESS", "Teste"]);
    assert.equal(parsed.status, "draft");
  } catch (error) {
    errors.push(`Compatibilidade com YAML do painel falhou: ${error.message}`);
  }
}

function validatePosts() {
  let allPosts;
  let publishedPosts;
  try {
    allPosts = readPosts({ includeUnpublished: true });
    publishedPosts = readPosts();
  } catch (error) {
    errors.push(error.message);
    return;
  }

  const indexPath = path.join(siteRoot, "noticias", "index.html");
  const index = fs.readFileSync(indexPath, "utf8");
  const publishedSlugs = new Set(publishedPosts.map((post) => post.slug));
  const indexCardCount = (index.match(/class="blog-card-link"/g) || []).length;
  check(indexCardCount === publishedPosts.length, `A listagem possui ${indexCardCount} card(s), mas há ${publishedPosts.length} post(s) publicado(s).`);

  allPosts.forEach((post) => {
    check(post.body.length >= 40, `${post.filename}: conteúdo muito curto.`);
    check(post.author.length >= 2, `${post.filename}: author precisa ter pelo menos 2 caracteres.`);
    check(post.imageAlt.length >= 20, `${post.filename}: imageAlt precisa ter pelo menos 20 caracteres.`);
    check(post.excerpt.length >= 40, `${post.filename}: excerpt precisa ter pelo menos 40 caracteres.`);
    check(post.excerpt.length <= 220, `${post.filename}: excerpt ultrapassa 220 caracteres.`);
    check(post.description.length >= 50, `${post.filename}: description precisa ter pelo menos 50 caracteres.`);
    check(post.description.length <= 160, `${post.filename}: description ultrapassa 160 caracteres.`);
    check(post.deck.length >= 40, `${post.filename}: deck precisa ter pelo menos 40 caracteres.`);
    check(post.deck.length <= 260, `${post.filename}: deck ultrapassa 260 caracteres.`);
    check(post.tags.length >= 1, `${post.filename}: informe pelo menos uma tag.`);
    check(post.filename === `${post.slug}.md`, `${post.filename}: o nome do arquivo deve coincidir com o slug.`);

    if (post.image.startsWith("/")) {
      const imagePath = path.join(siteRoot, post.image.slice(1));
      check(fs.existsSync(imagePath), `${post.filename}: imagem não encontrada em ${post.image}.`);
      check(post.image.startsWith("/assets/img/"), `${post.filename}: a imagem precisa estar em /assets/img/.`);
      check(allowedImageExtensions.has(path.extname(imagePath).toLowerCase()), `${post.filename}: formato de imagem não permitido.`);
      if (fs.existsSync(imagePath)) {
        check(fs.statSync(imagePath).size <= maximumImageBytes, `${post.filename}: a imagem ultrapassa 1 MB.`);
      }
    } else {
      warnings.push(`${post.filename}: imagem externa ou caminho relativo não validado (${post.image}).`);
    }

    const publicUrl = `/noticias/${post.slug}/`;
    const publicDirectory = path.join(siteRoot, "noticias", post.slug);
    if (post.status === "published") {
      check(publishedSlugs.has(post.slug), `${post.filename}: post publicado não retornado por readPosts().`);
      check(index.includes(`href="${publicUrl}"`), `${post.filename}: card não encontrado na listagem.`);
      const articlePath = path.join(publicDirectory, "index.html");
      check(fs.existsSync(articlePath), `${post.filename}: página pública não foi gerada.`);
      if (fs.existsSync(articlePath)) {
        const article = fs.readFileSync(articlePath, "utf8");
        check(article.includes('class="article-hero"'), `${post.filename}: página gerada sem a estrutura de artigo.`);
        check(article.includes(`<h1>${escapeHtml(post.title)}</h1>`), `${post.filename}: título ausente ou incorreto na página gerada.`);
      }
    } else {
      check(!publishedSlugs.has(post.slug), `${post.filename}: rascunho apareceu na coleção publicada.`);
      check(!index.includes(publicUrl), `${post.filename}: rascunho apareceu na listagem pública.`);
      check(!fs.existsSync(publicDirectory), `${post.filename}: rascunho possui diretório público residual.`);
    }
  });

  const knownSlugs = new Set(allPosts.map((post) => post.slug));
  const newsDirectory = path.join(siteRoot, "noticias");
  fs.readdirSync(newsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "posts")
    .filter((entry) => fs.existsSync(path.join(newsDirectory, entry.name, "index.html")))
    .forEach((entry) => check(knownSlugs.has(entry.name), `Página pública órfã sem post-fonte: noticias/${entry.name}/.`));

  if (requireMvpFixture) {
    const fixture = allPosts.find((post) => post.slug === "teste-mvp-publicacao-pelo-painel");
    check(fixture, "O post de teste do MVP não foi encontrado.");
    check(fixture?.status === "draft", "O post de teste do MVP precisa permanecer como draft.");
  }

  console.log(`Posts verificados: ${allPosts.length} (${publishedPosts.length} publicados, ${allPosts.length - publishedPosts.length} não publicados).`);
}

validatePanelConfig();
validateWorkflow();
validateYamlCompatibility();
validatePosts();

warnings.forEach((warning) => console.warn(`AVISO: ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERRO: ${error}`));
  process.exitCode = 1;
} else {
  console.log("Validação concluída sem erros.");
}
