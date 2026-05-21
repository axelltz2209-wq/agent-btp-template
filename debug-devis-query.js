import { supabase } from './lib/supabase.js'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Script de debug pour comprendre pourquoi getDevisEnAttente() retourne 0 résultats
 */
async function debugDevisQuery() {
  console.log('🔍 DEBUG: Requête de récupération des devis\n')
  console.log('=' .repeat(70))

  // Étape 1: Vérifier tous les devis dans la base (sans filtre)
  console.log('\n1️⃣  TOUS LES DEVIS (sans filtre):')
  console.log('-'.repeat(70))

  const { data: allDevis, error: allError } = await supabase
    .from('devis')
    .select('*')
    .order('date_envoi', { ascending: false })

  if (allError) {
    console.error('❌ Erreur:', allError.message)
    return
  }

  if (!allDevis || allDevis.length === 0) {
    console.log('❌ AUCUN devis dans la base!')
    console.log('💡 Solution: Exécutez supabase-schema.sql dans Supabase')
    return
  }

  console.log(`✅ ${allDevis.length} devis trouvés au total\n`)

  allDevis.forEach((d, i) => {
    const dateEnvoi = new Date(d.date_envoi)
    const joursEcoules = Math.floor((new Date() - dateEnvoi) / (1000 * 60 * 60 * 24))
    console.log(`   ${i + 1}. ${d.client_nom}`)
    console.log(`      - Montant: ${d.montant}€`)
    console.log(`      - Statut: ${d.statut}`)
    console.log(`      - Date envoi: ${d.date_envoi}`)
    console.log(`      - Date envoi (formatée): ${dateEnvoi.toLocaleString('fr-FR')}`)
    console.log(`      - Jours écoulés: ${joursEcoules} jours`)
    console.log()
  })

  // Étape 2: Filtrer par statut "en_attente"
  console.log('2️⃣  DEVIS avec statut = "en_attente":')
  console.log('-'.repeat(70))

  const { data: devisEnAttente, error: statutError } = await supabase
    .from('devis')
    .select('*')
    .eq('statut', 'en_attente')

  if (statutError) {
    console.error('❌ Erreur:', statutError.message)
    return
  }

  console.log(`✅ ${devisEnAttente?.length || 0} devis en attente\n`)

  if (devisEnAttente && devisEnAttente.length > 0) {
    devisEnAttente.forEach((d, i) => {
      const dateEnvoi = new Date(d.date_envoi)
      const joursEcoules = Math.floor((new Date() - dateEnvoi) / (1000 * 60 * 60 * 24))
      console.log(`   ${i + 1}. ${d.client_nom} - ${joursEcoules} jours`)
    })
  } else {
    console.log('⚠️  Aucun devis avec statut "en_attente"')
    console.log('💡 Vérifiez que le statut est exactement "en_attente" (pas "En attente" ou autre)')
  }

  // Étape 3: Calculer la date limite (il y a 3 jours)
  console.log('\n3️⃣  CALCUL DE LA DATE LIMITE:')
  console.log('-'.repeat(70))

  const days = 3
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - days)

  console.log(`Aujourd'hui: ${new Date().toISOString()}`)
  console.log(`Date limite (il y a ${days} jours): ${dateLimit.toISOString()}`)
  console.log(`Date limite (formatée): ${dateLimit.toLocaleString('fr-FR')}`)

  // Étape 4: Appliquer le filtre date
  console.log('\n4️⃣  REQUÊTE COMPLÈTE (statut + date):')
  console.log('-'.repeat(70))
  console.log('Requête:')
  console.log('  .from("devis")')
  console.log('  .select("*")')
  console.log('  .eq("statut", "en_attente")')
  console.log(`  .lt("date_envoi", "${dateLimit.toISOString()}")`)
  console.log()

  const { data: filteredDevis, error: filterError } = await supabase
    .from('devis')
    .select('*')
    .eq('statut', 'en_attente')
    .lt('date_envoi', dateLimit.toISOString())

  if (filterError) {
    console.error('❌ Erreur:', filterError.message)
    return
  }

  console.log(`📊 Résultat: ${filteredDevis?.length || 0} devis\n`)

  if (filteredDevis && filteredDevis.length > 0) {
    console.log('✅ Devis trouvés:')
    filteredDevis.forEach((d, i) => {
      const dateEnvoi = new Date(d.date_envoi)
      const joursEcoules = Math.floor((new Date() - dateEnvoi) / (1000 * 60 * 60 * 24))
      console.log(`   ${i + 1}. ${d.client_nom}`)
      console.log(`      - Date envoi: ${dateEnvoi.toLocaleString('fr-FR')}`)
      console.log(`      - Jours écoulés: ${joursEcoules} jours`)
      console.log(`      - ✅ ${joursEcoules} > ${days} jours`)
    })
  } else {
    console.log('❌ AUCUN devis trouvé avec ces critères!')
    console.log('\n🔍 ANALYSE:')

    if (devisEnAttente && devisEnAttente.length > 0) {
      console.log('\nVérification des dates pour chaque devis:')
      devisEnAttente.forEach((d) => {
        const dateEnvoi = new Date(d.date_envoi)
        const joursEcoules = Math.floor((new Date() - dateEnvoi) / (1000 * 60 * 60 * 24))
        const condition = dateEnvoi < dateLimit
        console.log(`\n   📋 ${d.client_nom}:`)
        console.log(`      Date envoi: ${dateEnvoi.toISOString()}`)
        console.log(`      Date limite: ${dateLimit.toISOString()}`)
        console.log(`      Jours écoulés: ${joursEcoules}`)
        console.log(`      date_envoi < dateLimit ? ${condition}`)
        console.log(`      Devrait matcher ? ${joursEcoules > days ? '✅ OUI' : '❌ NON'}`)
      })
    }
  }

  // Étape 5: Test avec une date limite fixe très ancienne
  console.log('\n5️⃣  TEST avec date limite = 1 jour:')
  console.log('-'.repeat(70))

  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { data: testDevis, error: testError } = await supabase
    .from('devis')
    .select('*')
    .eq('statut', 'en_attente')
    .lt('date_envoi', oneDayAgo.toISOString())

  if (testError) {
    console.error('❌ Erreur:', testError.message)
  } else {
    console.log(`📊 Résultat: ${testDevis?.length || 0} devis trouvés`)
    console.log('💡 Si ce test retourne des résultats, le problème est la date limite de 3 jours')
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ Debug terminé')
  console.log('=' .repeat(70))
}

debugDevisQuery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur:', error)
    process.exit(1)
  })
