-- Local login accounts. Password for both is "password" (bcrypt).
-- Apply against a running database:
--   docker compose exec -T postgres psql -U founderslab -d founderslab < backend/src/main/resources/db/seed/insert_paul_zach.sql

INSERT INTO founder (id, name, email, profile, created_at, updated_at, version, username, password_hash)
VALUES
    (
        '00000000-0000-0000-0000-000000000010',
        'paul',
        'paul@localhost',
        '{}'::jsonb,
        timestamptz '2026-11-23T12:00:00Z',
        timestamptz '2026-11-23T12:00:00Z',
        0,
        'paul',
        '$2y$10$xAwLBLNy09FVzvilgaRHYut2e.JeheUj6JqH6am3vtf0VOywSYij.'
    ),
    (
        '00000000-0000-0000-0000-000000000011',
        'zach',
        'zach@localhost',
        '{}'::jsonb,
        timestamptz '2026-11-23T12:00:00Z',
        timestamptz '2026-11-23T12:00:00Z',
        0,
        'zach',
        '$2y$10$w01281uy.CEeIBhGFaO0GOrDuIwwQLSWsD6UOcLAa3JXHXZM9txaG'
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO workspace_member (workspace_id, founder_id, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'FOUNDER'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'FOUNDER')
ON CONFLICT DO NOTHING;
