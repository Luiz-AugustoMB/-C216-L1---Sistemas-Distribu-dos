FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_CACHE_DIR=/tmp/poetry-cache \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin acervo

# Mesma versão que gerou o poetry.lock, para o install não reclamar do lock
RUN pip install --no-cache-dir poetry==2.4.1

# Dependências antes do código: esta camada só é refeita quando elas mudam
COPY pyproject.toml poetry.lock poetry.toml ./
RUN poetry install --only main && rm -rf "$POETRY_CACHE_DIR"

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

USER acervo

EXPOSE 8000

# O banco fica sempre na última migration antes da API aceitar requisições. Sem script
# .sh: o sh -c roda a sequência e o exec deixa o uvicorn como processo principal, que
# recebe direto o sinal do docker stop
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
