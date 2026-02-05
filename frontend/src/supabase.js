import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fmfyvnugmkqlmlglycap.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZnl2bnVnbWtxbG1sZ2x5Y2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNDQ3OTUsImV4cCI6MjA4NDkyMDc5NX0.AXNbd26Xzo8JPj852k9OPcL2Y9Vv2gg7VoiL99Bad7w'

export const supabase = createClient(supabaseUrl, supabaseKey)
