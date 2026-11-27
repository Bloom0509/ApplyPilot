"""Add account-scoped saved jobs."""

from alembic import op
import sqlalchemy as sa

revision = "20261127_0003"
down_revision = "20261125_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=1000), nullable=False),
        sa.Column("job_data", sa.JSON(), nullable=False),
        sa.Column("saved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["candidate_users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_job"),
    )
    op.create_index("ix_saved_jobs_user_id", "saved_jobs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_saved_jobs_user_id", table_name="saved_jobs")
    op.drop_table("saved_jobs")
