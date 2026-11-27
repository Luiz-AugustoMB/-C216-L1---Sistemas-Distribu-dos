from datetime import date

import pytest

from app.services import regras
from app.services.regras import StatusEmprestimo

PREVISTA = date(2026, 3, 16)


@pytest.mark.parametrize(
    ("hoje", "devolucao", "esperado"),
    [
        (date(2026, 3, 10), None, StatusEmprestimo.ATIVO),
        (PREVISTA, None, StatusEmprestimo.ATIVO),
        (date(2026, 3, 17), None, StatusEmprestimo.ATRASADO),
        (date(2026, 3, 30), date(2026, 3, 20), StatusEmprestimo.DEVOLVIDO),
    ],
    ids=["antes-do-prazo", "no-dia-da-data-prevista", "no-dia-seguinte", "devolvido"],
)
def test_status_do_emprestimo(hoje, devolucao, esperado):
    assert regras.status_emprestimo(PREVISTA, devolucao, hoje) == esperado


@pytest.mark.parametrize(
    ("hoje", "devolucao", "esperado"),
    [
        (PREVISTA, None, 0),
        (date(2026, 3, 19), None, 3),
        (date(2026, 4, 1), date(2026, 3, 18), 2),
        (date(2026, 4, 1), date(2026, 3, 10), 0),
    ],
    ids=["em-dia", "atrasado-ha-3-dias", "devolvido-com-atraso", "devolvido-antes"],
)
def test_dias_de_atraso(hoje, devolucao, esperado):
    assert regras.dias_atraso(PREVISTA, devolucao, hoje) == esperado


def test_data_prevista_soma_o_prazo():
    assert regras.calcular_data_prevista(date(2026, 2, 20), 14) == date(2026, 3, 6)


@pytest.mark.parametrize(
    ("exemplares", "emprestados", "separados", "esperado"),
    [(3, 0, 0, 3), (3, 1, 1, 1), (2, 2, 0, 0), (2, 1, 1, 0)],
)
def test_disponiveis_desconta_emprestados_e_separados(exemplares, emprestados, separados, esperado):
    assert regras.calcular_disponiveis(exemplares, emprestados, separados) == esperado


def renovar(**campos):
    padrao = {
        "status": StatusEmprestimo.ATIVO,
        "renovacoes": 0,
        "max_renovacoes": 2,
        "tem_fila": False,
    }
    return regras.motivo_para_nao_renovar(**(padrao | campos))


def test_pode_renovar_emprestimo_em_dia_sem_fila():
    assert renovar() is None
    assert renovar(renovacoes=1) is None


@pytest.mark.parametrize(
    ("campos", "trecho"),
    [
        ({"status": StatusEmprestimo.DEVOLVIDO}, "já foi devolvido"),
        ({"status": StatusEmprestimo.ATRASADO}, "atrasado"),
        ({"renovacoes": 2}, "máximo"),
        ({"tem_fila": True}, "fila de reserva"),
    ],
    ids=["devolvido", "atrasado", "no-maximo", "com-fila"],
)
def test_motivos_para_nao_renovar(campos, trecho):
    assert trecho in renovar(**campos)


def test_devolvido_e_recusado_antes_de_olhar_a_fila():
    motivo = renovar(status=StatusEmprestimo.DEVOLVIDO, tem_fila=True)

    assert "devolvido" in motivo


def emprestar(**campos):
    padrao = {
        "tem_atraso": False,
        "emprestimos_abertos": 0,
        "max_emprestimos": 3,
        "ja_esta_com_o_livro": False,
    }
    return regras.motivo_para_nao_emprestar(**(padrao | campos))


def test_motivos_para_nao_emprestar_seguem_a_ordem_das_regras():
    assert emprestar() is None
    assert emprestar(emprestimos_abertos=2) is None
    assert "atrasado" in emprestar(tem_atraso=True, emprestimos_abertos=3)
    assert "3 empréstimos ativos" in emprestar(emprestimos_abertos=3, ja_esta_com_o_livro=True)
    assert "já está com este livro" in emprestar(ja_esta_com_o_livro=True)


@pytest.mark.parametrize(
    ("hoje", "vencida"),
    [(date(2026, 3, 4), False), (date(2026, 3, 5), True)],
    ids=["no-dia-de-expira-em", "no-dia-seguinte"],
)
def test_vencimento_da_reserva(hoje, vencida):
    assert regras.reserva_vencida(date(2026, 3, 4), hoje) is vencida


def test_expiracao_da_reserva_soma_o_prazo_de_retirada():
    assert regras.calcular_expiracao_reserva(date(2026, 3, 2), 2) == date(2026, 3, 4)
