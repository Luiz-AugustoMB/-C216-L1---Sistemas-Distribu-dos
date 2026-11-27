from fastapi import APIRouter, status

from app.api.deps import Db, Hoje, IdNaRota
from app.schemas.livro import LivroAtualizar, LivroAtualizarParcial, LivroCriar, LivroLer
from app.services import livro_service

router = APIRouter(prefix="/livros", tags=["livros"])


@router.get("", response_model=list[LivroLer])
def listar_livros(db: Db, hoje: Hoje, busca: str | None = None, disponivel: bool | None = None):
    """Busca em título e autor; disponivel=true traz só os que têm exemplar livre."""
    return livro_service.listar(db, hoje, busca=busca, disponivel=disponivel)


@router.get("/{livro_id}", response_model=LivroLer)
def obter_livro(livro_id: IdNaRota, db: Db, hoje: Hoje):
    return livro_service.obter(db, livro_id, hoje)


@router.post("", response_model=LivroLer, status_code=status.HTTP_201_CREATED)
def criar_livro(dados: LivroCriar, db: Db):
    return livro_service.criar(db, dados)


@router.put("/{livro_id}", response_model=LivroLer)
def atualizar_livro(livro_id: IdNaRota, dados: LivroAtualizar, db: Db, hoje: Hoje):
    return livro_service.atualizar(db, livro_id, dados.model_dump(), hoje)


@router.patch("/{livro_id}", response_model=LivroLer)
def atualizar_livro_parcial(livro_id: IdNaRota, dados: LivroAtualizarParcial, db: Db, hoje: Hoje):
    return livro_service.atualizar(db, livro_id, dados.campos_enviados(), hoje)


@router.delete("/{livro_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_livro(livro_id: IdNaRota, db: Db):
    livro_service.excluir(db, livro_id)
