# MLC Negócios — Site Institucional

Site institucional estático da **MLC Negócios**: armazenamento inteligente de energia (BESS), locação estratégica de equipamentos e estruturação financeira em uma única estratégia.

## Stack

- HTML5, CSS3 (variáveis de tema, grid/flexbox) e JavaScript vanilla
- Sem dependências externas; as páginas públicas são HTML estático
- Gerador local em Node.js para publicar e ordenar notícias sem editar HTML manualmente

## Estrutura

```
.
├── index.html                 # Home (/)
├── quem-somos/index.html      # Quem Somos (/quem-somos/)
├── governanca/index.html      # Governança (/governanca/)
├── bess/index.html            # BESS — armazenamento inteligente de energia (/bess/)
├── locacao/index.html         # Locação estratégica de equipamentos (/locacao/)
├── noticias/index.html        # Notícias (/noticias/)
├── noticias/posts/            # Fontes editáveis dos artigos do blog
├── scripts/                   # Gerador e comando de inclusão de notícias
├── package.json               # Comandos npm do blog
├── contato/index.html         # Fale Conosco — formulário + canais (/contato/)
├── assets/
│   ├── css/
│   │   └── style.css          # Estilos compartilhados por todas as páginas
│   ├── js/
│   │   └── main.js            # Comportamento compartilhado (menu, reveal, spot hover, FAQ, formulário)
│   └── img/
│       ├── logo-mlc-horizontal.png
│       └── bg01.png … bg04.png
├── _headers                   # Headers HTTP aplicados pela Cloudflare Pages
├── _redirects                 # Regras de redirecionamento (Cloudflare Pages)
├── .gitignore
└── .gitattributes
```

Cada página pública é HTML estático independente, compartilhando `assets/css/style.css` e `assets/js/main.js` via caminhos absolutos (`/assets/...`). Os artigos são gerados localmente a partir de `noticias/posts/`; os arquivos HTML gerados devem ser versionados normalmente, por isso o deploy continua sem etapa de build.

**Rotas limpas:** cada seção vive em sua própria pasta com um `index.html` (ex.: `bess/index.html`), então a URL pública não expõe a extensão `.html` — `/bess/` em vez de `/bess.html`. Esse é o padrão de roteamento estático que funciona em qualquer host (Cloudflare Pages, Netlify, GitHub Pages, etc.), sem depender de resolução automática de extensão específica de uma plataforma.

## Desenvolvimento local

Basta abrir `index.html` no navegador ou usar um servidor estático a partir da raiz do projeto:

```bash
# Node
npx serve .

# Python
python -m http.server 8080
```

## Publicar uma notícia

Salve o título na primeira linha de um arquivo de texto, coloque o conteúdo nas linhas seguintes e execute:

```bash
.\publicar-noticia.cmd "caminho/do/novo-post.txt"
```

O comando inclui a notícia, gera a página e atualiza o carrossel em ordem de publicação. Veja todas as opções em [`noticias/README.md`](noticias/README.md).

## Deploy — Cloudflare Pages

O site é estático, sem etapa de build.

### Opção A — Dashboard (recomendada)

1. Envie este projeto para um repositório no GitHub.
2. No painel da Cloudflare, acesse **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecione o repositório e configure o build:
   - **Build command:** (deixe em branco)
   - **Build output directory:** `/` (raiz)
4. Deploy. Cada push para o branch principal publica automaticamente.

### Opção B — CLI (wrangler)

```bash
npm install -g wrangler
npx wrangler login
npx wrangler pages deploy . --project-name mlc-negocios
```

### Domínio próprio

Em **Custom domains**, adicione o domínio. Se quiser forçar `https://` no apex (ou `www`), descomente a regra correspondente em `_redirects`.

## Notas

- Arquivos internos (anotações, manuais, PDFs de instalação e material de referência) são ignorados pelo `.gitignore` e **não** sobem para o GitHub.
- Cache de assets imutáveis e headers de segurança são controlados por `_headers`.
