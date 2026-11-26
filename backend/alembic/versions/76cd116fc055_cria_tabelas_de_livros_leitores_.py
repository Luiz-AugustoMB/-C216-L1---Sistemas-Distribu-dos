"""cria tabelas de livros, leitores, emprestimos e reservas

Revision ID: 76cd116fc055
Revises:
Create Date: 2026-11-26 14:57:21.329345

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "76cd116fc055"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "leitores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column(
            "criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_leitores")),
    )
    op.create_index(op.f("ix_leitores_email"), "leitores", ["email"], unique=True)
    op.create_table(
        "livros",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("autor", sa.String(length=200), nullable=False),
        sa.Column("isbn", sa.String(length=20), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("exemplares", sa.Integer(), nullable=False),
        sa.Column(
            "criado_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.CheckConstraint("exemplares >= 1", name=op.f("ck_livros_exemplares_minimo_1")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_livros")),
    )
    op.create_index(op.f("ix_livros_isbn"), "livros", ["isbn"], unique=True)
    op.create_table(
        "emprestimos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("livro_id", sa.Integer(), nullable=False),
        sa.Column("leitor_id", sa.Integer(), nullable=False),
        sa.Column("data_emprestimo", sa.Date(), nullable=False),
        sa.Column("data_prevista", sa.Date(), nullable=False),
        sa.Column("data_devolucao", sa.Date(), nullable=True),
        sa.Column("renovacoes", sa.Integer(), server_default="0", nullable=False),
        sa.CheckConstraint(
            "data_prevista >= data_emprestimo",
            name=op.f("ck_emprestimos_prevista_depois_do_emprestimo"),
        ),
        sa.CheckConstraint(
            "renovacoes BETWEEN 0 AND 2", name=op.f("ck_emprestimos_renovacoes_entre_0_e_2")
        ),
        sa.ForeignKeyConstraint(
            ["leitor_id"],
            ["leitores.id"],
            name=op.f("fk_emprestimos_leitor_id_leitores"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["livro_id"],
            ["livros.id"],
            name=op.f("fk_emprestimos_livro_id_livros"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_emprestimos")),
    )
    op.create_index(op.f("ix_emprestimos_leitor_id"), "emprestimos", ["leitor_id"], unique=False)
    op.create_index(op.f("ix_emprestimos_livro_id"), "emprestimos", ["livro_id"], unique=False)
    op.create_table(
        "reservas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("livro_id", sa.Integer(), nullable=False),
        sa.Column("leitor_id", sa.Integer(), nullable=False),
        sa.Column(
            "criada_em", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "status",
            sa.Enum(
                "na_fila",
                "aguardando_retirada",
                "concluida",
                "expirada",
                "cancelada",
                name="status",
                native_enum=False,
                create_constraint=True,
                length=30,
            ),
            server_default="na_fila",
            nullable=False,
        ),
        sa.Column("separada_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expira_em", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(
            ["leitor_id"],
            ["leitores.id"],
            name=op.f("fk_reservas_leitor_id_leitores"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["livro_id"],
            ["livros.id"],
            name=op.f("fk_reservas_livro_id_livros"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reservas")),
    )
    op.create_index(op.f("ix_reservas_leitor_id"), "reservas", ["leitor_id"], unique=False)
    op.create_index(op.f("ix_reservas_livro_id"), "reservas", ["livro_id"], unique=False)
    op.create_index(
        "ux_reservas_aberta_livro_leitor",
        "reservas",
        ["livro_id", "leitor_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('na_fila', 'aguardando_retirada')"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ux_reservas_aberta_livro_leitor",
        table_name="reservas",
        postgresql_where=sa.text("status IN ('na_fila', 'aguardando_retirada')"),
    )
    op.drop_index(op.f("ix_reservas_livro_id"), table_name="reservas")
    op.drop_index(op.f("ix_reservas_leitor_id"), table_name="reservas")
    op.drop_table("reservas")
    op.drop_index(op.f("ix_emprestimos_livro_id"), table_name="emprestimos")
    op.drop_index(op.f("ix_emprestimos_leitor_id"), table_name="emprestimos")
    op.drop_table("emprestimos")
    op.drop_index(op.f("ix_livros_isbn"), table_name="livros")
    op.drop_table("livros")
    op.drop_index(op.f("ix_leitores_email"), table_name="leitores")
    op.drop_table("leitores")
