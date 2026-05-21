-- Migration: Create agent_logs table for monitoring agent activity
-- Date: 2024
-- Description: Table to track all agent executions and actions

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'success',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);

-- Comment on table
COMMENT ON TABLE agent_logs IS 'Logs all agent activity for monitoring and debugging';
COMMENT ON COLUMN agent_logs.agent_name IS 'Name of the agent (e.g., relance-devis, daily-briefing)';
COMMENT ON COLUMN agent_logs.action IS 'Description of the action performed';
COMMENT ON COLUMN agent_logs.status IS 'Status of the action: success, error, warning';
COMMENT ON COLUMN agent_logs.details IS 'Additional details, error messages, or JSON data';
