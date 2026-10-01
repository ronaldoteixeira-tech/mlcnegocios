# Teste do painel editorial — MVP

## Objetivo

Confirmar que uma pessoa do time consegue criar, revisar e publicar uma notícia pelo navegador, sem usar IDE, terminal ou editar arquivos manualmente.

## Ambiente seguro

- Repositório: `ronaldoteixeira-tech/mlcnegocios`
- Branch do teste: `teste-painel-mvp`
- Painel: `https://app.pagescms.org/`
- Conteúdo de teste: `Teste MVP: publicação pelo painel`
- A branch `main` não deve ser selecionada durante o teste.

## Preparação do responsável

1. Instalar o GitHub App do Pages CMS com acesso apenas ao repositório `mlcnegocios`.
2. Entrar em `https://app.pagescms.org/` usando uma conta GitHub autorizada.
3. Abrir o repositório `mlcnegocios`.
4. Selecionar a branch `teste-painel-mvp`.
5. Abrir a coleção **Notícias**.
6. Confirmar que o item **Teste MVP: publicação pelo painel** aparece como rascunho.
7. Abrir a aba **Actions** do GitHub e confirmar que o workflow **Validar e gerar blog** está disponível.

## Sessão de teste

Use uma pessoa que não participou da implementação. O responsável observa e registra dúvidas, mas só ajuda se o participante ficar bloqueado.

### Cenário 1 — editar um rascunho

1. Abrir o artigo de teste.
2. Alterar o título acrescentando o nome do participante entre parênteses.
3. Adicionar um parágrafo ao conteúdo.
4. Conferir a imagem, a descrição acessível e as tags.
5. Manter o status **Rascunho**.
6. Salvar.

Resultado esperado:

- A alteração aparece no histórico do GitHub.
- O workflow termina sem erros.
- O artigo não aparece na listagem pública da branch.
- Nenhuma pasta pública é criada para o slug do rascunho.

### Cenário 2 — enviar para revisão

1. Alterar o status para **Em revisão**.
2. Salvar novamente.
3. Pedir para uma segunda pessoa localizar e revisar o conteúdo no painel.

Resultado esperado:

- O artigo continua fora do site público.
- O revisor entende o que precisa conferir sem abrir o GitHub.

### Cenário 3 — publicar

1. Corrigir eventuais observações.
2. Alterar o status para **Publicado**.
3. Salvar.
4. Aguardar o workflow **Validar e gerar blog** concluir.
5. Abrir a URL de preview da branch no Cloudflare Pages.
6. Conferir o card, a página, a capa e a versão mobile.

Resultado esperado:

- O artigo aparece como o mais recente.
- A URL `/noticias/teste-mvp-publicacao-pelo-painel/` funciona.
- Título, data, imagem, tags e conteúdo estão corretos.
- O layout não apresenta rolagem horizontal ou texto cortado.

### Cenário 4 — retirar do ar

1. Voltar o status para **Rascunho**.
2. Salvar.
3. Aguardar o workflow concluir.

Resultado esperado:

- O card desaparece da listagem.
- A pasta pública do artigo é removida.
- O arquivo Markdown continua disponível no painel.

## Métricas de aceite

O MVP é aprovado se:

- o participante concluir a primeira publicação em até 15 minutos;
- nenhuma IDE ou terminal for utilizado;
- nenhum metadado obrigatório ficar ausente;
- rascunhos e itens em revisão permanecerem fora do site;
- a automação terminar sem erros;
- a publicação e a retirada do ar ocorrerem em até 5 minutos cada;
- o participante atribuir nota mínima 4 de 5 para facilidade de uso.

## Perguntas finais ao participante

1. Em qual etapa você ficou em dúvida?
2. Algum nome de campo pareceu técnico ou confuso?
3. Você se sentiria seguro publicando sozinho?
4. Faltou alguma opção de formatação?
5. A diferença entre rascunho, revisão e publicado ficou clara?

## Encerramento

Depois do teste, deixe o artigo temporário como **Rascunho**. Não faça merge da branch até os ajustes encontrados na sessão serem revisados.
