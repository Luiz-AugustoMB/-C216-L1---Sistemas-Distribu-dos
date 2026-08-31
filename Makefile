.PHONY: help install test lint format run clean

BACKEND := backend

PYTHON  := poetry run python
PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff

help:
	@echo "Comandos disponiveis:"
	@echo "  make install  - instala dependencias"
	@echo "  make test     - executa testes"
	@echo "  make lint     - verifica o codigo"
	@echo "  make format   - formata o codigo"
	@echo "  make run      - inicia o servidor"
	@echo "  make clean    - remove arquivos temporarios"

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
