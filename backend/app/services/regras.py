"""Regras do acervo em funções puras.

Nada aqui acessa banco ou relógio: tudo chega por parâmetro. Assim cada regra é testada
com datas escolhidas a dedo, sem PostgreSQL, e os services só juntam os dados e chamam.
"""

import enum
from datetime import date, timedelta


class StatusEmprestimo(enum.StrEnum):
    ATIVO = "ativo"
    ATRASADO = "atrasado"
    DEVOLVIDO = "devolvido"


def status_emprestimo(
    data_prevista: date, data_devolucao: date | None, hoje: date
) -> StatusEmprestimo:
    if data_devolucao is not None:
        return StatusEmprestimo.DEVOLVIDO
    # No próprio dia da data prevista o empréstimo ainda está em dia
    if hoje > data_prevista:
        return StatusEmprestimo.ATRASADO
    return StatusEmprestimo.ATIVO


def dias_atraso(data_prevista: date, data_devolucao: date | None, hoje: date) -> int:
    if data_devolucao is not None:
        return max(0, (data_devolucao - data_prevista).days)
    return max(0, (hoje - data_prevista).days)


def calcular_data_prevista(inicio: date, prazo_dias: int) -> date:
    return inicio + timedelta(days=prazo_dias)


def calcular_disponiveis(exemplares: int, emprestados: int, separados: int) -> int:
    return exemplares - emprestados - separados


def motivo_para_nao_emprestar(
    *,
    tem_atraso: bool,
    emprestimos_abertos: int,
    max_emprestimos: int,
    ja_esta_com_o_livro: bool,
) -> str | None:
    """Devolve a mensagem do primeiro impedimento, na ordem das regras, ou None."""
    if tem_atraso:
        return "O leitor tem empréstimo atrasado e precisa devolver antes de pegar outro livro."
    if emprestimos_abertos >= max_emprestimos:
        return f"O leitor já tem {max_emprestimos} empréstimos ativos."
    if ja_esta_com_o_livro:
        return "O leitor já está com este livro."
    return None


def motivo_para_nao_renovar(
    *, status: StatusEmprestimo, renovacoes: int, max_renovacoes: int, tem_fila: bool
) -> str | None:
    """Devolve a mensagem do primeiro impedimento, na ordem das regras, ou None."""
    if status == StatusEmprestimo.DEVOLVIDO:
        return "Este empréstimo já foi devolvido e não pode ser renovado."
    if status == StatusEmprestimo.ATRASADO:
        return "Empréstimo atrasado não pode ser renovado. Devolva o livro."
    if renovacoes >= max_renovacoes:
        return f"Este empréstimo já foi renovado {max_renovacoes} vezes, o máximo permitido."
    if tem_fila:
        return "Há fila de reserva para este livro, então o empréstimo não pode ser renovado."
    return None


def reserva_vencida(expira_em: date, hoje: date) -> bool:
    # O leitor pode retirar até o fim do dia de expira_em
    return hoje > expira_em


def calcular_expiracao_reserva(hoje: date, prazo_dias: int) -> date:
    return hoje + timedelta(days=prazo_dias)
