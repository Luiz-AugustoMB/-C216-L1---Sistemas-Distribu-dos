import os

# Fora do Compose o banco é acessado pela porta publicada em localhost (DB_PORT,
# a mesma usada no docker-compose.yml); dentro do Compose a variável
# DATABASE_URL aponta para o serviço "db".
DB_PORT = os.getenv("DB_PORT", "5432")
# Mesmas variáveis do serviço db no Compose, para make run e make db-* acompanharem o .env
DB_USER = os.getenv("POSTGRES_USER", "c216")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "c216")
DB_NAME = os.getenv("POSTGRES_DB", "c216")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@localhost:{DB_PORT}/{DB_NAME}",
)

# Origens explícitas do frontend, separadas por vírgula. Para o navegador,
# localhost e 127.0.0.1 são origens diferentes, por isso as duas no padrão.
CORS_ORIGINS = [
    origem.strip()
    for origem in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origem.strip()
]
