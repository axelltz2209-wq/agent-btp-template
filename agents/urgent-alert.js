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
      agent_name: 'urgent-alert',
      action,
      status,
      details,
    })
  } catch (error) {
    console.error('Failed to log agent activity:', error)
  }
}

/**
 * Génère un message d'alerte urgente personnalisé pour un devis
 * @param {Object} devis - Objet devis
 * @param {number} joursAttente - Nombre de jours d'attente
 * @returns {Promise<string>} Message d'alerte généré
 */
async function genererMessageUrgent(devis, joursAttente) {
  const prompt = `Tu es l'assistant de Patrick, artisan maçon.
Un devis de ${devis.montant}€ a été envoyé à ${devis.client_nom} il y a ${joursAttente} jours.
Le client n'a TOUJOURS PAS répondu malgré ce délai important.

Génère un message d'ALERTE URGENTE qui :
- Souligne l'urgence de la situation (${joursAttente} jours sans réponse)
- Suggère une action IMMÉDIATE (appel, relance finale)
- Rappelle le montant en jeu
- Est ferme mais professionnel
- Fait 2-3 lignes maximum

Le message doit avoir un ton d'urgence sans être agressif.`

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
 * Agent d'alertes urgentes
 * Vérifie les devis en attente depuis plus de 7 jours
 * et envoie des alertes immédiates
 */
async function urgentAlertAgent() {
  console.log('🤖 [Agent Urgent Alert] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Récupérer les devis en attente depuis plus de 7 jours
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - 7)

    const { data: devisUrgents, error } = await supabase
      .from('devis')
      .select('*')
      .eq('statut', 'en_attente')
      .lt('date_envoi', dateLimit.toISOString())
      .order('date_envoi', { ascending: true })

    if (error) throw error

    console.log(`🚨 ${devisUrgents?.length || 0} devis urgents trouvés (>7 jours)`)

    if (!devisUrgents || devisUrgents.length === 0) {
      console.log('✅ Aucun devis urgent aujourd\'hui')
      await logAgentActivity('Aucune alerte urgente', 'success')
      return
    }

    // Calculer le montant total en jeu
    const montantTotal = devisUrgents.reduce(
      (sum, d) => sum + parseFloat(d.montant),
      0
    )

    console.log(`💰 Montant total en jeu : ${montantTotal}€`)

    // Envoyer une alerte groupée d'abord
    const resumeMessage = `🚨 <b>ALERTE URGENTE</b>

<b>${devisUrgents.length} devis en attente depuis plus de 7 jours !</b>

💰 <b>Montant total en jeu :</b> ${montantTotal.toFixed(2)}€

<b>Action immédiate requise pour éviter les pertes !</b>

────────────────────`

    await envoyerMessage(resumeMessage)

    // Petite pause
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Pour chaque devis urgent, générer un message personnalisé
    for (const devis of devisUrgents) {
      const joursAttente = Math.floor(
        (new Date() - new Date(devis.date_envoi)) / (1000 * 60 * 60 * 24)
      )

      console.log(
        `\n🚨 Génération alerte pour ${devis.client_nom} (${joursAttente} jours)...`
      )

      // Générer le message urgent avec Claude
      const messageUrgent = await genererMessageUrgent(devis, joursAttente)

      console.log(`📢 Message généré :`)
      console.log(messageUrgent)

      // Envoyer l'alerte détaillée sur Telegram
      const alerteMessage = `🔴 <b>DEVIS URGENT ${joursAttente} JOURS</b>

📋 <b>Client :</b> ${devis.client_nom}
💰 <b>Montant :</b> ${devis.montant}€
📅 <b>Date d'envoi :</b> ${new Date(devis.date_envoi).toLocaleDateString(
        'fr-FR'
      )}
📞 <b>Téléphone :</b> ${devis.telephone || 'Non renseigné'}
⏰ <b>En attente depuis :</b> ${joursAttente} jours

<b>⚡ ACTION IMMÉDIATE :</b>
<i>${messageUrgent}</i>

────────────────────`

      await envoyerMessage(alerteMessage)

      // Pause entre chaque alerte
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    await logAgentActivity(
      `${devisUrgents.length} alerte(s) urgente(s) envoyée(s)`,
      'success',
      JSON.stringify({ count: devisUrgents.length, totalAmount: montantTotal })
    )

    console.log('\n✅ [Agent Urgent Alert] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Urgent Alert] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Urgent Alert', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  urgentAlertAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default urgentAlertAgent
