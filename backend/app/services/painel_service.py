from datetime import date

from sqlalchemy.orm import Session

from app.repositories import emprestimo_repository, livro_repository
from app.schemas.comum import LeitorResumo, LivroResumo
from app.schemas.painel import EmprestimoAtrasado, LivroMaisEmprestado, PainelLer
from app.services import regras, reserva_service

LIMITE_MAIS_EMPRESTADOS = 5


def obter(db: Session, hoje: date) -> PainelLer:
    reserva_service.processar_vencidas(db, hoje)

    atrasados = [
        EmprestimoAtrasado(
            emprestimo_id=emprestimo.id,
            livro=LivroResumo(id=emprestimo.livro.id, titulo=emprestimo.livro.titulo),
            leitor=LeitorResumo(id=emprestimo.leitor.id, nome=emprestimo.leitor.nome),
            data_prevista=emprestimo.data_prevista,
            dias_atraso=regras.dias_atraso(emprestimo.data_prevista, None, hoje),
        )
        for emprestimo in emprestimo_repository.em_aberto(db)
        if regras.status_emprestimo(emprestimo.data_prevista, None, hoje)
        == regras.StatusEmprestimo.ATRASADO
    ]
    atrasados.sort(key=lambda item: (-item.dias_atraso, item.emprestimo_id))

    mais_emprestados = [
        LivroMaisEmprestado(
            livro=LivroResumo(id=livro.id, titulo=livro.titulo), total_emprestimos=total
        )
        for livro, total in livro_repository.mais_emprestados(db, LIMITE_MAIS_EMPRESTADOS)
    ]
    return PainelLer(emprestimos_atrasados=atrasados, livros_mais_emprestados=mais_emprestados)
