-- Migration: Add supplier_payment_line table for split payments
-- Run this script once against the database

CREATE TABLE IF NOT EXISTS supplier_payment_line (
  id_payment_line UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_supplier_payment UUID NOT NULL REFERENCES supplier_payment(id_supplier_payment) ON DELETE CASCADE,
  id_payment_method UUID NOT NULL REFERENCES payment_method(id_payment_method),
  amount NUMERIC(15, 2) NOT NULL
);

-- Make id_payment_method nullable on supplier_payment (kept for legacy records)
ALTER TABLE supplier_payment
  ALTER COLUMN id_payment_method DROP NOT NULL;

-- Index for fast lookups by payment
CREATE INDEX IF NOT EXISTS idx_spl_supplier_payment
  ON supplier_payment_line(id_supplier_payment);
