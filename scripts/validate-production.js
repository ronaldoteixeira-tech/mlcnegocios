const { escapeHtml, readPosts } = require("./blog-lib");

const siteUrl = String(process.env.SITE_URL || "https://mlcnegocios.com.br").replace(/\/$/, "");
const retries = Number.parseInt(process.env.VERIFY_RETRIES || "1", 10);
const intervalMs = Number.parseInt(process.env.VERIFY_INTERVAL_MS || "0", 10);

function checkInteger(value, name, minimum) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} precisa ser um número inteiro maior ou igual a ${minimum}.`);
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchHtml(pathname) {
  const separator = pathname.includes("?") ? "&" : "?";
  const url = `${siteUrl}${pathname}${separator}verify=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      "user-agent": "mlc-blog-production-validator/1.0"
    },
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`${url} respondeu com HTTP ${response.status}.`);
  return response.text();
}

async function validateOnce(posts) {
  const index = await fetchHtml("/noticias/");
  const cardCount = (index.match(/class="blog-card-link"/g) || []).length;
  if (cardCount !== posts.length) {
    throw new Error(`A listagem possui ${cardCount} card(s), mas ${posts.length} post(s) estão publicados.`);
  }

  for (const post of posts) {
    const publicUrl = `/noticias/${post.slug}/`;
    if (!index.includes(`href="${publicUrl}"`)) {
      throw new Error(`${post.filename}: card não encontrado em produção.`);
    }

    const article = await fetchHtml(publicUrl);
    if (!article.includes('class="article-hero"')) {
      throw new Error(`${post.filename}: a URL retornou uma página de fallback, não um artigo.`);
    }
    if (!article.includes(`<h1>${escapeHtml(post.title)}</h1>`)) {
      throw new Error(`${post.filename}: título incorreto ou ausente na página publicada.`);
    }
  }
}

async function run() {
  checkInteger(retries, "VERIFY_RETRIES", 1);
  checkInteger(intervalMs, "VERIFY_INTERVAL_MS", 0);
  const posts = readPosts();
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await validateOnce(posts);
      console.log(`Publicação validada em ${siteUrl}: ${posts.length} artigo(s) disponível(is).`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt}/${retries}: ${error.message}`);
      if (attempt < retries) await sleep(intervalMs);
    }
  }

  throw new Error(`A publicação não ficou consistente em ${siteUrl}: ${lastError.message}`);
}

run().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
});
