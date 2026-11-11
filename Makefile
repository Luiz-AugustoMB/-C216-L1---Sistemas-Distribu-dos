.PHONY: help install test test-all test-unit test-integration lint format run clean docker-build docker-up docker-down docker-logs docker-restart up-build logs-api db-up db-shell db-upgrade db-downgrade db-migration db-current db-history

BACKEND := backend
FRONTEND := frontend
NPM      := npm

PYTHON  := poetry run python
PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff
ALEMBIC := poetry run alembic
COMPOSE := docker compose

# Portas do host: os valores do .env (opcional, ver .env.example) tem prioridade.
# Exportadas para o Alembic e a API locais usarem a mesma porta do Compose.
-include .env
API_PORT ?= 8000
DB_PORT  ?= 5432
VITE_API_URL ?= http://localhost:$(API_PORT)
POSTGRES_USER     ?= c216
POSTGRES_PASSWORD ?= c216
POSTGRES_DB       ?= c216
export API_PORT DB_PORT VITE_API_URL POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB

# So no make run: exportar para todos faria os testes de CORS dependerem do .env
ifdef CORS_ORIGINS
run: export CORS_ORIGINS := $(CORS_ORIGINS)
endif

help:
	@echo "Comandos disponiveis:"
	@echo "  make install        - instala dependencias"
	@echo "  make test-all       - instala tudo e executa TODOS os testes: backend, frontend e E2E (requer Docker)"
	@echo "  make test           - executa os testes do backend"
	@echo "  make test-unit      - executa os testes unitarios do backend"
	@echo "  make test-integration - executa os testes de integracao do backend"
	@echo "  make lint           - verifica o codigo"
	@echo "  make format         - formata o codigo"
	@echo "  make run            - inicia o servidor (requer o banco: make db-up)"
	@echo "  make clean          - remove arquivos temporarios"
	@echo "  make front-install  - instala dependencias do frontend"
	@echo "  make front-e2e-install - instala o Chromium usado pelo Playwright"
	@echo "  make front-dev      - inicia o Vite em modo desenvolvimento"
	@echo "  make front-build    - gera o build de producao do frontend"
	@echo "  make front-preview  - serve o build de producao localmente"
	@echo "  make front-lint     - verifica o frontend com o Biome"
	@echo "  make front-format   - formata o frontend com o Biome"
	@echo "  make front-format-check - verifica a formatacao sem alterar arquivos"
	@echo "  make front-check    - lint + formatacao + imports (Biome)"
	@echo "  make front-test     - executa os testes unitarios e de integracao (Vitest)"
	@echo "  make front-test-unit - executa apenas os testes unitarios do frontend"
	@echo "  make front-test-integration - executa apenas os testes de integracao do frontend"
	@echo "  make front-test-e2e - sobe uma stack isolada no Docker e executa os testes E2E (Playwright)"
	@echo "  make docker-build   - constroi as imagens docker"
	@echo "  make docker-up      - sobe os containers em background"
	@echo "  make docker-down    - para e remove os containers"
	@echo "  make docker-logs    - mostra os logs dos containers"
	@echo "  make docker-restart - reinicia os containers"
	@echo "  make up-build       - reconstroi as imagens e sobe os containers"
	@echo "  make logs-api       - mostra os logs da API"
	@echo "  make db-up          - sobe apenas o PostgreSQL"
	@echo "  make db-shell       - abre o psql dentro do container do banco"
	@echo "  make db-upgrade     - aplica as migrations pendentes"
	@echo "  make db-downgrade   - desfaz a ultima migration"
	@echo "  make db-migration msg=\"descricao\" - gera uma migration a partir dos modelos"
	@echo "  make db-current     - mostra a versao atual do banco"
	@echo "  make db-history     - mostra o historico de migrations"

install:
	cd $(BACKEND) && poetry install --no-root

# Parte de um ambiente limpo: instala as dependencias e o Chromium, e o E2E sobe
# os containers sozinho. Para na primeira etapa que falhar, da mais rapida para a mais lenta
test-all: install front-install front-e2e-install test front-test front-test-e2e

test:
	cd $(BACKEND) && $(PYTEST) -v

test-unit:
	cd $(BACKEND) && $(PYTEST) tests/unit -v

test-integration:
	cd $(BACKEND) && $(PYTEST) tests/integration -v

lint:
	cd $(BACKEND) && $(RUFF) check .

format:
	cd $(BACKEND) && $(RUFF) format .

run:
	cd $(BACKEND) && $(UVICORN) app.main:app --reload --port $(API_PORT)

clean:
	find $(BACKEND) -name .venv -prune -o -type d -name "__pycache__" -exec rm -rf {} +
	find $(BACKEND) -name .venv -prune -o -type d -name ".pytest_cache" -exec rm -rf {} +

.PHONY: front-install front-e2e-install front-dev front-build front-preview front-lint front-format front-format-check front-check front-test front-test-unit front-test-integration front-test-e2e

# npm ci instala exatamente o package-lock.json, sem reescrever o arquivo
front-install:
	cd $(FRONTEND) && $(NPM) ci

front-e2e-install:
	cd $(FRONTEND) && npx playwright install chromium

front-dev:
	cd $(FRONTEND) && $(NPM) run dev

front-build:
	cd $(FRONTEND) && $(NPM) run build

front-preview:
	cd $(FRONTEND) && $(NPM) run preview

front-lint:
	cd $(FRONTEND) && $(NPM) run lint

front-format:
	cd $(FRONTEND) && $(NPM) run format

front-format-check:
	cd $(FRONTEND) && $(NPM) run format:check

front-check:
	cd $(FRONTEND) && $(NPM) run check

front-test:
	cd $(FRONTEND) && $(NPM) run test

front-test-unit:
	cd $(FRONTEND) && $(NPM) run test:unit

front-test-integration:
	cd $(FRONTEND) && $(NPM) run test:integration

front-test-e2e:
	cd $(FRONTEND) && $(NPM) run test:e2e

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f

docker-restart: docker-down docker-up

up-build:
	$(COMPOSE) up -d --build

logs-api:
	$(COMPOSE) logs -f backend

db-up:
	$(COMPOSE) up -d db

db-shell:
	$(COMPOSE) exec db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

# Os comandos db-* abaixo rodam fora do container e usam o banco publicado em
# localhost:$(DB_PORT) (padrao de app/core/config.py); suba-o antes com make db-up.
db-upgrade:
	cd $(BACKEND) && $(ALEMBIC) upgrade head

db-downgrade:
	cd $(BACKEND) && $(ALEMBIC) downgrade -1

db-migration:
	cd $(BACKEND) && $(ALEMBIC) revision --autogenerate -m "$(msg)"

db-current:
	cd $(BACKEND) && $(ALEMBIC) current

db-history:
	cd $(BACKEND) && $(ALEMBIC) history
