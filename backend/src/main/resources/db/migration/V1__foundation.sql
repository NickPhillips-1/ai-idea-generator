-- Foundation schema. Applied only to an empty database. Do not edit after it has been applied.

CREATE TABLE workspace (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE founder (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    profile jsonb NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version integer NOT NULL,
    CONSTRAINT founder_email_unique UNIQUE (email)
);

CREATE TABLE workspace_member (
    workspace_id uuid NOT NULL REFERENCES workspace (id) ON DELETE CASCADE,
    founder_id uuid NOT NULL REFERENCES founder (id) ON DELETE CASCADE,
    role text NOT NULL,
    CONSTRAINT workspace_member_pk PRIMARY KEY (workspace_id, founder_id),
    CONSTRAINT workspace_member_role_check CHECK (role = 'FOUNDER')
);

CREATE INDEX workspace_member_founder_id_idx ON workspace_member (founder_id);

CREATE TABLE questionnaire_template (
    id uuid PRIMARY KEY,
    version_number integer NOT NULL,
    definition jsonb NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT questionnaire_template_version_unique UNIQUE (version_number)
);

CREATE TABLE questionnaire (
    id uuid PRIMARY KEY,
    founder_id uuid NOT NULL REFERENCES founder (id) ON DELETE RESTRICT,
    template_id uuid NOT NULL REFERENCES questionnaire_template (id) ON DELETE RESTRICT,
    status text NOT NULL,
    answers jsonb NOT NULL,
    submitted_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version integer NOT NULL,
    CONSTRAINT questionnaire_status_check CHECK (status IN ('DRAFT', 'SUBMITTED'))
);

CREATE INDEX questionnaire_founder_id_idx ON questionnaire (founder_id);
CREATE INDEX questionnaire_template_id_idx ON questionnaire (template_id);

CREATE TABLE founder_alignment (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    status text NOT NULL,
    shared_interests jsonb NOT NULL,
    complementary_skills jsonb NOT NULL,
    ai_explanation text NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT founder_alignment_status_check CHECK (status IN ('DRAFT', 'READY'))
);

CREATE INDEX founder_alignment_workspace_id_idx ON founder_alignment (workspace_id);

CREATE TABLE alignment_founder (
    alignment_id uuid NOT NULL REFERENCES founder_alignment (id) ON DELETE CASCADE,
    founder_id uuid NOT NULL REFERENCES founder (id) ON DELETE RESTRICT,
    CONSTRAINT alignment_founder_pk PRIMARY KEY (alignment_id, founder_id)
);

CREATE INDEX alignment_founder_founder_id_idx ON alignment_founder (founder_id);

CREATE TABLE alignment_questionnaire (
    alignment_id uuid NOT NULL REFERENCES founder_alignment (id) ON DELETE CASCADE,
    questionnaire_id uuid NOT NULL REFERENCES questionnaire (id) ON DELETE RESTRICT,
    CONSTRAINT alignment_questionnaire_pk PRIMARY KEY (alignment_id, questionnaire_id)
);

CREATE INDEX alignment_questionnaire_questionnaire_id_idx ON alignment_questionnaire (questionnaire_id);

CREATE TABLE research_direction (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    alignment_id uuid NOT NULL REFERENCES founder_alignment (id) ON DELETE RESTRICT,
    title text NOT NULL,
    description text NOT NULL,
    origin text NOT NULL,
    status text NOT NULL,
    created_by uuid NOT NULL REFERENCES founder (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version integer NOT NULL,
    CONSTRAINT research_direction_origin_check CHECK (origin IN ('AI', 'FOUNDER', 'EXTERNAL')),
    CONSTRAINT research_direction_status_check CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'))
);

CREATE INDEX research_direction_workspace_id_idx ON research_direction (workspace_id);
CREATE INDEX research_direction_alignment_id_idx ON research_direction (alignment_id);
CREATE INDEX research_direction_created_by_idx ON research_direction (created_by);

CREATE TABLE approved_research_source (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    source_type text NOT NULL,
    base_url text NOT NULL,
    notes text NOT NULL
);

CREATE TABLE research_job (
    id uuid PRIMARY KEY,
    direction_id uuid NOT NULL REFERENCES research_direction (id) ON DELETE RESTRICT,
    approved_research_source_id uuid NOT NULL REFERENCES approved_research_source (id) ON DELETE RESTRICT,
    status text NOT NULL,
    source_config jsonb NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    error text,
    token_usage integer,
    estimated_cost numeric(12, 4),
    attempt_count integer NOT NULL,
    idempotency_key text NOT NULL,
    created_at timestamptz NOT NULL,
    version integer NOT NULL,
    CONSTRAINT research_job_status_check CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    CONSTRAINT research_job_attempt_count_check CHECK (attempt_count >= 0),
    CONSTRAINT research_job_idempotency_unique UNIQUE (direction_id, idempotency_key)
);

CREATE INDEX research_job_approved_source_idx ON research_job (approved_research_source_id);
CREATE INDEX research_job_pending_created_at_idx ON research_job (created_at) WHERE status = 'PENDING';

CREATE TABLE research_source (
    id uuid PRIMARY KEY,
    approved_research_source_id uuid NOT NULL REFERENCES approved_research_source (id) ON DELETE RESTRICT,
    research_job_id uuid NOT NULL REFERENCES research_job (id) ON DELETE RESTRICT,
    request jsonb NOT NULL,
    original_reference text NOT NULL,
    payload_hash text NOT NULL,
    retrieved_at timestamptz NOT NULL
);

CREATE INDEX research_source_job_id_idx ON research_source (research_job_id);
CREATE INDEX research_source_approved_source_idx ON research_source (approved_research_source_id);

CREATE TABLE research_finding (
    id uuid PRIMARY KEY,
    direction_id uuid NOT NULL REFERENCES research_direction (id) ON DELETE RESTRICT,
    research_source_id uuid NOT NULL REFERENCES research_source (id) ON DELETE RESTRICT,
    factual_summary text NOT NULL,
    supporting_evidence text NOT NULL,
    ai_interpretation text NOT NULL,
    unknowns text NOT NULL,
    verification_status text NOT NULL DEFAULT 'UNREVIEWED',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT research_finding_verification_check CHECK (verification_status IN ('UNREVIEWED', 'CONFIRMED', 'REJECTED'))
);

CREATE INDEX research_finding_direction_id_idx ON research_finding (direction_id);
CREATE INDEX research_finding_source_id_idx ON research_finding (research_source_id);

CREATE TABLE opportunity (
    id uuid PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES workspace (id) ON DELETE RESTRICT,
    title text NOT NULL,
    customer_problem text NOT NULL,
    target_customer text NOT NULL,
    status text NOT NULL,
    evaluation_summary text NOT NULL,
    business_type text NOT NULL DEFAULT 'PHYSICAL_PRODUCT',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version integer NOT NULL,
    CONSTRAINT opportunity_status_check CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'ADVANCED', 'ARCHIVED')),
    CONSTRAINT opportunity_business_type_check CHECK (business_type IN ('PHYSICAL_PRODUCT', 'SERVICE', 'SOFTWARE', 'OTHER'))
);

