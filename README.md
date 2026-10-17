# -C216-L1---Sistemas-Distribu-dos

## Como executar os testes

Pré-requisitos: Python 3.11+, Poetry.

    make install
    make test              # todos os testes
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

Com Docker Compose (API + PostgreSQL). A API aplica as migrations ao iniciar:

    make up-build
    make logs-api

Ou só o banco no Docker e a API local:

    make db-up
    make db-upgrade
    make run

A conexão é configurada pela variável `DATABASE_URL`. O padrão é
`postgresql+psycopg://c216:c216@localhost:5432/c216`; dentro do Compose ela aponta para o serviço `db`.

### Portas em uso

Se as portas 8000 ou 5432 já estiverem ocupadas na sua máquina (outro projeto ou um
PostgreSQL instalado localmente), crie um `.env` a partir do exemplo e troque as portas do host:

    cp .env.example .env    # ex.: API_PORT=8001 e DB_PORT=5433

O Docker Compose e o Makefile leem o `.env`, então `make up-build`, `make run` e os
comandos `make db-*` passam a usar as novas portas sem outras mudanças.

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
