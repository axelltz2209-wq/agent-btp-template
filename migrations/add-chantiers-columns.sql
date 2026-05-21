-- Migration: Add new columns to chantiers table
-- Date: 2024
-- Description: Add columns for Google reviews tracking and profitability analysis

-- Add telephone column
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS telephone VARCHAR(20);

-- Add avis_demande column (for tracking Google review requests)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS avis_demande BOOLEAN DEFAULT false;

-- Add heures_travaillees column (for profitability calculations)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS heures_travaillees NUMERIC DEFAULT 0;

-- Add depenses column (for profitability calculations)
ALTER TABLE chantiers
ADD COLUMN IF NOT EXISTS depenses NUMERIC DEFAULT 0;

-- Create index for avis_demande to speed up queries
CREATE INDEX IF NOT EXISTS idx_chantiers_avis_demande ON chantiers(avis_demande);

-- Update existing records to set default values
UPDATE chantiers
SET
  avis_demande = COALESCE(avis_demande, false),
  heures_travaillees = COALESCE(heures_travaillees, 0),
  depenses = COALESCE(depenses, 0)
WHERE avis_demande IS NULL
   OR heures_travaillees IS NULL
   OR depenses IS NULL;
