from fastapi import APIRouter, status

from app.api.deps import Db, Hoje, IdNaRota, IdNoFiltro
from app.schemas.emprestimo import EmprestimoCriar, EmprestimoLer
from app.services import emprestimo_service
from app.services.regras import StatusEmprestimo

router = APIRouter(prefix="/emprestimos", tags=["emprestimos"])


@router.get("", response_model=list[EmprestimoLer])
def listar_emprestimos(
    db: Db,
    hoje: Hoje,
    status: StatusEmprestimo | None = None,
    livro_id: IdNoFiltro = None,
    leitor_id: IdNoFiltro = None,
):
    return emprestimo_service.listar(
        db, hoje, status=status, livro_id=livro_id, leitor_id=leitor_id
    )


@router.get("/{emprestimo_id}", response_model=EmprestimoLer)
def obter_emprestimo(emprestimo_id: IdNaRota, db: Db, hoje: Hoje):
    return emprestimo_service.obter(db, emprestimo_id, hoje)


@router.post("", response_model=EmprestimoLer, status_code=status.HTTP_201_CREATED)
def criar_emprestimo(dados: EmprestimoCriar, db: Db, hoje: Hoje):
    return emprestimo_service.criar(db, dados, hoje)


@router.post("/{emprestimo_id}/devolucao", response_model=EmprestimoLer)
def devolver_emprestimo(emprestimo_id: IdNaRota, db: Db, hoje: Hoje):
    return emprestimo_service.devolver(db, emprestimo_id, hoje)


@router.post("/{emprestimo_id}/renovacao", response_model=EmprestimoLer)
def renovar_emprestimo(emprestimo_id: IdNaRota, db: Db, hoje: Hoje):
    return emprestimo_service.renovar(db, emprestimo_id, hoje)
