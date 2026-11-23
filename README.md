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
- [x] 2. Docker (Dockerfile do backend e compose com PostgreSQL)
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

## Rodando com Docker

Pré-requisito: Docker Desktop em execução.

```bash
make env   # cria o .env a partir do .env.example
make up    # faz o build e sobe o banco e a API
make ps    # db e backend devem aparecer como healthy
```

Com os serviços no ar:

- http://localhost:8000/health retorna `{"status": "ok"}`
- http://localhost:8000/docs abre a documentação interativa

Nesta etapa a API ainda não usa o banco: o PostgreSQL sobe ao lado dela e a conexão entra
na Etapa 4.

Se as portas 8000 ou 5432 já estiverem em uso, basta trocar `API_PORT` e `DB_PORT` no
`.env`.

## Variáveis de ambiente

O `.env` é criado pelo `make env` e não vai para o repositório.

| Variável | Para que serve | Padrão no `.env.example` |
|---|---|---|
| `POSTGRES_USER` | Usuário do PostgreSQL | `acervo` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `troque-esta-senha` |
| `POSTGRES_DB` | Nome do banco | `acervo` |
| `API_PORT` | Porta da API no host | `8000` |
| `DB_PORT` | Porta do PostgreSQL no host | `5432` |

O backend recebe essas variáveis já montadas na `DATABASE_URL`, apontando para o serviço
`db`.

O PostgreSQL só usa `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` na primeira vez
que sobe, quando cria o volume. Para trocar algum deles depois, rode `make reset`, que
apaga os dados, e `make up` de novo.

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
  env            Cria o .env a partir do .env.example, se ainda não existir
  up             Faz o build e sobe os serviços em segundo plano
  down           Derruba os serviços (os dados do banco ficam no volume)
  build          Faz só o build das imagens
  restart        Derruba e sobe os serviços de novo
  ps             Mostra o estado e a saúde dos serviços
  logs           Acompanha os logs (SERVICE=backend ou SERVICE=db para um só)
  db-shell       Abre o psql no container do banco
  api-shell      Abre um shell no container do backend
  reset          Derruba os serviços e APAGA o volume com todos os dados do banco
```