CREATE INDEX opportunity_workspace_id_idx ON opportunity (workspace_id);

CREATE TABLE opportunity_finding (
    opportunity_id uuid NOT NULL REFERENCES opportunity (id) ON DELETE CASCADE,
    research_finding_id uuid NOT NULL REFERENCES research_finding (id) ON DELETE RESTRICT,
    CONSTRAINT opportunity_finding_pk PRIMARY KEY (opportunity_id, research_finding_id)
);

CREATE INDEX opportunity_finding_finding_id_idx ON opportunity_finding (research_finding_id);

CREATE TABLE product_concept (
    id uuid PRIMARY KEY,
    opportunity_id uuid NOT NULL REFERENCES opportunity (id) ON DELETE RESTRICT,
    description text NOT NULL,
    target_buyers text NOT NULL,
    differentiation text NOT NULL,
    estimated_costs text NOT NULL,
    feasibility text NOT NULL,
    business_type text NOT NULL DEFAULT 'PHYSICAL_PRODUCT',
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT product_concept_business_type_check CHECK (business_type IN ('PHYSICAL_PRODUCT', 'SERVICE', 'SOFTWARE', 'OTHER'))
);

CREATE INDEX product_concept_opportunity_id_idx ON product_concept (opportunity_id);

CREATE TABLE founder_decision (
    id uuid PRIMARY KEY,
    opportunity_id uuid NOT NULL REFERENCES opportunity (id) ON DELETE RESTRICT,
    founder_id uuid NOT NULL REFERENCES founder (id) ON DELETE RESTRICT,
    decision text NOT NULL,
    rationale text NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT founder_decision_check CHECK (decision IN ('ADVANCE', 'INVESTIGATE', 'REDESIGN', 'ARCHIVE'))
);

CREATE INDEX founder_decision_history_idx ON founder_decision (opportunity_id, founder_id, created_at);
CREATE INDEX founder_decision_founder_id_idx ON founder_decision (founder_id);

INSERT INTO workspace (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Founders Lab', timestamptz '2026-11-11T12:00:00Z');

INSERT INTO approved_research_source (id, name, source_type, base_url, notes)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'US Census County Business Patterns',
    'CENSUS_COUNTY_BUSINESS_PATTERNS',
    'https://api.census.gov/data/',
    'County Business Patterns describes establishment structure. It does not establish customer pain.'
);

INSERT INTO questionnaire_template (id, version_number, definition, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    1,
    '{"questions":[{"id":"interests","prompt":"What problems are you drawn to?","required":true},{"id":"skills","prompt":"What can you build or operate?","required":true},{"id":"resources","prompt":"What resources can you commit?","required":true},{"id":"goals","prompt":"What would make a business worth building?","required":true}]}'::jsonb,
    timestamptz '2026-11-11T12:00:00Z'
);

CREATE TABLE spring_session (
    primary_id char(36) NOT NULL,
    session_id char(36) NOT NULL,
    creation_time bigint NOT NULL,
    last_access_time bigint NOT NULL,
    max_inactive_interval int NOT NULL,
    expiry_time bigint NOT NULL,
    principal_name varchar(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);

CREATE UNIQUE INDEX spring_session_ix1 ON spring_session (session_id);
CREATE INDEX spring_session_ix2 ON spring_session (expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session (principal_name);

CREATE TABLE spring_session_attributes (
    session_primary_id char(36) NOT NULL,
    attribute_name varchar(200) NOT NULL,
    attribute_bytes bytea NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id) REFERENCES spring_session (primary_id) ON DELETE CASCADE
);
