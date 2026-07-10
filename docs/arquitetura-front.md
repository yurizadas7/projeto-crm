# Arquitetura do front

## Estado atual

O front funciona como uma demo SaaS local. A persistencia principal ainda usa `localStorage` para manter o app simples e sem banco.

Arquivos principais:

- `index.html`: estrutura de telas e modais.
- `css/style.css`: layout responsivo e componentes visuais.
- `js/api-client.js`: cliente HTTP opcional para falar com a API mock.
- `js/custom.js`: regras da aplicacao, renderizacao e estado local.

## Proxima modularizacao recomendada

Quando o projeto for crescer mais, dividir `custom.js` nestes arquivos:

- `js/core/state.js`
- `js/core/utils.js`
- `js/services/local-api.js`
- `js/services/http-api.js`
- `js/modules/auth.js`
- `js/modules/clients.js`
- `js/modules/team.js`
- `js/modules/settings.js`
- `js/modules/plans.js`
- `js/modules/assistant.js`
- `js/modules/reports.js`
- `js/app.js`

## Por que nao quebrar tudo agora

O app ainda e estatico e sem bundler. Uma modularizacao total exigiria transformar o carregamento para `type="module"` e revalidar todos os fluxos. Por isso, a primeira etapa foi criar um modulo seguro (`api-client.js`) e manter o app atual funcionando.
