import { getDevisEnAttente, supabase } from '../lib/supabase.js'
import { genererMessageRelance } from '../lib/claude.js'
import { envoyerRelanceDevis, envoyerErreur, envoyerMessage } from '../lib/telegram.js'

/**
 * Log agent activity to database
 */
async function logAgentActivity(action, status = 'success', details = null) {
  try {
    await supabase.from('agent_logs').insert({
      agent_name: 'relance-devis',
      action,
      status,
      details,
    })
  } catch (error) {
    console.error('Failed to log agent activity:', error)
  }
}

/**
 * Agent de relance des devis
 * Vérifie les devis en attente depuis plus de 3 jours
 * et génère des messages de relance
 */
async function relanceDevisAgent() {
  console.log('🤖 [Agent Relance Devis] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Récupérer les devis en attente depuis plus de 3 jours
    const devis = await getDevisEnAttente(3)

    console.log(`📋 ${devis.length} devis en attente trouvés`)

    if (devis.length === 0) {
      console.log('✅ Aucun devis à relancer aujourd\'hui')
      await envoyerMessage('✅ <b>Relance Devis</b>\n\nAucun devis à relancer aujourd\'hui. 👍')
      await logAgentActivity('Aucun devis à relancer', 'success')
      return
    }

    // Pour chaque devis, générer un message de relance
    for (const unDevis of devis) {
      console.log(`\n💬 Génération du message pour ${unDevis.client_nom}...`)

      // Générer le message avec Claude
      const messageRelance = await genererMessageRelance(unDevis)

      console.log(`✉️ Message généré :`)
      console.log(messageRelance)

      // Envoyer sur Telegram
      await envoyerRelanceDevis(unDevis, messageRelance)

      // Petite pause entre chaque envoi
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    await logAgentActivity(
      `${devis.length} relance(s) envoyée(s)`,
      'success',
      JSON.stringify({ count: devis.length })
    )

    console.log('\n✅ [Agent Relance Devis] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Relance Devis] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Relance Devis', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  relanceDevisAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default relanceDevisAgent
