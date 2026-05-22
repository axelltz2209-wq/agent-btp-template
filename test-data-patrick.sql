-- =====================================================
-- TEST DATA FOR PATRICK - Functional Testing
-- =====================================================
-- This simulates Patrick's real-world scenario
-- Run this in Supabase SQL editor
-- =====================================================

-- Nettoyer les données de test précédentes
DELETE FROM devis WHERE client_nom LIKE '%TEST%' OR client_nom IN ('Dupont Jean', 'Martin Sophie', 'Bernard Paul', 'Rousseau Marie', 'Lambert Pierre');
DELETE FROM chantiers WHERE client_nom LIKE '%TEST%' OR client_nom IN ('Durand Marc', 'Petit Anne', 'Moreau Jacques', 'Leroy François');

-- =====================================================
-- SCENARIO PATRICK (48 ans, maçon)
-- =====================================================

-- ============ DEVIS EN ATTENTE (3) ============

-- Devis 1: Dupont Jean - 4 jours d'attente (devrait déclencher relance)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone)
VALUES (
  'Dupont Jean',
  5000.00,
  NOW() - INTERVAL '4 days',
  'en_attente',
  '06 12 34 56 78'
);

-- Devis 2: Martin Sophie - 6 jours d'attente (devrait déclencher relance)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone)
VALUES (
  'Martin Sophie',
  12000.00,
  NOW() - INTERVAL '6 days',
  'en_attente',
  '06 98 76 54 32'
);

-- Devis 3: Bernard Paul - 8 jours d'attente (devrait déclencher alerte urgente)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone)
VALUES (
  'Bernard Paul',
  8500.00,
  NOW() - INTERVAL '8 days',
  'en_attente',
  '06 45 67 89 01'
);

-- Devis 4: Rousseau Marie - 2 jours (ne devrait PAS déclencher de relance)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone)
VALUES (
  'Rousseau Marie',
  3500.00,
  NOW() - INTERVAL '2 days',
  'en_attente',
  '07 11 22 33 44'
);

-- Devis 5: Lambert Pierre - Accepté (ne devrait PAS apparaître dans les relances)
INSERT INTO devis (client_nom, montant, date_envoi, statut, telephone)
VALUES (
  'Lambert Pierre',
  7500.00,
  NOW() - INTERVAL '10 days',
  'accepte',
  '06 55 66 77 88'
);

-- ============ CHANTIERS EN COURS (2) ============

-- Chantier 1: Durand Marc - MARGE EXCELLENTE (>25%)
-- Montant: 10000€ | Heures: 80h (x45€ = 3600€) | Dépenses: 2500€
-- Coût total: 6100€ | Marge: 3900€ (39%) → 🟢 SUCCESS
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
VALUES (
  'Durand Marc',
  10000.00,
  NOW() - INTERVAL '15 days',
  'en_cours',
  '06 11 22 33 44',
  80,
  2500.00,
  false
);

-- Chantier 2: Petit Anne - MARGE FAIBLE (<15%)
-- Montant: 5000€ | Heures: 90h (x45€ = 4050€) | Dépenses: 1200€
-- Coût total: 5250€ | Marge: -250€ (-5%) → 🔴 DANGER
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
VALUES (
  'Petit Anne',
  5000.00,
  NOW() - INTERVAL '10 days',
  'en_cours',
  '07 99 88 77 66',
  90,
  1200.00,
  false
);

-- ============ CHANTIER TERMINÉ (1) ============

-- Chantier 3: Moreau Jacques - TERMINÉ (devrait déclencher demande avis Google)
INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
VALUES (
  'Moreau Jacques',
  8000.00,
  NOW() - INTERVAL '30 days',
  'termine',
  '06 33 44 55 66',
  100,
  2000.00,
  false -- Pas encore demandé → devrait déclencher agent avis-google
);

-- ============ CHANTIERS PRÉVUS CETTE SEMAINE (2) ============

-- Pour tester l'agent calcul-ca.js
-- Obtenir le lundi et dimanche de cette semaine
DO $$
DECLARE
  semaine_lundi DATE;
  semaine_dimanche DATE;
BEGIN
  -- Calculer le lundi de la semaine en cours
  semaine_lundi := DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '0 days';
  -- Calculer le dimanche
  semaine_dimanche := semaine_lundi + INTERVAL '6 days';

  -- Insérer 2 chantiers prévus cette semaine
  INSERT INTO chantiers (client_nom, montant_devis, date_debut, statut, telephone, heures_travaillees, depenses, avis_demande)
  VALUES
    ('Leroy François', 15000.00, semaine_lundi + INTERVAL '2 days', 'prevu', '06 77 88 99 00', NULL, NULL, false),
    ('Garcia Maria', 22000.00, semaine_dimanche, 'prevu', '07 22 33 44 55', NULL, NULL, false);
END $$;

-- =====================================================
-- VÉRIFICATION DES DONNÉES
-- =====================================================
SELECT
  '=== DEVIS EN ATTENTE ===' AS section,
  client_nom,
  montant,
  EXTRACT(DAY FROM (NOW() - date_envoi)) AS jours_attente,
  statut
FROM devis
WHERE statut = 'en_attente'
ORDER BY date_envoi;

SELECT
  '=== CHANTIERS EN COURS ===' AS section,
  client_nom,
  montant_devis,
  heures_travaillees,
  depenses,
  ROUND((montant_devis - (heures_travaillees * 45 + depenses)) / montant_devis * 100, 2) AS marge_pct
FROM chantiers
WHERE statut = 'en_cours'
ORDER BY client_nom;

SELECT
  '=== CHANTIERS TERMINÉS ===' AS section,
  client_nom,
  statut,
  avis_demande AS avis_deja_demande
FROM chantiers
WHERE statut = 'termine'
ORDER BY client_nom;

SELECT
  '=== CA SEMAINE ===' AS section,
  client_nom,
  montant_devis,
  date_debut
FROM chantiers
WHERE statut = 'prevu'
  AND date_debut >= DATE_TRUNC('week', CURRENT_DATE)
  AND date_debut < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
ORDER BY date_debut;

-- =====================================================
-- RÉSUMÉ ATTENDU
-- =====================================================
-- 1. RELANCE DEVIS:
--    - Dupont Jean (4j) ✅
--    - Martin Sophie (6j) ✅
--    - Bernard Paul (8j) ✅
--    Total: 3 relances
--
-- 2. URGENT ALERT:
--    - Bernard Paul (8j > 7j) ✅
--    Total: 1 alerte
--
-- 3. AVIS GOOGLE:
--    - Moreau Jacques (terminé, avis_demande=false) ✅
--    Total: 1 demande
--
-- 4. RENTABILITÉ:
--    - Durand Marc: 39% → 🟢 SUCCESS
--    - Petit Anne: -5% → 🔴 DANGER
--    Total: 1 danger, 1 success
--
-- 5. CA SEMAINE:
--    - Leroy François: 15000€
--    - Garcia Maria: 22000€
--    Total: 37000€
-- =====================================================
