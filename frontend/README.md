# Frontend — Tarefas

Interface em React para o recurso **Tarefas** do backend: cadastro, listagem,
conclusão, filtro, edição e remoção. Nesta prática o estado fica só em memória
(`useState`): não há integração com a API e os dados somem ao recarregar a página.

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
    make front-dev            # http://localhost:5173
    make front-check          # lint + formatação + imports
    make front-format         # corrige a formatação
    make front-test           # unitários + integração
    make front-test-e2e       # E2E (o Playwright sobe o Vite sozinho)
    make front-build

Ou dentro de `frontend/` com npm: `npm run dev`, `npm run check`, `npm run test`,
`npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, `npm run build`.

## Estrutura

    frontend/
    ├── src/
    │   ├── components/      # TarefaForm, TarefaItem, TarefaLista, FiltroTarefas
    │   ├── pages/           # TarefasPage: estado e regras da tela
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css        # apenas @import "tailwindcss"
    │   └── validation.js    # validação pura, mesmos limites do backend
    └── tests/
        ├── setup.js         # matchers do jest-dom + cleanup
        ├── unit/            # validation e componentes isolados
        ├── integration/     # formulário + lista na página inteira
        └── e2e/             # fluxo completo no navegador (Playwright)

Arquivos que retornam componente usam `.jsx`; lógica pura, setup e configuração usam `.js`.
Unitários e integração seguem `*.test.js(x)`; E2E segue `*.spec.js`.
