from sqlalchemy import func, select

from app.models import Leitor, Livro
from app.seed import LEITORES, LIVROS, semear


def contar(db_session, model):
    return db_session.scalar(select(func.count()).select_from(model))


def test_seed_cadastra_uma_vez_so(db_session):
    assert semear(db_session) is True
    assert semear(db_session) is False

    assert contar(db_session, Livro) == len(LIVROS)
    assert contar(db_session, Leitor) == len(LEITORES)


def test_seed_nao_mexe_em_banco_com_dados(db_session):
    db_session.add(Leitor(nome="Já cadastrado", email="ja@exemplo.com"))
    db_session.flush()

    assert semear(db_session) is False
    assert contar(db_session, Livro) == 0
