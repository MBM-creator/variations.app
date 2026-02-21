-- Variations App – Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Table: variations
CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  supervisor_name text NOT NULL,
  site_name text NOT NULL,
  site_address text NOT NULL,
  client_email text NOT NULL,
  description text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'cannot_proceed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'edited')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submitted_ip text,
  approval_ip text,
  approval_timestamp timestamptz,
  edit_timestamp timestamptz,
  edit_notes text,
  edit_ip text
);

-- Index for fast shortcode lookups (public client view)
CREATE INDEX IF NOT EXISTS idx_variations_shortcode ON variations(shortcode);
CREATE INDEX IF NOT EXISTS idx_variations_status ON variations(status);
CREATE INDEX IF NOT EXISTS idx_variations_submitted_at ON variations(submitted_at DESC);

-- Table: variation_images
CREATE TABLE IF NOT EXISTS variation_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id uuid NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variation_images_variation_id ON variation_images(variation_id);

-- RLS (optional – enable if you use Supabase Auth later; for now anon can read by shortcode via API)
-- For MVP we use service role in API routes only; no RLS required for public submit URL flow.
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_images ENABLE ROW LEVEL SECURITY;

-- Policy: no direct anon access to tables (all access via API with server-side Supabase client)
CREATE POLICY "No direct anon access variations" ON variations FOR ALL USING (false);
CREATE POLICY "No direct anon access variation_images" ON variation_images FOR ALL USING (false);

-- Storage: create bucket via Dashboard or run:
-- Storage → New bucket → Name: variations, Private: ON
-- Then in SQL or Dashboard, add policy so only service role can read/write (no public list/read).
