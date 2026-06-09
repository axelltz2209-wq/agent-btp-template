import { supabase } from '../lib/supabase.js'
import Anthropic from '@anthropic-ai/sdk'
import { envoyerMessage, envoyerErreur } from '../lib/telegram.js'
import dotenv from 'dotenv'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Log agent activity to database
 */
async function logAgentActivity(action, status = 'success', details = null) {
  try {
    await supabase.from('agent_logs').insert({
      agent_name: 'avis-google',
      action,
      status,
      details,
    })
  } catch (error) {
    console.error('Failed to log agent activity:', error)
  }
}

/**
 * Génère un message SMS personnalisé pour demander un avis Google
 * @param {Object} chantier - Objet chantier {client_nom, montant_devis}
 * @returns {Promise<string>} Message SMS généré
 */
async function genererMessageAvisGoogle(chantier) {
  const prompt = `Tu es l'assistant d'un entrepreneur du BTP.
Le chantier de ${chantier.client_nom} (${chantier.montant_devis}€) vient de se terminer.

Génère un message SMS chaleureux et professionnel pour demander un avis Google.
Le message doit :
- Remercier le client pour sa confiance
- Mentionner que le chantier est terminé
- Demander un avis Google de façon naturelle (pas insistant)
- Inclure le lien : [VOTRE_LIEN_GOOGLE_REVIEW]
- Être court (2-3 phrases max pour un SMS)
- Être authentique et personnel

Ne mets pas de formule de politesse au début ni à la fin.
Rédige directement le corps du message.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  return message.content[0].text
}

/**
 * Agent de demande d'avis Google
 * Vérifie les chantiers terminés sans demande d'avis
 * et génère des messages SMS pour demander un avis
 */
async function avisGoogleAgent() {
  console.log('🤖 [Agent Avis Google] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Récupérer les chantiers terminés sans demande d'avis
    const { data: chantiersTermines, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('statut', 'termine')
      .eq('avis_demande', false)
      .order('updated_at', { ascending: false })

    if (error) throw error

    console.log(`✅ ${chantiersTermines?.length || 0} chantiers terminés sans demande d'avis`)

    if (!chantiersTermines || chantiersTermines.length === 0) {
      console.log('✅ Aucun chantier terminé à traiter aujourd\'hui')
      await logAgentActivity('Aucune demande d\'avis à envoyer', 'success')
      return
    }

    // Pour chaque chantier terminé, générer un message d'avis
    for (const chantier of chantiersTermines) {
      console.log(`\n⭐ Génération message avis pour ${chantier.client_nom}...`)

      // Générer le message avec Claude
      const messageSMS = await genererMessageAvisGoogle(chantier)

      console.log(`📱 Message SMS généré :`)
      console.log(messageSMS)

      // Envoyer sur Telegram avec les infos du client
      const telegramMessage = `⭐ <b>DEMANDE AVIS GOOGLE</b>

📋 <b>Client :</b> ${chantier.client_nom}
💰 <b>Montant du chantier :</b> ${chantier.montant_devis}€
📞 <b>Téléphone :</b> ${chantier.telephone || 'Non renseigné'}
📅 <b>Date de début :</b> ${new Date(chantier.date_debut).toLocaleDateString(
        'fr-FR'
      )}

<b>📱 Message SMS à envoyer :</b>
<i>${messageSMS}</i>

🔗 Lien Google : [VOTRE_LIEN_GOOGLE_REVIEW]

────────────────────`

      await envoyerMessage(telegramMessage)

      // Marquer la demande comme effectuée
      const { error: updateError } = await supabase
        .from('chantiers')
        .update({ avis_demande: true })
        .eq('id', chantier.id)

      if (updateError) {
        console.error('Erreur lors de la mise à jour du chantier:', updateError)
      } else {
        console.log(`✅ Chantier ${chantier.client_nom} marqué comme avis_demande = true`)
      }

      // Petite pause entre chaque envoi
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    await logAgentActivity(
      `${chantiersTermines.length} demande(s) d'avis envoyée(s)`,
      'success',
      JSON.stringify({ count: chantiersTermines.length })
    )

    console.log('\n✅ [Agent Avis Google] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Avis Google] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Avis Google', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)

if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  avisGoogleAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default avisGoogleAgent
