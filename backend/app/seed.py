"""Cadastra livros e leitores de exemplo. Uso: python -m app.seed

Só grava se não houver nenhum livro nem leitor, então rodar de novo não duplica nada e
nunca mistura os exemplos com dados de verdade.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_session_factory
from app.models import Leitor, Livro

LIVROS = [
    ("Designing Data-Intensive Applications", "Martin Kleppmann", "9781449373320", 2017, 2),
    ("Distributed Systems", "Maarten van Steen e Andrew S. Tanenbaum", "9781543057386", 2017, 1),
    (
        "Computer Networking: A Top-Down Approach",
        "James Kurose e Keith Ross",
        "9780133594140",
        2016,
        2,
    ),
    ("Introduction to Algorithms", "Thomas H. Cormen e outros", "9780262033848", 2009, 3),
    ("Clean Code", "Robert C. Martin", "9780132350884", 2008, 1),
    ("The Pragmatic Programmer", "David Thomas e Andrew Hunt", "9780135957059", 2019, 1),
]

LEITORES = [
    ("Ana Souza", "ana.souza@exemplo.com"),
    ("Bruno Lima", "bruno.lima@exemplo.com"),
    ("Carla Mendes", "carla.mendes@exemplo.com"),
    ("Diego Rocha", "diego.rocha@exemplo.com"),
]


def banco_vazio(db: Session) -> bool:
    livros = db.scalar(select(func.count()).select_from(Livro))
    leitores = db.scalar(select(func.count()).select_from(Leitor))
    return livros == 0 and leitores == 0


def semear(db: Session) -> bool:
    """Grava os exemplos e devolve True, ou não faz nada e devolve False."""
    if not banco_vazio(db):
        return False
    db.add_all(
        Livro(titulo=titulo, autor=autor, isbn=isbn, ano=ano, exemplares=exemplares)
        for titulo, autor, isbn, ano, exemplares in LIVROS
    )
    db.add_all(Leitor(nome=nome, email=email) for nome, email in LEITORES)
    db.commit()
    return True


def main() -> None:
    with get_session_factory()() as db:
        if semear(db):
            print(f"Cadastrados {len(LIVROS)} livros e {len(LEITORES)} leitores de exemplo.")
        else:
            print("O banco já tem livros ou leitores. Nada foi cadastrado.")


if __name__ == "__main__":
    main()
