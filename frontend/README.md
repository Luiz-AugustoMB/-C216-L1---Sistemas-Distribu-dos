# Frontend — Tarefas

Interface em React para o recurso **Tarefas** do backend: cadastro, listagem,
conclusão, filtro, edição e remoção. Os dados vêm da API, que grava no PostgreSQL, e
o filtro usa o query parameter `?concluida=` do `GET /tarefas`.
A URL da API vem de `VITE_API_URL` e é embutida no bundle durante o build. Não há valor
padrão no código: `make front-dev` exporta a variável, e o Docker a recebe como build arg.

## Stack

- React + Vite (JavaScript, sem TypeScript)
- Tailwind CSS v4 (plugin `@tailwindcss/vite`, sem `tailwind.config.js`)
- Biome (lint + formatação)
- Vitest + React Testing Library + jsdom + user-event (unitários e integração)
- Playwright (E2E)

## Comandos

Pela raiz do projeto, com o Makefile:

    make front-install        # npm install
    make front-e2e-install    # instala o Chromium do Playwright (uma vez)
    make front-dev            # http://localhost:5173 (precisa da API: make run)
    make front-check          # lint + formatação + imports
    make front-format         # corrige a formatação
    make front-test           # unitários + integração
    make front-test-e2e       # E2E (o Playwright sobe uma stack isolada no Docker)
    make front-build

Ou dentro de `frontend/` com npm: `npm run dev`, `npm run check`, `npm run test`,
`npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run build`.

## Estrutura

    frontend/
    ├── src/
    │   ├── components/      # TarefaForm, TarefaItem, TarefaLista, FiltroTarefas, MensagemErro
    │   ├── pages/           # TarefasPage: estado da tela e chamadas aos serviços
    │   ├── services/        # api.js (função request) e um módulo por entidade
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css        # apenas @import "tailwindcss"
    │   └── validation.js    # validação pura, mesmos limites do backend
    └── tests/
        ├── setup.js         # matchers do jest-dom + cleanup
        ├── helpers/         # apiFalsa.js: fetch simulado, sem API nem banco
        ├── unit/            # validation, serviços, request e componentes isolados
        ├── integration/     # página + serviços + request, com o fetch simulado
        └── e2e/             # fluxo real no navegador contra frontend, API e banco

Arquivos que retornam componente usam `.jsx`; lógica pura, setup e configuração usam `.js`.
Unitários e integração seguem `*.test.js(x)`; E2E segue `*.spec.js`.
