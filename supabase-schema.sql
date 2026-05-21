-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nom VARCHAR(255) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  date_envoi TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  telephone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des chantiers
CREATE TABLE IF NOT EXISTS chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nom VARCHAR(255) NOT NULL,
  montant_devis DECIMAL(10, 2) NOT NULL,
  date_debut DATE NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'prevu',
  telephone VARCHAR(20),
  avis_demande BOOLEAN DEFAULT false,
  heures_travaillees NUMERIC DEFAULT 0,
  depenses NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_date_envoi ON devis(date_envoi);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_chantiers_date_debut ON chantiers(date_debut);

-- Fonction pour mettre à jour le timestamp updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour devis
CREATE TRIGGER update_devis_updated_at
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour chantiers
CREATE TRIGGER update_chantiers_updated_at
  BEFORE UPDATE ON chantiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données de test (optionnel)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone) VALUES
  ('Dupont Jean', 5000.00, NOW() - INTERVAL '5 days', 'en_attente', '0601020304'),
  ('Martin Sophie', 12000.00, NOW() - INTERVAL '2 days', 'en_attente', '0605060708'),
  ('Bernard Paul', 8500.00, NOW() - INTERVAL '7 days', 'en_attente', '0609101112');

INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses) VALUES
  ('Durand Marie', 15000.00, CURRENT_DATE + INTERVAL '2 days', 'prevu', '0612131415', 0, 0),
  ('Petit Laurent', 9000.00, CURRENT_DATE + INTERVAL '4 days', 'prevu', '0616171819', 0, 0),
  ('Moreau Alice', 22000.00, CURRENT_DATE + INTERVAL '6 days', 'prevu', '0620212223', 0, 0),
  ('Rousseau Pierre', 12000.00, CURRENT_DATE - INTERVAL '15 days', 'en_cours', '0624252627', 85, 2500),
  ('Legrand Julie', 18000.00, CURRENT_DATE - INTERVAL '10 days', 'en_cours', '0628293031', 120, 1800);
