# Acervo

Projeto final do laboratório de C216 (Sistemas Distribuídos, Inatel).

## O problema

A sala de estudos do grupo tem livros técnicos caros e poucos exemplares de cada um. Perto
das provas, todo mundo quer o mesmo livro ao mesmo tempo. Hoje o controle é informal: ninguém
sabe com quem o livro está, até quando ele fica com a pessoa nem quem pediu primeiro.

O Acervo vai registrar os empréstimos com prazo de devolução, manter uma fila de reserva por
ordem de pedido para os livros disputados, permitir renovação quando não houver ninguém na
fila e mostrar um painel com indicadores de uso do acervo.

## Stack

- Backend: FastAPI, Poetry, Ruff
- Banco de dados: PostgreSQL, SQLAlchemy, Alembic
- Frontend: React, Vite, Tailwind, Biome
- Testes: Pytest, Vitest, Playwright
- Infraestrutura: Docker Compose, GitHub Actions

## Etapas do desenvolvimento

- [x] 1. Repositório, Poetry e Makefile
- [ ] 2. Docker (Dockerfile do backend e compose com PostgreSQL)
- [ ] 3. Testes e CI (Pytest e GitHub Actions)
- [ ] 4. Persistência (SQLAlchemy e Alembic)
- [ ] 5. API e regras de negócio (FastAPI)
- [ ] 6. Frontend (React, Vite, Tailwind, Biome)
- [ ] 7. Integração, E2E e fechamento

## Como rodar

Pré-requisitos: Python 3.11, Poetry e Make.

```bash
make install
make run
```

Com a API no ar:

- http://localhost:8000/health retorna `{"status": "ok"}`
- http://localhost:8000/docs abre a documentação interativa

A porta pode ser trocada na chamada: `make run PORT=8001`.

## Comandos

```
$ make help
  help           Lista os comandos disponíveis
  install        Instala as dependências do backend
  run            Sobe a API com reload na porta PORT
  lint           Verifica o código com ruff check
  format         Formata o código com ruff format
  format-check   Verifica a formatação sem alterar os arquivos
  check          Roda lint e verificação de formatação
  clean          Remove caches do Python e do ruff
```
