-- Migration: Create damages table for multi-angle analysis
-- Run this in Supabase SQL Editor

-- 1. Create damages table
CREATE TABLE IF NOT EXISTS damages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic damage information
  part_name text NOT NULL,
  damage_type text NOT NULL,
  is_manual boolean DEFAULT false,
  detection_source text DEFAULT 'ai', -- 'ai' | 'manual'
  
  -- Global scan data (from initial detection)
  global_box integer[4], -- [x1, y1, x2, y2]
  preliminary_severity integer,
  preliminary_cost integer,
  
  -- Multi-angle refinement (3 close-up photos)
  closeup_urls text[3], -- [left_url, center_url, right_url]
  severity_scores integer[3], -- [85, 90, 88]
  
  -- Final averaged results
  final_severity integer, -- Average of severity_scores
  action text, -- 'Repair' | 'Part Replacement' | 'Polish'
  cost integer, -- Final cost based on average
  confidence text, -- 'high' | 'medium' | 'low' (based on std deviation)
  
  -- Workflow status
  status text DEFAULT 'preliminary', -- 'preliminary' | 'refining' | 'verified'
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_damages_scan_id ON damages(scan_id);
CREATE INDEX IF NOT EXISTS idx_damages_status ON damages(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE damages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can only see damages from their own scans
CREATE POLICY "Users can view their own damages"
  ON damages
  FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- Users can insert damages for their own scans
CREATE POLICY "Users can insert damages for their scans"
  ON damages
  FOR INSERT
  WITH CHECK (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- Users can update damages for their own scans
CREATE POLICY "Users can update their own damages"
  ON damages
  FOR UPDATE
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- 5. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_damages_updated_at
  BEFORE UPDATE ON damages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Migration: Copy existing damages from scans.damages to damages table
-- (Run this ONLY if you have existing data)
/*
INSERT INTO damages (
  scan_id,
  part_name,
  damage_type,
  global_box,
  preliminary_severity,
  preliminary_cost,
  final_severity,
  action,
  cost,
  status
)
SELECT
  s.id as scan_id,
  d->>'part' as part_name,
  d->>'type' as damage_type,
  ARRAY[
    (d->'box'->>0)::integer,
    (d->'box'->>1)::integer,
    (d->'box'->>2)::integer,
    (d->'box'->>3)::integer
  ] as global_box,
  (d->>'severity')::integer as preliminary_severity,
  (d->>'cost')::integer as preliminary_cost,
  (d->>'severity')::integer as final_severity,
  d->>'action' as action,
  (d->>'cost')::integer as cost,
  'verified' as status
FROM scans s,
LATERAL jsonb_array_elements(s.damages) as d
WHERE s.damages IS NOT NULL;
*/

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'damages'
ORDER BY ordinal_position;
