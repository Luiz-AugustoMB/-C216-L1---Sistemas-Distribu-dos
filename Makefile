.PHONY: help install test test-unit test-integration lint format run clean docker-build docker-up docker-down docker-logs docker-restart db-shell

BACKEND := backend
FRONTEND := frontend
NPM      := npm

PYTHON  := poetry run python
PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff
COMPOSE := docker compose

help:
	@echo "Comandos disponiveis:"
	@echo "  make install        - instala dependencias"
	@echo "  make test           - executa todos os testes"
	@echo "  make test-unit      - executa os testes unitarios"
	@echo "  make test-integration - executa os testes de integracao"
	@echo "  make lint           - verifica o codigo"
	@echo "  make format         - formata o codigo"
	@echo "  make run            - inicia o servidor"
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
	@echo "  make front-test-e2e - executa os testes E2E (Playwright)"
	@echo "  make docker-build   - constroi as imagens docker"
	@echo "  make docker-up      - sobe os containers em background"
	@echo "  make docker-down    - para e remove os containers"
	@echo "  make docker-logs    - mostra os logs dos containers"
	@echo "  make docker-restart - reinicia os containers"
	@echo "  make db-shell       - abre o psql dentro do container do banco"

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
	cd $(BACKEND) && $(UVICORN) main:app --reload

clean:
	find $(BACKEND) -name .venv -prune -o -type d -name "__pycache__" -exec rm -rf {} +
	find $(BACKEND) -name .venv -prune -o -type d -name ".pytest_cache" -exec rm -rf {} +

.PHONY: front-install front-e2e-install front-dev front-build front-preview front-lint front-format front-format-check front-check front-test front-test-unit front-test-integration front-test-e2e

front-install:
	cd $(FRONTEND) && $(NPM) install

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

db-shell:
	$(COMPOSE) exec db psql -U c216 -d c216
