from datetime import date

from sqlalchemy.orm import Session

from app.core.erros import RecursoNaoEncontrado, RegraDeNegocioViolada
from app.models import Livro
from app.repositories import livro_repository
from app.repositories.livro_repository import OcupacaoLivro
from app.schemas.livro import LivroCriar, LivroLer
from app.services import regras, reserva_service


def para_leitura(livro: Livro, ocupacao: OcupacaoLivro) -> LivroLer:
    return LivroLer(
        id=livro.id,
        titulo=livro.titulo,
        autor=livro.autor,
        isbn=livro.isbn,
        ano=livro.ano,
        exemplares=livro.exemplares,
        criado_em=livro.criado_em,
        disponiveis=regras.calcular_disponiveis(
            livro.exemplares, ocupacao.emprestados, ocupacao.separados
        ),
        emprestados=ocupacao.emprestados,
        separados_para_reserva=ocupacao.separados,
        tamanho_fila=ocupacao.na_fila,
    )


def _buscar_ou_falhar(db: Session, livro_id: int) -> Livro:
    livro = livro_repository.buscar(db, livro_id)
    if livro is None:
        raise RecursoNaoEncontrado("Livro não encontrado.")
    return livro


def _ler(db: Session, livro: Livro) -> LivroLer:
    return para_leitura(livro, livro_repository.ocupacao(db, [livro.id])[livro.id])


def _garantir_isbn_livre(db: Session, isbn: str, livro_id: int | None = None) -> None:
    existente = livro_repository.buscar_por_isbn(db, isbn)
    if existente is not None and existente.id != livro_id:
        raise RegraDeNegocioViolada("Já existe um livro cadastrado com este ISBN.")


def listar(
    db: Session, hoje: date, busca: str | None = None, disponivel: bool | None = None
) -> list[LivroLer]:
    reserva_service.processar_vencidas(db, hoje)
    livros = livro_repository.listar(db, busca)
    ocupacoes = livro_repository.ocupacao(db, [livro.id for livro in livros])
    resultado = [para_leitura(livro, ocupacoes[livro.id]) for livro in livros]
    if disponivel is not None:
        resultado = [livro for livro in resultado if (livro.disponiveis > 0) == disponivel]
    return resultado


def obter(db: Session, livro_id: int, hoje: date) -> LivroLer:
    reserva_service.processar_vencidas(db, hoje)
    return _ler(db, _buscar_ou_falhar(db, livro_id))


def criar(db: Session, dados: LivroCriar) -> LivroLer:
    _garantir_isbn_livre(db, dados.isbn)
    livro = livro_repository.adicionar(db, Livro(**dados.model_dump()))
    db.commit()
    return para_leitura(livro, OcupacaoLivro())


def atualizar(db: Session, livro_id: int, campos: dict, hoje: date) -> LivroLer:
    """Serve ao PUT (todos os campos) e ao PATCH (só os enviados)."""
    reserva_service.processar_vencidas(db, hoje)
    livro = _buscar_ou_falhar(db, livro_id)

    if "isbn" in campos:
        _garantir_isbn_livre(db, campos["isbn"], livro.id)
    if "exemplares" in campos:
        ocupacao = livro_repository.ocupacao(db, [livro.id])[livro.id]
        em_uso = ocupacao.emprestados + ocupacao.separados
        if campos["exemplares"] < em_uso:
            raise RegraDeNegocioViolada(
                f"O livro tem {em_uso} exemplares emprestados ou separados para reserva. "
                "A quantidade não pode ficar abaixo disso."
            )

    for campo, valor in campos.items():
        setattr(livro, campo, valor)
    db.flush()
    # Exemplares novos vão primeiro para quem já está esperando na fila
    reserva_service.promover_fila(db, livro, hoje)
    db.commit()
    return _ler(db, livro)


def excluir(db: Session, livro_id: int) -> None:
    livro = _buscar_ou_falhar(db, livro_id)
    if livro_repository.possui_historico(db, livro.id):
        raise RegraDeNegocioViolada(
            "Este livro tem empréstimos ou reservas registrados e não pode ser excluído, "
            "para não perder o histórico."
        )
    livro_repository.excluir(db, livro)
    db.commit()
