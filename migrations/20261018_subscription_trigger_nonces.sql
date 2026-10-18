-- Additive replay-protection storage for the Cloudflare trigger.
-- Apply to development for verification; production migration requires separate approval.
BEGIN;
CREATE TABLE IF NOT EXISTS subscription_trigger_nonces (
  nonce varchar(36) PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_trigger_nonces_received_at
  ON subscription_trigger_nonces(received_at);
COMMIT;
