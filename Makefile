BACKEND_DIR := backend
POETRY := poetry
PYTEST := $(POETRY) run pytest
APP := app.main:app
HOST := 127.0.0.1
PORT := 8000
COMPOSE := docker compose
SERVICE ?=

.DEFAULT_GOAL := help

.PHONY: help install run lint format format-check check test test-unit test-integration clean \
	env up down build restart ps logs db-shell api-shell reset

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

test: ## Roda todos os testes do projeto
	cd "$(BACKEND_DIR)" && $(PYTEST)

test-unit: ## Roda só os testes unitários do backend
	cd "$(BACKEND_DIR)" && $(PYTEST) tests/unit

test-integration: ## Roda só os testes de integração do backend
	cd "$(BACKEND_DIR)" && $(PYTEST) tests/integration

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
