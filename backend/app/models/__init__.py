# Importar os modelos aqui registra todas as tabelas em Base.metadata,
# que é o que o Alembic compara com o banco no --autogenerate.
from app.models.tarefa import Tarefa

__all__ = ["Tarefa"]
