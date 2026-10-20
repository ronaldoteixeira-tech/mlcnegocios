---
name: publicar-post-blog-mlc
description: Publicar, subir ou criar artigos e notícias no blog da MLC Negócios, incluindo arquivo Markdown, página gerada, card da listagem, metadados, validação e deploy. Usar sempre que o usuário pedir um novo post de blog neste repositório. Quando o usuário não fornecer uma imagem junto com o texto, gerar obrigatoriamente uma capa inédita e específica para o artigo; nunca reutilizar uma imagem antiga como padrão.
---

# Publicar post no blog da MLC

Publicar artigos completos no padrão editorial e técnico deste repositório. Tratar a capa inédita como parte obrigatória da entrega.

## Fluxo

1. Ler o conteúdo recebido e inspecionar `noticias/README.md`, um post recente em `noticias/posts/` e o estado do Git.
2. Definir título, slug, data, categoria, resumo, descrição, abertura, tags e intertítulos sem alterar o sentido do texto.
3. Resolver a imagem antes de criar o post:
   - Se o usuário fornecer uma imagem, salvar uma cópia otimizada em `assets/img/` e usá-la.
   - Se o usuário não fornecer uma imagem, usar a skill `imagegen` e a ferramenta integrada de geração de imagens para criar uma capa inédita e específica para o assunto.
   - Nunca escolher uma imagem já existente em `assets/img/` apenas por conveniência.
4. Salvar a capa como `assets/img/blog-<slug-curto>.webp` ou `.jpg`, preferencialmente em proporção 16:9, com pelo menos 1600 px de largura e tamanho otimizado para web.
5. Inspecionar visualmente o arquivo final. Rejeitar imagens com texto acidental, marcas, logotipos, artefatos, equipamentos incoerentes ou baixa relação com o artigo.
6. Criar o post em `noticias/posts/<slug>.md`, informando explicitamente `image`, `imageAlt` e `imageCaption`.
7. Executar `npm run blog:build` e a validação disponível na branch: `npm run blog:validate` e, quando existir o painel editorial, `npm run test:mvp`.
8. Conferir que o novo card aparece primeiro, que a página usa a nova capa e que não houve alterações colaterais em outros artigos.
9. Quando o usuário pedir para subir ou publicar, fazer commit e push na branch de produção e na branch editorial aplicável, acompanhar a automação e confirmar a URL pública com HTTP 200.

## Especificação da capa gerada

Montar o prompt a partir do tema central do artigo. Preferir fotografia editorial corporativa fotorrealista, composição horizontal, leitura clara em miniatura e enquadramento seguro para recorte responsivo. Exigir sempre:

- imagem inédita;
- relação direta com o tema do post;
- ausência de texto, letras, números, marcas, logotipos e marca-d'água;
- aparência profissional e tecnicamente plausível;
- nome de arquivo exclusivo e sem sobrescrever outro ativo.

Usar o modo integrado da skill `imagegen`. Manter o arquivo original gerado fora do repositório e copiar para o projeto apenas a versão final otimizada.

## Guardrails

- Não publicar um novo post sem uma imagem própria ou fornecida pelo usuário.
- Não usar `/assets/img/bess-o-que-e.webp` nem qualquer outra imagem existente como fallback automático.
- Se a geração da imagem falhar, interromper a publicação e relatar o bloqueio; não substituir silenciosamente por uma capa antiga.
- Não editar diretamente o HTML gerado quando a mudança puder ser feita no Markdown e recompilada.
- Preservar alterações preexistentes do usuário e limitar o commit aos arquivos da publicação.

