ALTER TABLE founder ADD COLUMN username text;
ALTER TABLE founder ADD COLUMN password_hash text;

CREATE UNIQUE INDEX founder_username_unique ON founder (username);
