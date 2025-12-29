-- =====================================================
-- 5. DOCUMENT LOCKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_by_name TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL,
  queue_position INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE document_locks ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view all locks
CREATE POLICY "Authenticated users can view all locks" ON document_locks
  FOR SELECT TO authenticated USING (true);

-- Policy: Authenticated users can insert locks
CREATE POLICY "Authenticated users can insert locks" ON document_locks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = locked_by);

-- Policy: Authenticated users can update locks
-- Required to allow users to update queue positions of other locks when releasing
CREATE POLICY "Authenticated users can update locks" ON document_locks
  FOR UPDATE TO authenticated USING (true);

-- Policy: Authenticated users can delete locks
-- Required to allow users to clean up expired locks of other users
CREATE POLICY "Authenticated users can delete locks" ON document_locks
  FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_locks_doc_id_type ON document_locks(document_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_locks_locked_by ON document_locks(locked_by);
