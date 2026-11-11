import os

# Fora do Compose o banco é acessado pela porta publicada em localhost (DB_PORT,
# a mesma usada no docker-compose.yml); dentro do Compose a variável
# DATABASE_URL aponta para o serviço "db".
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = os.getenv(
    "DATABASE_URL", f"postgresql+psycopg://c216:c216@localhost:{DB_PORT}/c216"
)
