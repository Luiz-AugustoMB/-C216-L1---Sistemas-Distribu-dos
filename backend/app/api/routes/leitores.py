from fastapi import APIRouter, status

from app.api.deps import Db, Hoje, IdNaRota
from app.schemas.emprestimo import EmprestimoLer
from app.schemas.leitor import LeitorAtualizar, LeitorAtualizarParcial, LeitorCriar, LeitorLer
from app.services import leitor_service

router = APIRouter(prefix="/leitores", tags=["leitores"])


@router.get("", response_model=list[LeitorLer])
def listar_leitores(db: Db, hoje: Hoje, busca: str | None = None):
    """Busca em nome e e-mail."""
    return leitor_service.listar(db, hoje, busca=busca)


@router.get("/{leitor_id}", response_model=LeitorLer)
def obter_leitor(leitor_id: IdNaRota, db: Db, hoje: Hoje):
    return leitor_service.obter(db, leitor_id, hoje)


@router.get("/{leitor_id}/emprestimos", response_model=list[EmprestimoLer])
def listar_emprestimos_do_leitor(leitor_id: IdNaRota, db: Db, hoje: Hoje):
    return leitor_service.listar_emprestimos(db, leitor_id, hoje)


@router.post("", response_model=LeitorLer, status_code=status.HTTP_201_CREATED)
def criar_leitor(dados: LeitorCriar, db: Db, hoje: Hoje):
    return leitor_service.criar(db, dados, hoje)


@router.put("/{leitor_id}", response_model=LeitorLer)
def atualizar_leitor(leitor_id: IdNaRota, dados: LeitorAtualizar, db: Db, hoje: Hoje):
    return leitor_service.atualizar(db, leitor_id, dados.model_dump(), hoje)


@router.patch("/{leitor_id}", response_model=LeitorLer)
def atualizar_leitor_parcial(
    leitor_id: IdNaRota, dados: LeitorAtualizarParcial, db: Db, hoje: Hoje
):
    return leitor_service.atualizar(db, leitor_id, dados.campos_enviados(), hoje)


@router.delete("/{leitor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_leitor(leitor_id: IdNaRota, db: Db):
    leitor_service.excluir(db, leitor_id)
