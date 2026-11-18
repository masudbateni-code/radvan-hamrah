PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
  membership_id TEXT NOT NULL UNIQUE, qr_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customer_business_balances (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
  league TEXT NOT NULL DEFAULT 'برنزی',
  PRIMARY KEY(customer_id,business_id)
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_membership ON customers(membership_id);
CREATE INDEX IF NOT EXISTS idx_customers_qr ON customers(qr_token);
