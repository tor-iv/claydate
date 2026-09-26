// Secret Santa tables. Shared by index.ts (app) and seed.ts (plain node) so
// there is one copy to keep in sync with schema.ts.
export const SANTA_DDL = `
  CREATE TABLE IF NOT EXISTS santa_exchange (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    budget_text TEXT,
    deadline_date TEXT,
    house_rules TEXT,
    no_mutual_pairs INTEGER NOT NULL DEFAULT 0,
    draw_status TEXT NOT NULL DEFAULT 'none' CHECK (draw_status IN ('none','drawn','unsealed')),
    drawn_at INTEGER,
    unsealed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS santa_participants (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reveal_pin_hash TEXT,
    joined_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS santa_exclusions (
    a_id TEXT NOT NULL REFERENCES santa_participants(user_id) ON DELETE CASCADE,
    b_id TEXT NOT NULL REFERENCES santa_participants(user_id) ON DELETE CASCADE,
    note TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS santa_exclusions_pair_uniq ON santa_exclusions (a_id, b_id);
  CREATE INDEX IF NOT EXISTS santa_exclusions_b_idx ON santa_exclusions (b_id);

  CREATE TABLE IF NOT EXISTS santa_assignments (
    giver_id TEXT PRIMARY KEY REFERENCES santa_participants(user_id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL UNIQUE REFERENCES santa_participants(user_id) ON DELETE CASCADE,
    revealed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS santa_wish_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    price_note TEXT,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS santa_wish_items_user_idx ON santa_wish_items (user_id, position);

  CREATE TABLE IF NOT EXISTS santa_audit_log (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS santa_audit_log_created_idx ON santa_audit_log (created_at);
`;
