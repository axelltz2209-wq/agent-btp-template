-- =====================================================
-- SECURE RLS POLICIES FOR PATRICK MAÇONNERIE
-- =====================================================
-- These policies provide proper security for production use
-- Requires Supabase Auth to be implemented in the dashboard
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LA TABLE DEVIS
-- =====================================================

-- Supprime les anciennes politiques non sécurisées
DROP POLICY IF EXISTS "Allow read access to devis" ON devis;
DROP POLICY IF EXISTS "Allow insert access to devis" ON devis;
DROP POLICY IF EXISTS "Allow update access to devis" ON devis;
DROP POLICY IF EXISTS "Allow delete access to devis" ON devis;

-- Politique pour permettre la lecture aux utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can read devis"
ON devis
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert devis"
ON devis
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update devis"
ON devis
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete devis"
ON devis
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- POLITIQUES POUR LA TABLE CHANTIERS
-- =====================================================

-- Supprime les anciennes politiques non sécurisées
DROP POLICY IF EXISTS "Allow read access to chantiers" ON chantiers;
DROP POLICY IF EXISTS "Allow insert access to chantiers" ON chantiers;
DROP POLICY IF EXISTS "Allow update access to chantiers" ON chantiers;
DROP POLICY IF EXISTS "Allow delete access to chantiers" ON chantiers;

-- Politique pour permettre la lecture aux utilisateurs authentifiés uniquement
CREATE POLICY "Authenticated users can read chantiers"
ON chantiers
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert chantiers"
ON chantiers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update chantiers"
ON chantiers
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete chantiers"
ON chantiers
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- POLITIQUES POUR LA TABLE AGENT_LOGS
-- =====================================================

-- Supprime les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow read access to agent_logs" ON agent_logs;
DROP POLICY IF EXISTS "Allow insert access to agent_logs" ON agent_logs;

-- Politique pour permettre la lecture des logs aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can read agent_logs"
ON agent_logs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Politique pour permettre l'insertion de logs (agents backend avec service_role)
-- Les agents utilisent le service_role_key qui bypass RLS
-- Donc pas besoin de politique INSERT pour les agents
CREATE POLICY "Allow insert agent_logs for service role"
ON agent_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- POUR MULTI-TENANT (FUTUR)
-- =====================================================
-- Si vous voulez séparer les données par utilisateur :
--
-- 1. Ajouter une colonne user_id aux tables :
--    ALTER TABLE devis ADD COLUMN user_id UUID REFERENCES auth.users(id);
--    ALTER TABLE chantiers ADD COLUMN user_id UUID REFERENCES auth.users(id);
--
-- 2. Mettre à jour les politiques :
--    USING (auth.uid() = user_id)
--
-- 3. Lors de l'insertion, toujours définir user_id :
--    INSERT INTO devis (client_nom, montant, user_id)
--    VALUES ('Client', 1000, auth.uid());

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Pour vérifier que les politiques sont bien créées :
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('devis', 'chantiers', 'agent_logs')
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES DE SÉCURITÉ
-- =====================================================
-- ✅ RLS activé sur toutes les tables
-- ✅ Anon role = aucun accès (sécurité par défaut)
-- ✅ Authenticated role = accès complet (pour single-tenant)
-- ✅ Service role = bypass RLS (pour les agents backend)
--
-- ⚠️ IMPORTANT :
-- - Ne JAMAIS exposer service_role_key au client
-- - Anon key peut être exposé MAIS sans politiques RLS pour anon = aucun accès
-- - Authentifié users doivent se connecter via Supabase Auth
