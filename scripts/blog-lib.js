const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const siteRoot = path.resolve(__dirname, "..");
const postsDirectory = path.join(siteRoot, "noticias", "posts");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializePost(metadata, body) {
  return `---\n${YAML.stringify(metadata).trimEnd()}\n---\n${String(body).trim()}\n`;
}

function parseFrontMatter(source, filename) {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: o post precisa começar com um bloco --- de metadados.`);

  let metadata;
  try {
    metadata = YAML.parse(match[1], { maxAliasCount: 10 });
  } catch (error) {
    throw new Error(`${filename}: metadados YAML inválidos: ${error.message}`);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${filename}: o bloco de metadados precisa ser um objeto YAML.`);
  }

  const text = (field) => {
    const value = metadata[field];
    if (value === undefined || value === null) return "";
    if (typeof value === "object") throw new Error(`${filename}: ${field} precisa ser um texto.`);
    return String(value).trim();
  };

  const required = ["title", "slug", "date", "category", "excerpt", "description", "deck", "image", "imageAlt"];
  required.forEach((field) => {
    if (!text(field)) throw new Error(`${filename}: metadado obrigatório ausente: ${field}`);
  });
  const title = text("title");
  const slug = text("slug");
  const date = text("date");
  const status = text("status").toLowerCase() || "published";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${filename}: date deve usar o formato AAAA-MM-DD.`);
  }
  if (slug !== slugify(slug)) {
    throw new Error(`${filename}: slug deve conter apenas letras minúsculas, números e hífens.`);
  }
  if (!["draft", "review", "published"].includes(status)) {
    throw new Error(`${filename}: status deve ser draft, review ou published.`);
  }
  const createdAt = text("createdAt") || `${date}T00:00:00-03:00`;
  if (!Number.isFinite(Date.parse(createdAt))) {
    throw new Error(`${filename}: createdAt precisa ser uma data e hora ISO válida.`);
  }

  const rawTags = metadata.tags || [];
  const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags).split("|"))
    .map((tag) => String(tag).trim())
    .filter(Boolean);

  return {
    title,
    slug,
    date,
    status,
    author: text("author"),
    category: text("category"),
    excerpt: text("excerpt"),
    description: text("description"),
    deck: text("deck"),
    image: text("image"),
    imageAlt: text("imageAlt"),
    imageCaption: text("imageCaption"),
    tags,
    createdAt,
    body: match[2].trim(),
    filename
  };
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const headings = [];
  const usedIds = new Set();
  let paragraph = [];
  let list = [];
  let quote = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul class="article-list">${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote class="article-pullquote"><p>${renderInline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      return;
    }
    if (line.startsWith("## ")) {
      flushAll();
      const title = line.slice(3).trim();
      let id = slugify(title) || "secao";
      let suffix = 2;
      while (usedIds.has(id)) id = `${slugify(title)}-${suffix++}`;
      usedIds.add(id);
      headings.push({ id, title });
      html.push(`<h2 id="${id}">${renderInline(title)}</h2>`);
      return;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2).trim());
      return;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      list.push(line.slice(2).trim());
      return;
    }
    flushList();
    flushQuote();
    paragraph.push(line);
  });
  flushAll();

  return { html: html.join("\n            "), headings };
}

function formatDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function readPosts({ includeUnpublished = false } = {}) {
  if (!fs.existsSync(postsDirectory)) return [];
  const posts = fs.readdirSync(postsDirectory)
    .filter((filename) => filename.endsWith(".md"))
    .map((filename) => {
      const source = fs.readFileSync(path.join(postsDirectory, filename), "utf8");
      return parseFrontMatter(source, filename);
    });

  const slugs = new Set();
  posts.forEach((post) => {
    if (slugs.has(post.slug)) throw new Error(`Slug duplicado: ${post.slug}`);
    slugs.add(post.slug);
  });

  return posts.filter((post) => includeUnpublished || post.status === "published").sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

function stripMarkdown(value) {
  return String(value)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[->]\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, length = 220) {
  const clean = stripMarkdown(value);
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

module.exports = {
  escapeHtml,
  formatDate,
  parseFrontMatter,
  postsDirectory,
  readPosts,
  renderMarkdown,
  serializePost,
  siteRoot,
  slugify,
  stripMarkdown,
  truncate
};
