from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Vem da variável DATABASE_URL: no compose aponta para o serviço db, fora dele o
    # Makefile monta a URL com localhost
    database_url: str


@lru_cache
def get_settings() -> Settings:
    # Lido só na primeira chamada: importar a aplicação não exige a variável definida
    return Settings()
