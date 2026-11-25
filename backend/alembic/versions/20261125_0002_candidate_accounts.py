"""Add candidate accounts and profile ownership."""

from alembic import op
import sqlalchemy as sa

revision = "20261125_0002"
down_revision = "20261123_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "candidate_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=256), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email", name="uq_candidate_users_email"),
    )
    op.drop_constraint("ck_candidate_profiles_single_workspace", "candidate_profiles", type_="check")
    op.add_column("candidate_profiles", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_candidate_profiles_user_id_candidate_users",
        "candidate_profiles",
        "candidate_users",
        ["user_id"],
        ["id"],
    )
    op.create_unique_constraint("uq_candidate_profiles_user_id", "candidate_profiles", ["user_id"])
    # The legacy profile used an explicit id=1, which may be ahead of the SERIAL sequence.
    op.execute(
        "SELECT setval(pg_get_serial_sequence('candidate_profiles', 'id'), "
        "COALESCE((SELECT MAX(id) FROM candidate_profiles), 1), true)"
    )


def downgrade() -> None:
    op.drop_constraint("uq_candidate_profiles_user_id", "candidate_profiles", type_="unique")
    op.drop_constraint("fk_candidate_profiles_user_id_candidate_users", "candidate_profiles", type_="foreignkey")
    op.drop_column("candidate_profiles", "user_id")
    op.create_check_constraint("ck_candidate_profiles_single_workspace", "candidate_profiles", "id = 1")
    op.drop_table("candidate_users")
