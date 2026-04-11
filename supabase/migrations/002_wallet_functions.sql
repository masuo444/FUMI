-- ============================================================
-- Atomic wallet operations
-- These functions avoid TOCTOU race conditions by combining
-- the balance check and update in a single SQL statement.
-- ============================================================

-- deduct_wallet_balance
-- Subtracts p_amount from owner's balance atomically.
-- Raises 'insufficient_balance' exception if balance < p_amount.
-- Returns the new balance after deduction.
CREATE OR REPLACE FUNCTION deduct_wallet_balance(p_owner_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance int;
BEGIN
  UPDATE owner_wallets
  SET
    balance    = balance - p_amount,
    updated_at = now()
  WHERE owner_id = p_owner_id
    AND balance  >= p_amount
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- add_wallet_balance
-- Adds p_amount to owner's balance atomically (upsert-safe).
-- Returns the new balance after addition.
CREATE OR REPLACE FUNCTION add_wallet_balance(p_owner_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance int;
BEGIN
  INSERT INTO owner_wallets (owner_id, balance)
  VALUES (p_owner_id, p_amount)
  ON CONFLICT (owner_id)
  DO UPDATE SET
    balance    = owner_wallets.balance + p_amount,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;
