# Brazilian Portuguese Glossary

Use Brazilian Portuguese (pt-BR) as it is written in Brazilian newsrooms and software interfaces. Prefer consistency over stylistic variation. Where `po/pt_BR.po` already has a translation for a term, this glossary follows it, so new entries match the existing ones.

## Core Terms

- article -> matéria
- story -> matéria
- item -> item
- content -> conteúdo
- headline -> manchete
- slugline -> slugline
- byline -> assinatura
- abstract -> resumo
- body -> corpo
- dateline -> linha de data (the existing `Dateline -> Subtítulo` is wrong; leave it as it is and flag it for review)
- editorial note -> nota editorial
- desk -> desk
- stage -> estágio
- workspace -> área de trabalho
- monitoring -> monitoramento
- personal space -> espaço pessoal
- marked for me -> marcados para mim
- assignment -> atribuição
- planning -> planejamento
- planning item -> item de planejamento
- event -> evento
- coverage -> cobertura
- agenda -> agenda
- template -> modelo
- content profile -> perfil de conteúdo
- vocabulary -> vocabulário
- subject -> assunto
- genre -> gênero
- urgency -> urgência
- priority -> prioridade
- picture -> imagem
- package -> pacote
- highlights -> destaques
- ingest -> ingest
- takes -> takes
- embargo -> embargo
- archive -> arquivo
- settings -> preferências
- dashboard -> painel
- user -> usuário
- role -> função
- language -> idioma
- translation -> tradução

- asset -> ativo (follows the existing `URL de Ativos`)
- set (of assets) -> conjunto
- feature media -> mídia principal
- featured stories -> matérias em destaque
- rendition -> versão
- rundown -> rundown
- show (broadcast programme) -> programa
- provider -> provedor
- subscriber -> assinante
- subscription -> assinatura
- workflow -> fluxo de trabalho
- status -> status
- widget -> widget
- webhook -> webhook
- tag -> tag
- crop -> corte
- thumbnail -> miniatura
- timezone -> fuso horário
- timeline -> linha do tempo
- trash -> lixeira
- mobile -> celular
- embed -> incorporar

## Actions

- upload -> enviar
- exclude (a filter) -> omitir (keeps `excluir` for delete)
- include -> incluir
- toggle -> alternar
- unlink -> desvincular
- unpin -> desafixar
- fulfil (an assignment) -> cumprir

- publish -> publicar
- unpublish -> despublicar
- correct -> corrigir
- kill -> eliminar
- spike -> suspender
- unspike -> cancelar suspensão
- fetch -> buscar
- send to -> enviar para
- duplicate -> duplicar
- rewrite -> reescrever
- schedule -> agendar
- save -> salvar
- cancel -> cancelar
- close -> fechar
- delete -> excluir
- edit -> editar
- search -> pesquisar (when it is a verb or a search field; keep `Buscar` where it already means fetch)
- filter -> filtro (noun), filtrar (verb)
- preview -> pré-visualização

## Tone

- Keep labels short and UI-friendly.
- Use the infinitive for actions and buttons, for example `Salvar`, `Fechar`, `Publicar`.
- Address the user with the neutral `você` forms only when a sentence needs a subject; prefer impersonal phrasing.
- Use Brazilian spelling and vocabulary (`usuário`, `arquivo`, `excluir`, `salvar`), not European Portuguese (`utilizador`, `ficheiro`, `eliminar` for delete, `guardar`).
- Keep product names such as `Superdesk`, `Newshub` and `Planning` in menus where they name the product, untranslated.

## Consistency Rules

- Preserve established translations already present in `po/pt_BR.po` unless they are clearly wrong and separately approved for correction.
- Do not translate placeholders, field identifiers, or internal codes.
- If a source term is ambiguous, leave it for manual review instead of forcing a glossary match.
