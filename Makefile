BACKEND_DIR := backend
POETRY := poetry
APP := app.main:app
HOST := 127.0.0.1
PORT := 8000

.DEFAULT_GOAL := help

.PHONY: help install run lint format format-check check clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*## ' "$(firstword $(MAKEFILE_LIST))" | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  %-14s %s\n", $$1, $$2}'

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

clean: ## Remove caches do Python e do ruff
	find "$(BACKEND_DIR)" -path "$(BACKEND_DIR)/.venv" -prune -o -type d -name __pycache__ -exec rm -rf {} +
	rm -rf "$(BACKEND_DIR)/.ruff_cache"
