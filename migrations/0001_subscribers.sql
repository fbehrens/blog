CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  confirmation_token TEXT,
  unsubscribe_token TEXT,
  created_at TEXT NOT NULL
);
