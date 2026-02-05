-- Fix: Add missing DELETE policy for damages table
-- Run this in Supabase SQL Editor

-- Users can delete damages for their own scans
CREATE POLICY "Users can delete their own damages"
  ON damages
  FOR DELETE
  USING (
    scan_id IN (
      SELECT id FROM scans WHERE user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'damages'
ORDER BY cmd;
