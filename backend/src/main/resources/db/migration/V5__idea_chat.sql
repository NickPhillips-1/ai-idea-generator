CREATE TABLE idea_chat (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    founder_id uuid NOT NULL REFERENCES founder (id) ON DELETE RESTRICT,
    prompt text NOT NULL,
    factual_summary text NOT NULL,
    supporting_evidence text NOT NULL,
    ai_interpretation text NOT NULL,
    unknowns text NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE INDEX idea_chat_founder_created_idx ON idea_chat (founder_id, created_at DESC);
