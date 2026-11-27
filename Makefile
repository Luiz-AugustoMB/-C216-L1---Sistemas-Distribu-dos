# As variáveis do .env viram variáveis do make; sem o arquivo (no CI), nada é lido
-include .env

# Fora do Docker o banco é acessado pela porta publicada no localhost. Com ?=, uma
# DATABASE_URL já definida no ambiente (a do CI) tem prioridade
DB_PORT ?= 5432
DATABASE_URL ?= postgresql+psycopg://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(DB_PORT)/$(POSTGRES_DB)
export DATABASE_URL

# Os testes locais usam um banco separado no mesmo PostgreSQL, para não esbarrar nos dados
# do make seed. No CI a DATABASE_URL do workflow já aponta para um banco descartável
TEST_DB := $(POSTGRES_DB)_teste
ifeq ($(origin DATABASE_URL),environment)
TEST_DATABASE_URL ?= $(DATABASE_URL)
else
TEST_DATABASE_URL ?= postgresql+psycopg://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(DB_PORT)/$(TEST_DB)
endif

BACKEND_DIR := backend
POETRY := poetry
PYTEST := $(POETRY) run pytest
ALEMBIC := $(POETRY) run alembic
APP := app.main:app
HOST := 127.0.0.1
PORT := 8000
COMPOSE := docker compose
SERVICE ?=

.DEFAULT_GOAL := help

.PHONY: help install run lint format format-check check test test-unit test-integration clean \
	env up down build restart ps logs db-shell api-shell reset \
	db-up db-teste migrate migrate-down migration seed

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*## ' "$(firstword $(MAKEFILE_LIST))" | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  %-18s %s\n", $$1, $$2}'

install: ## Instala as dependências do backend
	cd "$(BACKEND_DIR)" && $(POETRY) install

run: ## Sobe a API com reload na porta PORT
	cd "$(BACKEND_DIR)" && $(POETRY) run uvicorn $(APP) --reload --host $(HOST) --port $(PORT)

lint: ## Verifica o código com ruff check
	cd "$(BACKEND_DIR)" && $(POETRY) run ruff check .

format: ## Formata o código com ruff format
	cd "$(BACKEND_DIR)" && $(POETRY) run ruff format .

format-check: ## Verifica a formatação sem alterar os arquivos
	cd "$(BACKEND_DIR)" && $(POETRY) run ruff format --check .

check: lint format-check ## Roda lint e verificação de formatação

test: db-teste ## Sobe o banco de testes e roda todos os testes do projeto
	cd "$(BACKEND_DIR)" && DATABASE_URL="$(TEST_DATABASE_URL)" $(PYTEST)

test-unit: ## Roda só os testes unitários do backend
	cd "$(BACKEND_DIR)" && DATABASE_URL="$(TEST_DATABASE_URL)" $(PYTEST) tests/unit

# Não sobe o banco: no CI ele vem do service do GitHub Actions. Localmente, rode make db-teste antes
test-integration: ## Roda só os testes de integração do backend (precisam do banco no ar)
	cd "$(BACKEND_DIR)" && DATABASE_URL="$(TEST_DATABASE_URL)" $(PYTEST) tests/integration

clean: ## Remove caches do Python, do ruff e do pytest
	find "$(BACKEND_DIR)" -path "$(BACKEND_DIR)/.venv" -prune -o -type d -name __pycache__ -exec rm -rf {} +
	rm -rf "$(BACKEND_DIR)/.ruff_cache" "$(BACKEND_DIR)/.pytest_cache"

env: ## Cria o .env a partir do .env.example, se ainda não existir
	@if [ -f .env ]; then echo ".env encontrado, nada foi alterado"; \
	else cp .env.example .env && echo ".env criado a partir do .env.example"; fi

up: ## Faz o build e sobe os serviços em segundo plano
	$(COMPOSE) up --build -d

down: ## Derruba os serviços (os dados do banco ficam no volume)
	$(COMPOSE) down

build: ## Faz só o build das imagens
	$(COMPOSE) build

restart: ## Derruba e sobe os serviços de novo
	$(COMPOSE) down
	$(COMPOSE) up --build -d

ps: ## Mostra o estado e a saúde dos serviços
	$(COMPOSE) ps

logs: ## Acompanha os logs (SERVICE=backend ou SERVICE=db para um só)
	$(COMPOSE) logs -f $(SERVICE)

db-shell: ## Abre o psql no container do banco
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

api-shell: ## Abre um shell no container do backend
	$(COMPOSE) exec backend sh

reset: ## Derruba os serviços e APAGA o volume com todos os dados do banco
	$(COMPOSE) down -v

db-up: ## Sobe só o banco e espera ele ficar saudável
	$(COMPOSE) up -d --wait db

db-teste: db-up ## Cria o banco dos testes locais no PostgreSQL do compose, se ainda não existir
	$(COMPOSE) exec -T db sh -c 'psql -U "$$POSTGRES_USER" -d postgres -lqt | cut -d "|" -f 1 | grep -qw "$(TEST_DB)" || createdb -U "$$POSTGRES_USER" "$(TEST_DB)"'

seed: ## Cadastra livros e leitores de exemplo no container (só se o banco estiver vazio)
	$(COMPOSE) exec backend python -m app.seed

migrate: db-up ## Aplica as migrations pendentes no banco do compose
	cd "$(BACKEND_DIR)" && $(ALEMBIC) upgrade head

migrate-down: db-up ## Desfaz a última migration aplicada
	cd "$(BACKEND_DIR)" && $(ALEMBIC) downgrade -1

# A descrição é conferida antes de subir o banco, para o erro aparecer na hora
migration: ## Gera uma migration por autogenerate (MSG="descricao")
	@if [ -z "$(MSG)" ]; then echo 'Faltou a descricao: make migration MSG="descricao"'; exit 1; fi
	$(COMPOSE) up -d --wait db
	cd "$(BACKEND_DIR)" && $(ALEMBIC) revision --autogenerate -m "$(MSG)"
