.PHONY: help install test test-unit test-integration lint format run clean docker-build docker-up docker-down docker-logs docker-restart up-build logs-api db-up db-shell db-upgrade db-downgrade db-migration db-current db-history

BACKEND := backend

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
export API_PORT DB_PORT

help:
	@echo "Comandos disponiveis:"
	@echo "  make install        - instala dependencias"
	@echo "  make test           - executa todos os testes"
	@echo "  make test-unit      - executa os testes unitarios"
	@echo "  make test-integration - executa os testes de integracao"
	@echo "  make lint           - verifica o codigo"
	@echo "  make format         - formata o codigo"
	@echo "  make run            - inicia o servidor (requer o banco: make db-up)"
	@echo "  make clean          - remove arquivos temporarios"
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
	cd $(BACKEND) && poetry install

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
	$(COMPOSE) exec db psql -U c216 -d c216

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
