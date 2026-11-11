# -C216-L1---Sistemas-Distribu-dos

## Como executar os testes

Tudo de uma vez (backend, frontend e E2E), partindo de um clone limpo:

    make test-all    # requer Python 3.11+, Poetry, Node 24 e o Docker aberto

O `test-all` instala as dependências do backend e do frontend e o Chromium do Playwright,
roda os testes do backend e os unitários e de integração do frontend, e no E2E sobe
uma cópia isolada dos três containers (projeto `c216-e2e`, portas 15173, 18000 e 15432),
que é removida ao final.

Só o backend (pré-requisitos: Python 3.11+, Poetry):

    make test              # unitários e integração do backend
    make test-unit         # apenas tests/unit
    make test-integration  # apenas tests/integration

Ou diretamente:

    cd backend
    poetry install
    poetry run pytest -v

Os testes de integração usam SQLite em memória por padrão, então não precisam do Docker.
Para rodá-los contra o PostgreSQL (como a CI faz), defina `TEST_DATABASE_URL`:

    make db-up
    TEST_DATABASE_URL=postgresql+psycopg://c216:c216@localhost:5432/c216 make test-integration

## Como executar a aplicação

Com Docker Compose (frontend + API + PostgreSQL). A API aplica as migrations ao iniciar:

    make up-build
    make logs-api

| Serviço  | Endereço                     |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| API      | http://localhost:8000        |
| Swagger  | http://localhost:8000/docs   |

Os containers sobem em cascata: `db` -> `backend` -> `frontend`, cada um esperando o
anterior ficar saudável (`depends_on` com `condition: service_healthy`).

Ou só o banco no Docker e a API local:

    make db-up
    make db-upgrade
    make run

A conexão é configurada pela variável `DATABASE_URL`. Sem ela, a API monta a URL com
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e `DB_PORT` (padrão `c216`/`c216`/`c216`
em `localhost:5432`, só para desenvolvimento); dentro do Compose ela aponta para o serviço `db`.
As credenciais reais ficam no `.env`, que não é versionado.

### Portas em uso

Se as portas 8000, 5432 ou 5173 já estiverem ocupadas na sua máquina (outro projeto ou um
PostgreSQL instalado localmente), crie um `.env` a partir do exemplo e troque as portas do host:

    cp .env.example .env    # ex.: API_PORT=8001 e DB_PORT=5433

O Docker Compose e o Makefile leem o `.env`, então `make up-build`, `make run` e os
comandos `make db-*` passam a usar as novas portas. No Compose, `VITE_API_URL` e `CORS_ORIGINS`
acompanham `API_PORT` e `FRONTEND_PORT`, então só precisam ser definidas para sobrescrever.

### CORS

A API só aceita requisições do navegador vindas das origens em `CORS_ORIGINS`
(`app/core/config.py`), nunca de `*`. No Compose a origem acompanha `FRONTEND_PORT`.

## Migrations (Alembic)

    make db-migration msg="descricao da mudanca"  # gera a partir dos modelos ORM
    make db-upgrade                                # aplica as pendentes
    make db-downgrade                              # desfaz a ultima
    make db-current                                # versao atual do banco
    make db-history                                # historico

Sempre revise o arquivo gerado em `backend/alembic/versions/` antes de aplicar.

## Estrutura do backend

    backend/
    ├── app/
    │   ├── main.py           # inicializa o app, registra as rotas e o handler de 404
    │   ├── api/
    │   │   ├── dependencies.py  # monta sessão -> repository -> service por requisição
    │   │   └── routes/       # endpoints HTTP (root, tarefas)
    │   ├── schemas/          # modelos Pydantic: entrada e saída da API
    │   ├── services/         # regras de negócio
    │   ├── repositories/     # acesso aos dados com SQLAlchemy
    │   ├── models/           # modelos ORM (tabelas)
    │   ├── database/         # Base declarativa, engine e sessão (get_db)
    │   └── core/             # configurações (DATABASE_URL)
    ├── alembic/
    │   ├── env.py            # usa a DATABASE_URL e os metadados dos modelos
    │   └── versions/         # migrations versionadas
    ├── alembic.ini
    └── tests/
        ├── unit/             # service com repository falso, sem banco nem HTTP
        └── integration/      # endpoints e repository contra um banco real

Fluxo de uma requisição:

    Route -> Service -> Repository -> SQLAlchemy -> PostgreSQL

## Endpoints

| Método | Rota                  | Descrição                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | `/`                   | Mensagem de boas-vindas                     |
| GET    | `/tarefas`            | Lista tarefas (query opcional `?concluida=`)|
| GET    | `/tarefas/{id}`       | Busca uma tarefa                            |
| POST   | `/tarefas`            | Cria uma tarefa                             |
| PUT    | `/tarefas/{id}`       | Substitui a tarefa inteira                  |
| PATCH  | `/tarefas/{id}`       | Atualiza apenas os campos enviados          |
| DELETE | `/tarefas/{id}`       | Remove uma tarefa                           |

Com o servidor rodando, a documentação interativa fica em http://127.0.0.1:8000/docs.
