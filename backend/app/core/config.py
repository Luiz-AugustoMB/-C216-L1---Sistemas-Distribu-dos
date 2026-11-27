from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Vem da variável DATABASE_URL: no compose aponta para o serviço db, fora dele o
    # Makefile monta a URL com localhost
    database_url: str

    # Regras do acervo. Cada uma pode ser trocada por variável de ambiente com o mesmo
    # nome em maiúsculas, por exemplo PRAZO_EMPRESTIMO_DIAS=7
    prazo_emprestimo_dias: int = 14
    max_emprestimos_ativos: int = 3
    max_renovacoes: int = 2
    prazo_retirada_reserva_dias: int = 2
    fuso_horario: str = "America/Sao_Paulo"


@lru_cache
def get_settings() -> Settings:
    # Lido só na primeira chamada: importar a aplicação não exige a variável definida
    return Settings()
