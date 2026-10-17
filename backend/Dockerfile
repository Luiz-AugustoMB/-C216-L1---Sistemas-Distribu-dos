FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --without dev

COPY . .

EXPOSE 8000

# Aplica as migrations pendentes antes de subir a API; o exec faz o uvicorn
# substituir o shell e receber os sinais de parada do Docker
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
