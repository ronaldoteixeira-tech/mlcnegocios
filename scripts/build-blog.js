const fs = require("fs");
const path = require("path");
const {
  escapeHtml,
  formatDate,
  readPosts,
  renderMarkdown,
  siteRoot
} = require("./blog-lib");

const indexPath = path.join(siteRoot, "noticias", "index.html");
const templatePath = path.join(__dirname, "templates", "article.html");

function replaceTokens(template, values) {
  return template.replace(/{{([A-Z_]+)}}/g, (token, key) => {
    if (!(key in values)) throw new Error(`Token sem valor no template: ${token}`);
    return values[key];
  });
}

function renderTags(tags, className = "") {
  const attribute = className ? ` class="${className}"` : "";
  return tags.map((tag) => `<span${attribute}>${escapeHtml(tag)}</span>`).join("");
}

function renderCard(post) {
  const tags = (post.tags.length ? post.tags : [post.category]).slice(0, 3);
  return `        <article class="blog-card">
          <a class="blog-card-link" href="/noticias/${post.slug}/" aria-label="Ler o artigo ${escapeHtml(post.title)}">
            <div class="blog-card-media">
              <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}" loading="lazy" />
            </div>
            <div class="blog-card-copy">
              <div class="blog-card-kicker">
                <span>${escapeHtml(post.category)}</span>
                <time datetime="${post.date}">${escapeHtml(formatDate(post.date))}</time>
              </div>
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.excerpt)}</p>
              <div class="blog-card-meta" aria-label="Temas do artigo">${renderTags(tags)}</div>
              <span class="blog-card-read">Ler artigo <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </div>
          </a>
        </article>`;
}

function renderArticle(post, template) {
  const rendered = renderMarkdown(post.body);
  const toc = rendered.headings.length
    ? `<aside class="article-toc" aria-label="Neste artigo">
            <b>Neste artigo</b>
            ${rendered.headings.map((heading) => `<a href="#${heading.id}">${escapeHtml(heading.title)}</a>`).join("\n            ")}
          </aside>`
    : "";

  return replaceTokens(template, {
    ARTICLE_LAYOUT_CLASS: rendered.headings.length ? "article-layout" : "article-layout article-layout--without-toc",
    CATEGORY: escapeHtml(post.category),
    CONTENT: rendered.html,
    DATE_DISPLAY: escapeHtml(formatDate(post.date)),
    DATE_ISO: post.date,
    DECK: escapeHtml(post.deck),
    DESCRIPTION: escapeHtml(post.description),
    IMAGE: escapeHtml(post.image),
    IMAGE_ALT: escapeHtml(post.imageAlt),
    IMAGE_CAPTION: escapeHtml(post.imageCaption),
    TAGS: renderTags(post.tags.length ? post.tags : [post.category]),
    TITLE: escapeHtml(post.title),
    TOC: toc
  });
}

function updateIndex(posts) {
  const startMarker = "<!-- BLOG_CARDS_START -->";
  const endMarker = "<!-- BLOG_CARDS_END -->";
  let index = fs.readFileSync(indexPath, "utf8");
  const cards = posts.map(renderCard).join("\n");
  const pattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
  if (!pattern.test(index)) throw new Error("Marcadores do carrossel não encontrados em noticias/index.html.");
  index = index.replace(pattern, `${startMarker}\n${cards}\n        ${endMarker}`);
  index = index.replace(/(id="blogCarousel"[^>]*data-count=")\d+("[^>]*>)/, `$1${posts.length}$2`);
  fs.writeFileSync(indexPath, index, "utf8");
}

function buildBlog() {
  const posts = readPosts();
  if (!posts.length) throw new Error("Nenhum post encontrado em noticias/posts/.");
  const template = fs.readFileSync(templatePath, "utf8");

  updateIndex(posts);
  posts.forEach((post) => {
    const articleDirectory = path.join(siteRoot, "noticias", post.slug);
    fs.mkdirSync(articleDirectory, { recursive: true });
    fs.writeFileSync(path.join(articleDirectory, "index.html"), renderArticle(post, template), "utf8");
  });

  console.log(`Blog atualizado: ${posts.length} post(s), do mais recente para o mais antigo.`);
  posts.forEach((post, index) => console.log(`${index + 1}. ${post.date} — ${post.title}`));
  return posts;
}

if (require.main === module) {
  try {
    buildBlog();
  } catch (error) {
    console.error(`Erro ao gerar o blog: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildBlog };
