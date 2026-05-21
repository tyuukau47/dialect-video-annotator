"""initial schema

Revision ID: 20260521_0001
Revises:
Create Date: 2026-05-21 15:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260521_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "videos",
        sa.Column("youtube_video_id", sa.String(length=32), nullable=False),
        sa.Column("source_url", sa.String(length=512), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_videos_youtube_video_id"), "videos", ["youtube_video_id"], unique=True)

    op.create_table(
        "vocabulary_entries",
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("value", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vocab_type_value_unique", "vocabulary_entries", ["type", "value"], unique=True)
    op.create_index(op.f("ix_vocabulary_entries_type"), "vocabulary_entries", ["type"], unique=False)

    op.create_table(
        "voices",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("language", sa.String(length=120), nullable=False),
        sa.Column("dialect", sa.String(length=120), nullable=False),
        sa.Column("gender_vocab_id", sa.String(length=36), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["gender_vocab_id"], ["vocabulary_entries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_voices_archived_at"), "voices", ["archived_at"], unique=False)
    op.create_index(op.f("ix_voices_dialect"), "voices", ["dialect"], unique=False)
    op.create_index(op.f("ix_voices_gender_vocab_id"), "voices", ["gender_vocab_id"], unique=False)
    op.create_index(op.f("ix_voices_language"), "voices", ["language"], unique=False)
    op.create_index(op.f("ix_voices_name"), "voices", ["name"], unique=False)

    op.create_table(
        "ranges",
        sa.Column("video_id", sa.String(length=36), nullable=False),
        sa.Column("voice_id", sa.String(length=36), nullable=False),
        sa.Column("start_ms", sa.Integer(), nullable=False),
        sa.Column("end_ms", sa.Integer(), nullable=False),
        sa.Column("transcription", sa.Text(), nullable=True),
        sa.Column("emotion_vocab_id", sa.String(length=36), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["emotion_vocab_id"], ["vocabulary_entries.id"]),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"]),
        sa.ForeignKeyConstraint(["voice_id"], ["voices.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ranges_deleted_at"), "ranges", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_ranges_emotion_vocab_id"), "ranges", ["emotion_vocab_id"], unique=False)
    op.create_index(op.f("ix_ranges_end_ms"), "ranges", ["end_ms"], unique=False)
    op.create_index(op.f("ix_ranges_start_ms"), "ranges", ["start_ms"], unique=False)
    op.create_index(op.f("ix_ranges_video_id"), "ranges", ["video_id"], unique=False)
    op.create_index(op.f("ix_ranges_voice_id"), "ranges", ["voice_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ranges_voice_id"), table_name="ranges")
    op.drop_index(op.f("ix_ranges_video_id"), table_name="ranges")
    op.drop_index(op.f("ix_ranges_start_ms"), table_name="ranges")
    op.drop_index(op.f("ix_ranges_end_ms"), table_name="ranges")
    op.drop_index(op.f("ix_ranges_emotion_vocab_id"), table_name="ranges")
    op.drop_index(op.f("ix_ranges_deleted_at"), table_name="ranges")
    op.drop_table("ranges")

    op.drop_index(op.f("ix_voices_name"), table_name="voices")
    op.drop_index(op.f("ix_voices_language"), table_name="voices")
    op.drop_index(op.f("ix_voices_gender_vocab_id"), table_name="voices")
    op.drop_index(op.f("ix_voices_dialect"), table_name="voices")
    op.drop_index(op.f("ix_voices_archived_at"), table_name="voices")
    op.drop_table("voices")

    op.drop_index(op.f("ix_vocabulary_entries_type"), table_name="vocabulary_entries")
    op.drop_index("ix_vocab_type_value_unique", table_name="vocabulary_entries")
    op.drop_table("vocabulary_entries")

    op.drop_index(op.f("ix_videos_youtube_video_id"), table_name="videos")
    op.drop_table("videos")
