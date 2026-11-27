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

    # Origens do frontend liberadas no CORS, separadas por vírgula. Texto simples em vez de
    # lista porque o pydantic-settings só converte lista a partir de JSON
    cors_origins: str = "http://localhost:5173"

    @property
    def origens_cors(self) -> list[str]:
        return [origem.strip() for origem in self.cors_origins.split(",") if origem.strip()]


@lru_cache
def get_settings() -> Settings:
    # Lido uma vez e reaproveitado. O main.py lê na montagem do app por causa do CORS, então
    # a DATABASE_URL precisa existir no ambiente, mas nenhuma conexão é aberta nesse momento
    return Settings()
