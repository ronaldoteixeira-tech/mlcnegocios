const fs = require("fs");
const path = require("path");
const { buildBlog } = require("./build-blog");
const {
  postsDirectory,
  slugify,
  stripMarkdown,
  truncate
} = require("./blog-lib");

function parseArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    if (key === "help") {
      args.help = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Informe um valor para --${key}.`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).format(new Date());
}

function normalizeBody(value) {
  const clean = value.replace(/\r\n/g, "\n").trim();
  if (/\n\s*\n/.test(clean)) return clean;
  return clean.split("\n").map((line) => line.trim()).filter(Boolean).join("\n\n");
}

function frontMatterValue(value) {
  return String(value).replace(/\r?\n/g, " ").trim();
}

function run() {
  const args = parseArguments(process.argv.slice(2));
  if (args.help) {
    console.log(`Adicionar um post ao blog da MLC

Uso mínimo:
  .\\publicar-noticia.cmd "caminho/do/post.txt"

Alternativa:
  node scripts/add-blog-post.js --file "caminho/do/post.txt"

O título deve estar na primeira linha. A data padrão é a data atual.
Opções: --date, --category, --tags, --image, --image-alt, --excerpt, --description, --deck, --caption e --slug.`);
    return;
  }
  if (!args.file && !args.text) {
    throw new Error('Use --file "caminho/do/texto.txt" ou --text "Título e conteúdo".');
  }

  const raw = args.file
    ? fs.readFileSync(path.resolve(args.file), "utf8")
    : args.text;
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const firstContentLine = lines.findIndex((line) => line.trim());
  const title = frontMatterValue(args.title || lines[firstContentLine].replace(/^#\s+/, ""));
  const bodyStart = args.title ? normalized : lines.slice(firstContentLine + 1).join("\n");
  const body = normalizeBody(bodyStart);
  if (!title || !body) throw new Error("O texto precisa ter um título na primeira linha e conteúdo nas linhas seguintes.");

  const slug = args.slug ? slugify(args.slug) : slugify(title);
  const date = args.date || localDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use --date no formato AAAA-MM-DD.");
  const category = frontMatterValue(args.category || "Energia e BESS");
  const tags = frontMatterValue(args.tags || "BESS | Eficiência energética");
  const image = frontMatterValue(args.image || "/assets/img/bess-o-que-e.webp");
  const imageAlt = frontMatterValue(args["image-alt"] || `Sistema BESS relacionado ao artigo ${title}`);
  const firstParagraph = body.split(/\n\s*\n/).find((block) => !block.trim().startsWith("#")) || body;
  const excerpt = frontMatterValue(args.excerpt || truncate(firstParagraph, 210));
  const description = frontMatterValue(args.description || truncate(stripMarkdown(body), 155));
  const deck = frontMatterValue(args.deck || excerpt);
  const caption = frontMatterValue(args.caption || "Sistema BESS aplicado ao armazenamento inteligente de energia.");
  const createdAt = new Date().toISOString();

  fs.mkdirSync(postsDirectory, { recursive: true });
  const destination = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(destination)) throw new Error(`Já existe um post com o slug ${slug}. Use --slug para escolher outro.`);

  const post = `---
title: ${title}
slug: ${slug}
date: ${date}
createdAt: ${createdAt}
category: ${category}
excerpt: ${excerpt}
description: ${description}
deck: ${deck}
image: ${image}
imageAlt: ${imageAlt}
imageCaption: ${caption}
tags: ${tags}
---
${body}
`;

  fs.writeFileSync(destination, post, "utf8");
  console.log(`Fonte criada: noticias/posts/${slug}.md`);
  buildBlog();
  console.log(`Artigo publicado em /noticias/${slug}/`);
}

try {
  run();
} catch (error) {
  console.error(`Não foi possível adicionar o post: ${error.message}`);
  process.exitCode = 1;
}
