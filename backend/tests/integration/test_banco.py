from datetime import date

import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app.models import Emprestimo, Leitor, Livro, Reserva, StatusReserva


def novo_livro(**campos):
    dados = {
        "titulo": "Sistemas Distribuídos",
        "autor": "Andrew Tanenbaum",
        "isbn": "9788576051428",
        "ano": 2007,
        "exemplares": 2,
    }
    return Livro(**(dados | campos))


def novo_leitor(**campos):
    dados = {"nome": "Ana Souza", "email": "ana@exemplo.com"}
    return Leitor(**(dados | campos))


def constraint_violada(erro: pytest.ExceptionInfo[IntegrityError]) -> str:
    # O psycopg informa qual constraint barrou a operação, então o teste confere a regra
    # certa e não só que "deu erro"
    return erro.value.orig.diag.constraint_name


def test_migrations_criam_as_quatro_tabelas(db_session):
    tabelas = set(inspect(db_session.connection()).get_table_names())

    assert {"livros", "leitores", "emprestimos", "reservas"} <= tabelas


def test_isbn_duplicado_e_rejeitado(db_session):
    db_session.add(novo_livro())
    db_session.flush()

    db_session.add(novo_livro(titulo="Outra edição"))
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "ix_livros_isbn"


def test_email_de_leitor_duplicado_e_rejeitado(db_session):
    db_session.add(novo_leitor())
    db_session.flush()

    db_session.add(novo_leitor(nome="Ana Lima"))
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "ix_leitores_email"


def test_livro_com_zero_exemplares_e_rejeitado(db_session):
    db_session.add(novo_livro(exemplares=0))
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "ck_livros_exemplares_minimo_1"


def test_emprestimo_com_tres_renovacoes_e_rejeitado(db_session):
    livro, leitor = novo_livro(), novo_leitor()
    db_session.add_all([livro, leitor])
    db_session.flush()

    db_session.add(
        Emprestimo(
            livro_id=livro.id,
            leitor_id=leitor.id,
            data_emprestimo=date(2026, 3, 2),
            data_prevista=date(2026, 3, 16),
            renovacoes=3,
        )
    )
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "ck_emprestimos_renovacoes_entre_0_e_2"


def test_segunda_reserva_aberta_do_mesmo_leitor_e_rejeitada(db_session):
    livro, leitor = novo_livro(), novo_leitor()
    db_session.add_all([livro, leitor])
    db_session.flush()

    db_session.add(Reserva(livro_id=livro.id, leitor_id=leitor.id))
    db_session.flush()

    db_session.add(
        Reserva(
            livro_id=livro.id,
            leitor_id=leitor.id,
            status=StatusReserva.AGUARDANDO_RETIRADA,
        )
    )
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "ux_reservas_aberta_livro_leitor"


def test_reserva_cancelada_nao_impede_nova_reserva_na_fila(db_session):
    livro, leitor = novo_livro(), novo_leitor()
    db_session.add_all([livro, leitor])
    db_session.flush()

    db_session.add(Reserva(livro_id=livro.id, leitor_id=leitor.id, status=StatusReserva.CANCELADA))
    db_session.add(Reserva(livro_id=livro.id, leitor_id=leitor.id))
    db_session.flush()

    assert {reserva.status for reserva in livro.reservas} == {
        StatusReserva.CANCELADA,
        StatusReserva.NA_FILA,
    }


def test_excluir_livro_com_emprestimo_e_rejeitado(db_session):
    livro, leitor = novo_livro(), novo_leitor()
    db_session.add_all([livro, leitor])
    db_session.flush()
    db_session.add(
        Emprestimo(
            livro_id=livro.id,
            leitor_id=leitor.id,
            data_emprestimo=date(2026, 3, 2),
            data_prevista=date(2026, 3, 16),
        )
    )
    db_session.flush()

    db_session.delete(livro)
    with pytest.raises(IntegrityError) as erro:
        db_session.flush()

    assert constraint_violada(erro) == "fk_emprestimos_livro_id_livros"
