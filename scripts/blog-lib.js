const fs = require("fs");
const path = require("path");

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

function parseFrontMatter(source, filename) {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: o post precisa começar com um bloco --- de metadados.`);

  const metadata = {};
  match[1].split("\n").forEach((line) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const separator = line.indexOf(":");
    if (separator === -1) throw new Error(`${filename}: metadado inválido: ${line}`);
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    metadata[key] = value;
  });

  const required = ["title", "slug", "date", "category", "excerpt", "description", "deck", "image", "imageAlt"];
  required.forEach((field) => {
    if (!metadata[field]) throw new Error(`${filename}: metadado obrigatório ausente: ${field}`);
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) {
    throw new Error(`${filename}: date deve usar o formato AAAA-MM-DD.`);
  }
  if (metadata.slug !== slugify(metadata.slug)) {
    throw new Error(`${filename}: slug deve conter apenas letras minúsculas, números e hífens.`);
  }
  const createdAt = metadata.createdAt || `${metadata.date}T00:00:00-03:00`;
  if (!Number.isFinite(Date.parse(createdAt))) {
    throw new Error(`${filename}: createdAt precisa ser uma data e hora ISO válida.`);
  }

  return {
    ...metadata,
    tags: (metadata.tags || "").split("|").map((tag) => tag.trim()).filter(Boolean),
    createdAt,
    imageCaption: metadata.imageCaption || "",
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

function readPosts() {
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

  return posts.sort((a, b) => {
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
  siteRoot,
  slugify,
  stripMarkdown,
  truncate
};
