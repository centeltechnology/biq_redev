-- Additive migration only. Apply to development for testing.
-- Production application requires separate migration/rollout approval.
-- NO historical plan, gift, referral, commission, or transaction rewrites.
BEGIN;
ALTER TABLE bakers ADD COLUMN IF NOT EXISTS administrative_plan text
  CHECK (administrative_plan IS NULL OR administrative_plan IN ('basic','pro'));
CREATE TABLE IF NOT EXISTS subscription_sync (
  baker_id varchar PRIMARY KEY REFERENCES bakers(id) ON DELETE CASCADE,
  billing_plan text NOT NULL DEFAULT 'free' CHECK (billing_plan IN ('free','basic','pro')),
  billing_status text,
  subscription_id text,
  paid_through timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  entitlement_source text NOT NULL DEFAULT 'unreconciled',
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  error_code text,
  needs_reconcile boolean NOT NULL DEFAULT true,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_sync_due ON subscription_sync(next_attempt_at)
  WHERE needs_reconcile;
CREATE TABLE IF NOT EXISTS subscription_sync_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscription_award_candidates (
  invoice_id text PRIMARY KEY,
  baker_id varchar NOT NULL REFERENCES bakers(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  plan text NOT NULL CHECK (plan IN ('basic','pro')),
  status text NOT NULL DEFAULT 'policy_review',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Candidates are NOT commissions or payouts. They preserve verified activity
-- while the historic callback's invoice/activation eligibility is clarified.
COMMIT;
