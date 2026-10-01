const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { buildBlog } = require("./build-blog");
const { siteRoot } = require("./blog-lib");

const slug = "teste-mvp-publicacao-pelo-painel";
const sourcePath = path.join(siteRoot, "noticias", "posts", `${slug}.md`);
const publicDirectory = path.join(siteRoot, "noticias", slug);
const indexPath = path.join(siteRoot, "noticias", "index.html");
const original = fs.readFileSync(sourcePath, "utf8");

function setStatus(status) {
  const next = original.replace(/^status: .*$/m, `status: ${status}`);
  if (next === original && !original.includes(`status: ${status}`)) {
    throw new Error("Não foi possível alterar o status do post de teste.");
  }
  fs.writeFileSync(sourcePath, next, "utf8");
  buildBlog();
}

function publicIndex() {
  return fs.readFileSync(indexPath, "utf8");
}

try {
  setStatus("draft");
  assert(!publicIndex().includes(`/noticias/${slug}/`), "Rascunho apareceu na listagem.");
  assert(!fs.existsSync(publicDirectory), "Rascunho manteve uma página pública.");

  setStatus("review");
  assert(!publicIndex().includes(`/noticias/${slug}/`), "Item em revisão apareceu na listagem.");
  assert(!fs.existsSync(publicDirectory), "Item em revisão manteve uma página pública.");

  setStatus("published");
  assert(publicIndex().includes(`/noticias/${slug}/`), "Post publicado não apareceu na listagem.");
  assert(fs.existsSync(path.join(publicDirectory, "index.html")), "Página do post publicado não foi gerada.");

  console.log("Fluxo draft → review → published validado com sucesso.");
} finally {
  fs.writeFileSync(sourcePath, original, "utf8");
  buildBlog();
}
