from datetime import date

from pydantic import BaseModel

from app.schemas.comum import LeitorResumo, LivroResumo


class EmprestimoAtrasado(BaseModel):
    emprestimo_id: int
    livro: LivroResumo
    leitor: LeitorResumo
    data_prevista: date
    dias_atraso: int


class LivroMaisEmprestado(BaseModel):
    livro: LivroResumo
    total_emprestimos: int


class PainelLer(BaseModel):
    emprestimos_atrasados: list[EmprestimoAtrasado]
    livros_mais_emprestados: list[LivroMaisEmprestado]
