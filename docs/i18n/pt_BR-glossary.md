# Brazilian Portuguese Glossary

Use Brazilian Portuguese (pt-BR) as it is written in Brazilian newsrooms and software interfaces. Prefer consistency over stylistic variation. Where `po/pt_BR.po` already had a consistent translation for a term, this glossary follows it. See "Known inconsistencies" for the terms where it does not.

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
- dateline -> linha de data
- sign-off -> sign-off (not `assinatura`, which is byline and subscription)
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
- takedown -> retirada
- post (planning) -> publicar (not `postar`)
- feature preview -> prévia de recursos (trying out new features; not `mídia principal`, which is feature media)
- model (AI) -> modelo (same word as template; the two do not share a screen)

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

## Patterns

- Date and size ranges: `from` -> `de`, `to` -> `até` (`Published to` -> `Publicado até`). Use `para` only for a destination (`Sent To` -> `Enviado para`).
- Negative search filters: `Not X` -> `Exceto X` (`Not Desk` -> `Exceto desk`).
- Durations: translate `time` as `tempo`, not `hora` (`Time to publish` -> `Tempo até a publicação`).
- Days of the month: plain numbers (`2nd` -> `2`), so `no dia {{day}}` reads correctly.
- A noun that looks like a verb: check the source before translating (`Show code` is the code of a show, `Set Disabled` is a status, `Monitor` is a widget name).

## Known inconsistencies

Older entries in `po/pt_BR.po` use other words for some terms. The glossary term is the one to use; the older entries still need a pass.

- article: older entries say `artigo`
- story: older entries say `história`
- delete: older entries say `remover` or `apagar`
- upload: older entries keep `Upload`
- toggle: older entries say `Ativar/Desativar`
- embed: older entries say `inserção`
- stage: some older entries say `etapa`
- search: some older entries say `busca`
- status: some older entries say `estado`

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
