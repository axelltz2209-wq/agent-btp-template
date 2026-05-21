-- =====================================================
-- POLITIQUES RLS POUR PATRICK MAÇONNERIE
-- =====================================================
-- Ces politiques permettent à l'application d'accéder aux données
-- via la clé anon de Supabase
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LA TABLE DEVIS
-- =====================================================

-- Politique pour permettre la lecture de tous les devis
CREATE POLICY "Allow read access to devis"
ON devis
FOR SELECT
TO anon, authenticated
USING (true);

-- Politique pour permettre l'insertion de devis
CREATE POLICY "Allow insert access to devis"
ON devis
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Politique pour permettre la mise à jour de devis
CREATE POLICY "Allow update access to devis"
ON devis
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Politique pour permettre la suppression de devis
CREATE POLICY "Allow delete access to devis"
ON devis
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- POLITIQUES POUR LA TABLE CHANTIERS
-- =====================================================

-- Politique pour permettre la lecture de tous les chantiers
CREATE POLICY "Allow read access to chantiers"
ON chantiers
FOR SELECT
TO anon, authenticated
USING (true);

-- Politique pour permettre l'insertion de chantiers
CREATE POLICY "Allow insert access to chantiers"
ON chantiers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Politique pour permettre la mise à jour de chantiers
CREATE POLICY "Allow update access to chantiers"
ON chantiers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Politique pour permettre la suppression de chantiers
CREATE POLICY "Allow delete access to chantiers"
ON chantiers
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Pour vérifier que les politiques sont bien créées :
-- SELECT * FROM pg_policies WHERE tablename IN ('devis', 'chantiers');
