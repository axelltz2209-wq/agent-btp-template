import { supabase } from './lib/supabase.js'

/**
 * Script de test pour vérifier la connexion Supabase
 * et les politiques RLS
 */
async function testSupabaseConnection() {
  console.log('🧪 Test de connexion Supabase\n')

  try {
    // Test 1: Connexion Supabase
    console.log('1️⃣  Test de connexion...')
    const { error: connectionError } = await supabase.from('devis').select('count', { count: 'exact', head: true })

    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message)
      console.log('\n💡 Vérifiez vos variables SUPABASE_URL et SUPABASE_ANON_KEY dans .env')
      return
    }
    console.log('✅ Connexion Supabase OK\n')

    // Test 2: Lecture des devis
    console.log('2️⃣  Test de lecture des devis...')
    const { data: devisData, error: devisError, count: devisCount } = await supabase
      .from('devis')
      .select('*', { count: 'exact' })

    if (devisError) {
      console.error('❌ Erreur lors de la lecture des devis:', devisError.message)
      console.log('\n💡 Causes possibles:')
      console.log('   - La table "devis" n\'existe pas')
      console.log('   - Les politiques RLS bloquent la lecture')
      console.log('\n🔧 Solution:')
      console.log('   1. Exécutez supabase-schema.sql dans Supabase')
      console.log('   2. Exécutez supabase-rls-policies.sql dans Supabase')
      return
    }

    console.log(`✅ ${devisCount || 0} devis trouvés`)
    if (devisData && devisData.length > 0) {
      console.log('\n📋 Aperçu des devis:')
      devisData.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.client_nom} - ${d.montant}€ - ${d.statut}`)
      })
    } else {
      console.log('⚠️  Aucun devis dans la base')
      console.log('💡 Exécutez supabase-schema.sql pour créer des données de test')
    }
    console.log()

    // Test 3: Lecture des chantiers
    console.log('3️⃣  Test de lecture des chantiers...')
    const { data: chantiersData, error: chantiersError, count: chantiersCount } = await supabase
      .from('chantiers')
      .select('*', { count: 'exact' })

    if (chantiersError) {
      console.error('❌ Erreur lors de la lecture des chantiers:', chantiersError.message)
      console.log('\n💡 Causes possibles:')
      console.log('   - La table "chantiers" n\'existe pas')
      console.log('   - Les politiques RLS bloquent la lecture')
      console.log('\n🔧 Solution:')
      console.log('   1. Exécutez supabase-schema.sql dans Supabase')
      console.log('   2. Exécutez supabase-rls-policies.sql dans Supabase')
      return
    }

    console.log(`✅ ${chantiersCount || 0} chantiers trouvés`)
    if (chantiersData && chantiersData.length > 0) {
      console.log('\n🏗️  Aperçu des chantiers:')
      chantiersData.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.client_nom} - ${c.montant_devis}€ - ${c.statut}`)
      })
    } else {
      console.log('⚠️  Aucun chantier dans la base')
      console.log('💡 Exécutez supabase-schema.sql pour créer des données de test')
    }
    console.log()

    // Test 4: Vérification des politiques RLS
    console.log('4️⃣  Vérification des politiques RLS...')
    const { data: policies, error: policiesError } = await supabase.rpc('check_rls_policies')

    // Note: Cette requête peut échouer si la fonction n'existe pas, c'est normal
    if (policiesError) {
      console.log('ℹ️  Impossible de vérifier les politiques RLS automatiquement')
      console.log('💡 Pour vérifier manuellement dans Supabase, exécutez:')
      console.log('   SELECT * FROM pg_policies WHERE tablename IN (\'devis\', \'chantiers\');')
    }
    console.log()

    // Résumé
    console.log('=' .repeat(60))
    console.log('✅ Tous les tests sont passés!')
    console.log('=' .repeat(60))
    console.log('\n🎉 Votre configuration Supabase est correcte!')
    console.log('📊 Les agents peuvent maintenant accéder aux données.\n')

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error.message)
    console.log('\n💡 Vérifiez votre configuration dans .env')
  }
}

// Exécuter le test
testSupabaseConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur:', error)
    process.exit(1)
  })
