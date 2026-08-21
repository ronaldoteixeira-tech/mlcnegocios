# Publicação de notícias

O blog é gerado a partir dos arquivos em `noticias/posts/`. As páginas públicas continuam sendo HTML estático, mas ninguém precisa copiar cards, cabeçalhos ou rodapés manualmente.

## Adicionar uma notícia em um comando

Crie um arquivo `.txt` com o título na primeira linha e o texto abaixo. Separe os parágrafos com uma linha em branco:

```text
Título da notícia

Primeiro parágrafo do artigo.

Segundo parágrafo do artigo.
```

Na raiz do projeto, execute:

```bash
.\publicar-noticia.cmd "caminho/do/novo-post.txt"
```

O mesmo fluxo também pode ser executado com `node scripts/add-blog-post.js --file "caminho/do/novo-post.txt"`.

O comando faz tudo automaticamente:

1. usa a data atual como data de publicação;
2. cria o arquivo-fonte em `noticias/posts/`;
3. cria a página pública em `/noticias/slug-do-artigo/`;
4. atualiza os cards do carrossel;
5. ordena os artigos do mais recente para o mais antigo.

Se dois posts forem publicados na mesma data, o último incluído aparece primeiro.

## Opções úteis

```bash
.\publicar-noticia.cmd "post.txt" --date "2026-08-25" --category "Mercado de energia" --tags "BESS | Mercado | Gestão"
```

Opções disponíveis:

- `--date "AAAA-MM-DD"`: data de publicação;
- `--category "Categoria"`: categoria exibida no card;
- `--tags "Tag 1 | Tag 2"`: etiquetas do card e do artigo;
- `--image "/assets/img/imagem.webp"`: imagem já salva no projeto;
- `--image-alt "Descrição"`: texto alternativo acessível;
- `--excerpt "Resumo"`: resumo do card;
- `--deck "Abertura"`: texto de abertura do artigo;
- `--slug "url-do-artigo"`: endereço personalizado.

Sem essas opções, o comando aplica padrões prontos para conteúdo sobre BESS.

## Formatação opcional do texto

O arquivo pode usar uma sintaxe simples:

```text
## Título de uma seção

> Uma frase de destaque.

- Primeiro item.
- Segundo item.

Texto com **ênfase forte** ou *itálico*.
```

Os títulos `##` também geram automaticamente o sumário lateral do artigo.

## Editar um post existente

Edite o respectivo arquivo `.md` em `noticias/posts/` e execute:

```bash
node scripts/build-blog.js
```

Não edite diretamente os cards da listagem ou o HTML dentro da pasta do artigo, pois eles são arquivos gerados.
