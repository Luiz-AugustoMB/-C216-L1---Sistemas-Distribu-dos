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
- [x] 3. Testes e CI (Pytest e GitHub Actions)
- [x] 4. Persistência (SQLAlchemy e Alembic)
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

Antes de subir a API, o container do backend aplica as migrations pendentes
(`alembic upgrade head`).

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

O backend lê a conexão da variável `DATABASE_URL`, montada a partir dessas variáveis:

- no container do backend, o compose aponta a URL para o serviço `db`, na porta 5432;
- fora do Docker (`make test`, `make migrate`, `make migration`), o Makefile monta a URL com
  `localhost` e a `DB_PORT`. Uma `DATABASE_URL` já definida no ambiente, como a do CI, tem
  prioridade.

O PostgreSQL só usa `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` na primeira vez
que sobe, quando cria o volume. Para trocar algum deles depois, rode `make reset`, que
apaga os dados, e `make up` de novo.

## Banco de dados e migrations

O banco é PostgreSQL, acessado pelo SQLAlchemy com o driver psycopg 3. São quatro tabelas:

- `livros`: título, autor, ISBN, ano e quantidade de exemplares.
- `leitores`: nome e e-mail de quem pega livros.
- `emprestimos`: liga um livro a um leitor, com a data do empréstimo, a data prevista de
  devolução, a data em que foi devolvido e o número de renovações.
- `reservas`: fila de espera de um livro, na ordem de criação, com o status de cada pedido.

O status do empréstimo (ativo, atrasado ou devolvido) não fica em coluna: é calculado a
partir das datas.

Estas regras ficam no próprio banco e valem para qualquer escrita, não só para a da API:

- ISBN do livro e e-mail do leitor são únicos.
- CHECKs: `exemplares >= 1`, `renovacoes` entre 0 e 2, data prevista não anterior à data
  do empréstimo e status da reserva só com os valores `na_fila`, `aguardando_retirada`,
  `concluida`, `expirada` e `cancelada`.
- Índice único parcial: um leitor só pode ter uma reserva aberta (`na_fila` ou
  `aguardando_retirada`) por livro. As reservas fechadas ficam no histórico sem bloquear
  uma nova.
- As FKs de empréstimos e reservas não têm exclusão em cascata: o banco recusa excluir um
  livro ou leitor que tenha empréstimo ou reserva.

O esquema é criado pelas migrations do Alembic, em `backend/alembic/versions/`. O container
do backend aplica as pendentes sempre que sobe. Para rodar na máquina local, contra o banco
do compose:

```bash
make migrate                    # aplica as migrations pendentes
make migrate-down               # desfaz a última migration
make migration MSG="descricao"  # gera uma migration nova a partir dos models
```

Toda migration gerada por autogenerate precisa ser revisada antes do commit: o Alembic não
percebe tudo (por exemplo, a troca do nome de uma coluna vira remoção e criação).

## Testes

Os testes do backend ficam em `backend/tests/` e usam Pytest:

- `unit/`: chamam as funções direto, sem HTTP, servidor nem banco.
- `integration/`: fazem requisições à aplicação pelo `TestClient` do FastAPI e conferem
  status, corpo e cabeçalhos da resposta, ou gravam no PostgreSQL de verdade para conferir
  as regras do banco.

As fixtures ficam em `backend/tests/conftest.py`:

- `client`: o `TestClient` da aplicação.
- `db_session`: aplica as migrations uma vez por execução e roda cada teste dentro de uma
  transação desfeita no final, então nenhum dado fica no banco. Os testes de `/health` não
  usam essa fixture e passam sem banco.

```bash
make test               # sobe o banco e roda todos os testes
make test-unit          # só os unitários
make test-integration   # só os de integração (o banco precisa estar no ar: make db-up)
```

Os testes das regras de negócio entram na Etapa 5.

## Integração contínua

O workflow `.github/workflows/ci-backend.yml` roda no GitHub Actions a cada push na branch
`projeto-final` e em pull requests para `main`. Ele só dispara quando a mudança mexe em
`backend/`, no `Makefile` ou no próprio workflow.

São dois jobs:

- `Ruff`: roda `make check`.
- `Pytest`: só começa se o `Ruff` passar. Sobe um PostgreSQL 16 como service do job, com
  um banco de teste descartável, e roda `make test-unit` e `make test-integration` em steps
  separados.

Os jobs chamam os mesmos alvos do Makefile usados na máquina local, então o CI roda
exatamente os mesmos comandos que rodam aqui.

## Comandos

```
$ make help
  help               Lista os comandos disponíveis
  install            Instala as dependências do backend
  run                Sobe a API com reload na porta PORT
  lint               Verifica o código com ruff check
  format             Formata o código com ruff format
  format-check       Verifica a formatação sem alterar os arquivos
  check              Roda lint e verificação de formatação
  test               Sobe o banco e roda todos os testes do projeto
  test-unit          Roda só os testes unitários do backend
  test-integration   Roda só os testes de integração do backend (precisam do banco no ar)
  clean              Remove caches do Python, do ruff e do pytest
  env                Cria o .env a partir do .env.example, se ainda não existir
  up                 Faz o build e sobe os serviços em segundo plano
  down               Derruba os serviços (os dados do banco ficam no volume)
  build              Faz só o build das imagens
  restart            Derruba e sobe os serviços de novo
  ps                 Mostra o estado e a saúde dos serviços
  logs               Acompanha os logs (SERVICE=backend ou SERVICE=db para um só)
  db-shell           Abre o psql no container do banco
  api-shell          Abre um shell no container do backend
  reset              Derruba os serviços e APAGA o volume com todos os dados do banco
  db-up              Sobe só o banco e espera ele ficar saudável
  migrate            Aplica as migrations pendentes no banco do compose
  migrate-down       Desfaz a última migration aplicada
  migration          Gera uma migration por autogenerate (MSG="descricao")
```
