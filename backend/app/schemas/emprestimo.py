from datetime import date

from pydantic import BaseModel

from app.schemas.comum import IdRegistro, LeitorResumo, LivroResumo
from app.services.regras import StatusEmprestimo


class EmprestimoCriar(BaseModel):
    livro_id: IdRegistro
    leitor_id: IdRegistro


class EmprestimoLer(BaseModel):
    id: int
    livro: LivroResumo
    leitor: LeitorResumo
    data_emprestimo: date
    data_prevista: date
    data_devolucao: date | None
    renovacoes: int
    status: StatusEmprestimo
    dias_atraso: int
