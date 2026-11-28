"""Add candidate-owned application tracking."""

from alembic import op
import sqlalchemy as sa

revision = "20261128_0004"
down_revision = "20261127_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "candidate_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.String(length=1000), nullable=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=False),
        sa.Column("location", sa.String(length=300), nullable=True),
        sa.Column("job_url", sa.String(length=2000), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="interested"),
        sa.Column("applied_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("follow_up_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["candidate_users.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "status IN ('interested', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')",
            name="ck_candidate_applications_status",
        ),
        sa.UniqueConstraint("user_id", "job_id", name="uq_candidate_applications_user_job"),
    )
    op.create_index("ix_candidate_applications_user_id", "candidate_applications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_candidate_applications_user_id", table_name="candidate_applications")
    op.drop_table("candidate_applications")
