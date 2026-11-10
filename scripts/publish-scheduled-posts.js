const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const siteRoot = path.resolve(__dirname, "..");
const releaseTag = "blog-agendado-2026-11";
const posts = [
  {
    slug: "eletromobilidade-e-robotizacao-a-demanda-que-vem-pela-frente",
    image: "blog-eletromobilidade-robotizacao-bess.webp",
    asset: "post-2026-11-13.zip",
    publishAt: "2026-11-13T08:00:00-03:00"
  },
  {
    slug: "armazenar-energia-e-preparar-o-brasil-para-o-futuro",
    image: "blog-armazenar-energia-futuro.webp",
    asset: "post-2026-11-20.zip",
    publishAt: "2026-11-20T08:00:00-03:00"
  },
  {
    slug: "sistema-bess-evita-prejuizos-a-piscicultura",
    image: "blog-bess-piscicultura.webp",
    asset: "post-2026-11-27.zip",
    publishAt: "2026-11-27T08:00:00-03:00"
  }
];

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: siteRoot, stdio: "inherit", ...options });
}

function relativePaths(post) {
  return [
    `noticias/posts/${post.slug}.md`,
    `assets/img/${post.image}`,
    `noticias/${post.slug}/index.html`
  ];
}

function downloadPost(post, directory) {
  run("gh", ["release", "download", releaseTag, "--pattern", post.asset, "--dir", directory]);
  const zip = path.join(directory, post.asset);
  if (!fs.existsSync(zip)) throw new Error(`Pacote ausente: ${post.asset}`);
  const entries = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" }).trim().split(/\r?\n/).sort();
  const expected = relativePaths(post).slice(0, 2).sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected)) {
    throw new Error(`Conteúdo inesperado no pacote ${post.asset}: ${entries.join(", ")}`);
  }
  run("unzip", ["-oq", zip, "-d", siteRoot]);
  expected.forEach((file) => {
    if (!fs.existsSync(path.join(siteRoot, file))) throw new Error(`Arquivo extraído ausente: ${file}`);
  });
}

async function verifyPublished(duePosts) {
  const base = "https://mlcnegocios.com.br";
  for (let attempt = 1; attempt <= 36; attempt += 1) {
    try {
      const index = await fetch(`${base}/noticias/`, {
        headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(10000)
      });
      const indexHtml = await index.text();
      const checks = await Promise.all(duePosts.map(async (post) => {
        const response = await fetch(`${base}/noticias/${post.slug}/`, {
          headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(10000)
        });
        const html = await response.text();
        return response.ok && html.includes(`/assets/img/${post.image}`) &&
          html.includes(`<time datetime="${post.publishAt.slice(0, 10)}">`) &&
          indexHtml.includes(`/noticias/${post.slug}/`);
      }));
      if (index.ok && checks.every(Boolean)) {
        console.log(`Publicação confirmada no site: ${duePosts.map((post) => post.slug).join(", ")}`);
        return;
      }
    } catch (error) {
      console.log(`Site ainda não atualizado: ${error.message}`);
    }
    if (attempt < 36) await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error("O site não confirmou todos os artigos após 6 minutos. A próxima execução agendada tentará novamente.");
}

async function main() {
  let now = process.env.BLOG_NOW ? new Date(process.env.BLOG_NOW) : new Date();
  if (!Number.isFinite(now.getTime())) throw new Error("BLOG_NOW inválido.");
  if (now.getTime() >= Date.parse("2026-12-01T00:00:00-03:00")) {
    console.log("Agenda de novembro de 2026 encerrada.");
    return;
  }
  const upcoming = posts.find((post) => {
    const remaining = Date.parse(post.publishAt) - now.getTime();
    return remaining > 0 && remaining <= 20 * 60 * 1000;
  });
  if (upcoming && process.env.GITHUB_EVENT_NAME === "schedule" && !process.env.BLOG_NOW) {
    const remaining = Date.parse(upcoming.publishAt) - now.getTime();
    console.log(`Aguardando ${Math.ceil(remaining / 1000)} segundos até ${upcoming.publishAt}.`);
    await new Promise((resolve) => setTimeout(resolve, remaining));
    now = new Date();
  }

  const duePosts = posts.filter((post) => now.getTime() >= Date.parse(post.publishAt));
  if (!duePosts.length) {
    console.log("Nenhum artigo chegou ao horário de publicação.");
    return;
  }
  console.log(`Artigos vencidos: ${duePosts.map((post) => post.slug).join(", ")}`);
  if (process.env.BLOG_DRY_RUN === "1") return;

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mlc-blog-"));
  try {
    duePosts.forEach((post) => {
      if (!fs.existsSync(path.join(siteRoot, relativePaths(post)[0]))) downloadPost(post, directory);
    });
    run("npm", ["run", "blog:build"]);
    run("git", ["add", "--", "noticias/index.html", ...duePosts.flatMap(relativePaths)]);
    const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: siteRoot });
    if (diff.status === 1) {
      run("git", ["config", "user.name", "github-actions[bot]"]);
      run("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
      run("git", ["commit", "-m", `blog: publicar artigos agendados (${now.toISOString().slice(0, 10)})`]);
      run("git", ["push", "origin", "HEAD:main"]);
    } else if (diff.status === 0) {
      console.log("Os artigos vencidos já estão gerados; nenhum commit necessário.");
    } else {
      throw new Error(`Falha ao verificar alterações do Git (código ${diff.status}).`);
    }
    if (process.env.GITHUB_ACTIONS === "true") await verifyPublished(duePosts);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
