# Importa todos os models para registrar as tabelas no metadata que o Alembic compara
from app.models.emprestimo import Emprestimo
from app.models.leitor import Leitor
from app.models.livro import Livro
from app.models.reserva import Reserva, StatusReserva

__all__ = ["Emprestimo", "Leitor", "Livro", "Reserva", "StatusReserva"]
