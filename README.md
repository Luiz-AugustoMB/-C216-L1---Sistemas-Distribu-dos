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

## Estrutura do backend

    backend/
    ├── main.py            # inicializa o app e registra os routers
    ├── routers/           # endpoints HTTP (root, tarefas)
    ├── schemas/           # modelos Pydantic
    ├── repositories/      # armazenamento em memória das tarefas
    └── tests/
        ├── conftest.py    # fixtures compartilhadas (repo e client)
        ├── unit/          # testes do repositório, sem HTTP
        └── integration/   # testes dos endpoints com TestClient

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

Com o servidor rodando (`make run`), a documentação interativa fica em http://127.0.0.1:8000/docs.
