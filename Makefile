.PHONY: help install test lint format run clean docker-build docker-up docker-down docker-logs docker-restart db-shell

BACKEND := backend

PYTHON  := poetry run python
PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff
COMPOSE := docker compose

help:
	@echo "Comandos disponiveis:"
	@echo "  make install        - instala dependencias"
	@echo "  make test           - executa testes"
	@echo "  make lint           - verifica o codigo"
	@echo "  make format         - formata o codigo"
	@echo "  make run            - inicia o servidor"
	@echo "  make clean          - remove arquivos temporarios"
	@echo "  make docker-build   - constroi as imagens docker"
	@echo "  make docker-up      - sobe os containers em background"
	@echo "  make docker-down    - para e remove os containers"
	@echo "  make docker-logs    - mostra os logs dos containers"
	@echo "  make docker-restart - reinicia os containers"
	@echo "  make db-shell       - abre o psql dentro do container do banco"

install:
	cd $(BACKEND) && poetry install

test:
	cd $(BACKEND) && $(PYTEST)

lint:
	cd $(BACKEND) && $(RUFF) check .

format:
	cd $(BACKEND) && $(RUFF) format .

run:
	cd $(BACKEND) && $(UVICORN) main:app --reload

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

db-shell:
	$(COMPOSE) exec db psql -U c216 -d c216
