.PHONY: help install test lint format run clean

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
	poetry install

test:
	$(PYTEST)

lint:
	$(RUFF) check .

format:
	$(RUFF) format .

run:
	$(UVICORN) main:app --reload

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
