import { getChantiersPrevu, supabase } from '../lib/supabase.js'
import { genererResumeCAPrev } from '../lib/claude.js'
import { envoyerResumeCASemaine, envoyerErreur, envoyerMessage } from '../lib/telegram.js'

/**
 * Log agent activity to database
 */
async function logAgentActivity(action, status = 'success', details = null) {
  try {
    await supabase.from('agent_logs').insert({
      agent_name: 'calcul-ca',
      action,
      status,
      details,
    })
  } catch (error) {
    console.error('Failed to log agent activity:', error)
  }
}

/**
 * Calcule le lundi de la semaine actuelle
 * @returns {Date} Date du lundi
 */
function getLundi() {
  const aujourdhui = new Date()
  const jour = aujourdhui.getDay()
  const diff = aujourdhui.getDate() - jour + (jour === 0 ? -6 : 1) // Ajuste si c'est dimanche
  return new Date(aujourdhui.setDate(diff))
}

/**
 * Calcule le dimanche de la semaine actuelle
 * @returns {Date} Date du dimanche
 */
function getDimanche() {
  const lundi = getLundi()
  const dimanche = new Date(lundi)
  dimanche.setDate(lundi.getDate() + 6)
  return dimanche
}

/**
 * Agent de calcul du CA prévu pour la semaine
 * Calcule le CA total des chantiers prévus cette semaine
 * et génère un résumé motivant
 */
async function calculCAAgent() {
  console.log('🤖 [Agent Calcul CA] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Calculer les dates de la semaine (lundi à dimanche)
    const lundi = getLundi()
    const dimanche = getDimanche()

    console.log(
      `📅 Période : ${lundi.toLocaleDateString('fr-FR')} - ${dimanche.toLocaleDateString('fr-FR')}`
    )

    // Récupérer les chantiers prévus cette semaine
    const chantiers = await getChantiersPrevu(lundi, dimanche)

    console.log(`🏗️ ${chantiers.length} chantiers prévus cette semaine`)

    if (chantiers.length === 0) {
      console.log('⚠️ Aucun chantier prévu cette semaine')
      await envoyerMessage(
        '⚠️ <b>CA Hebdomadaire</b>\n\nAucun chantier prévu cette semaine.\nPensez à prospecter ! 💪'
      )
      await logAgentActivity('Aucun chantier cette semaine', 'warning')
      return
    }

    // Calculer le CA total
    const totalCA = chantiers.reduce((sum, c) => sum + parseFloat(c.montant_devis), 0)

    console.log(`💰 CA total prévu : ${totalCA}€`)

    // Générer le résumé avec Claude
    console.log('💬 Génération du résumé...')
    const resume = await genererResumeCAPrev(chantiers)

    console.log(`\n📝 Résumé généré :`)
    console.log(resume)

    // Envoyer sur Telegram
    await envoyerResumeCASemaine(chantiers, resume)

    await logAgentActivity(
      'CA hebdomadaire calculé',
      'success',
      JSON.stringify({ chantiersCount: chantiers.length, totalCA })
    )

    console.log('\n✅ [Agent Calcul CA] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Calcul CA] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Calcul CA', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  calculCAAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default calculCAAgent
