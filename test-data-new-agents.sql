-- Test data for new agents (avis-google and rentabilite-chantier)

-- Add a completed chantier for testing avis-google agent
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, avis_demande, heures_travaillees, depenses)
VALUES
  ('Fontaine Marc', 14000.00, CURRENT_DATE - INTERVAL '30 days', 'termine', '0632333435', false, 95, 1200),
  ('Beaumont Claire', 8500.00, CURRENT_DATE - INTERVAL '25 days', 'termine', '0636373839', false, 62, 950);

-- Update existing chantiers en_cours with profitability data for testing rentabilite agent
-- These should already exist from the schema file, but let's make sure they have the right data

-- Rousseau Pierre: Low margin (critical) - 85h * 45 = 3825€ + 2500€ = 6325€ total cost
-- Montant: 12000€, Marge: 5675€ (47% - should be green but let's adjust for testing)
-- Let's increase hours to make it orange/red
UPDATE chantiers
SET heures_travaillees = 150, depenses = 3500
WHERE client_nom = 'Rousseau Pierre' AND statut = 'en_cours';
-- New calculation: 150h * 45 = 6750€ + 3500€ = 10250€ total cost
-- Montant: 12000€, Marge: 1750€ (14.6% - CRITICAL RED)

-- Legrand Julie: Medium margin (warning) - 120h * 45 = 5400€ + 1800€ = 7200€ total cost
-- Montant: 18000€, Marge: 10800€ (60% - let's adjust)
UPDATE chantiers
SET heures_travaillees = 220, depenses = 3200
WHERE client_nom = 'Legrand Julie' AND statut = 'en_cours';
-- New calculation: 220h * 45 = 9900€ + 3200€ = 13100€ total cost
-- Montant: 18000€, Marge: 4900€ (27.2% - GREEN but close to warning)

-- Add one more chantier en cours with perfect margin
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
VALUES
  ('Lambert Sophie', 25000.00, CURRENT_DATE - INTERVAL '12 days', 'en_cours', '0640414243', 180, 2500, false);
-- Calculation: 180h * 45 = 8100€ + 2500€ = 10600€ total cost
-- Montant: 25000€, Marge: 14400€ (57.6% - EXCELLENT GREEN)
