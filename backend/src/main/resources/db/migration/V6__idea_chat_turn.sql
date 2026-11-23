CREATE TABLE idea_chat_turn (
    id uuid PRIMARY KEY,
    chat_id uuid NOT NULL REFERENCES idea_chat (id) ON DELETE CASCADE,
    prompt text NOT NULL,
    factual_summary text NOT NULL,
    supporting_evidence text NOT NULL,
    ai_interpretation text NOT NULL,
    unknowns text NOT NULL,
    created_at timestamptz NOT NULL
);

INSERT INTO idea_chat_turn (
    id,
    chat_id,
    prompt,
    factual_summary,
    supporting_evidence,
    ai_interpretation,
    unknowns,
    created_at
)
SELECT
    gen_random_uuid(),
    id,
    prompt,
    factual_summary,
    supporting_evidence,
    ai_interpretation,
    unknowns,
    created_at
FROM idea_chat;

ALTER TABLE idea_chat
    DROP COLUMN factual_summary,
    DROP COLUMN supporting_evidence,
    DROP COLUMN ai_interpretation,
    DROP COLUMN unknowns;

CREATE INDEX idea_chat_turn_chat_created_idx ON idea_chat_turn (chat_id, created_at);
