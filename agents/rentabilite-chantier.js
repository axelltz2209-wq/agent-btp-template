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
      agent_name: 'rentabilite-chantier',
      action,
      status,
      details,
    })
  } catch (error) {
    console.error('Failed to log agent activity:', error)
  }
}

/**
 * Génère une analyse de rentabilité avec recommandations
 * @param {Object} chantier - Objet chantier avec calculs de marge
 * @param {number} margeReelle - Marge réelle calculée
 * @param {number} margePct - Pourcentage de marge
 * @param {string} status - Status: "danger", "warning", "success"
 * @returns {Promise<string>} Analyse générée
 */
async function genererAnalyseRentabilite(chantier, margeReelle, margePct, status) {
  const coutMainOeuvre = chantier.heures_travaillees * 45
  const coutTotal = coutMainOeuvre + chantier.depenses

  const prompt = `Tu es l'assistant financier de Patrick, artisan maçon.

CHANTIER : ${chantier.client_nom}
• Montant devis : ${chantier.montant_devis}€
• Heures travaillées : ${chantier.heures_travaillees}h (coût: ${coutMainOeuvre}€ à 45€/h)
• Dépenses : ${chantier.depenses}€
• Coût total : ${coutTotal}€
• Marge réelle : ${margeReelle}€ (${margePct}%)

STATUS : ${status === 'danger' ? '🔴 CRITIQUE' : status === 'warning' ? '🟠 ATTENTION' : '🟢 BON'}

Génère une analyse courte (2-3 lignes) qui :
- Évalue la situation financière du chantier
- Donne 1-2 recommandations concrètes ${
    status === 'danger'
      ? 'pour stopper les pertes'
      : status === 'warning'
      ? 'pour améliorer la marge'
      : 'pour maintenir cette bonne rentabilité'
  }
- Reste factuel et actionnable

Sois direct et professionnel.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
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
 * Agent d'analyse de rentabilité des chantiers
 * Calcule la marge réelle de chaque chantier en cours
 * et envoie des alertes selon le niveau de rentabilité
 */
async function rentabiliteChantierAgent() {
  console.log('🤖 [Agent Rentabilité Chantier] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Récupérer tous les chantiers en cours
    const { data: chantiersEnCours, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('statut', 'en_cours')
      .order('date_debut', { ascending: true })

    if (error) throw error

    console.log(`📊 ${chantiersEnCours?.length || 0} chantiers en cours à analyser`)

    if (!chantiersEnCours || chantiersEnCours.length === 0) {
      console.log('✅ Aucun chantier en cours à analyser')
      await envoyerMessage(
        '📊 <b>Analyse Rentabilité</b>\n\nAucun chantier en cours aujourd\'hui.'
      )
      await logAgentActivity('Aucun chantier à analyser', 'success')
      return
    }

    let alertesDanger = []
    let alertesWarning = []
    let alertesSuccess = []

    // Analyser chaque chantier
    for (const chantier of chantiersEnCours) {
      console.log(`\n💰 Analyse de ${chantier.client_nom}...`)

      // Calculer la marge réelle
      const coutMainOeuvre = (chantier.heures_travaillees || 0) * 45
      const depenses = chantier.depenses || 0
      const coutTotal = coutMainOeuvre + depenses
      const margeReelle = chantier.montant_devis - coutTotal
      const margePct = (margeReelle / chantier.montant_devis) * 100

      console.log(
        `  Montant: ${chantier.montant_devis}€ | Coût: ${coutTotal}€ | Marge: ${margeReelle.toFixed(
          2
        )}€ (${margePct.toFixed(1)}%)`
      )

      // Déterminer le statut
      let status
      let emoji
      if (margePct < 15) {
        status = 'danger'
        emoji = '🔴'
        alertesDanger.push({ chantier, margeReelle, margePct, status })
      } else if (margePct < 25) {
        status = 'warning'
        emoji = '🟠'
        alertesWarning.push({ chantier, margeReelle, margePct, status })
      } else {
        status = 'success'
        emoji = '🟢'
        alertesSuccess.push({ chantier, margeReelle, margePct, status })
      }

      console.log(`  ${emoji} Status: ${status}`)
    }

    // Envoyer le résumé global
    const totalChantiers = chantiersEnCours.length
    const resumeMessage = `📊 <b>ANALYSE RENTABILITÉ</b>

<b>${totalChantiers} chantier${totalChantiers > 1 ? 's' : ''} en cours analysé${
      totalChantiers > 1 ? 's' : ''
    } :</b>

🔴 <b>Critiques :</b> ${alertesDanger.length} chantier${
      alertesDanger.length > 1 ? 's' : ''
    } (marge < 15%)
🟠 <b>Attention :</b> ${alertesWarning.length} chantier${
      alertesWarning.length > 1 ? 's' : ''
    } (marge 15-25%)
🟢 <b>Rentables :</b> ${alertesSuccess.length} chantier${
      alertesSuccess.length > 1 ? 's' : ''
    } (marge > 25%)

────────────────────`

    await envoyerMessage(resumeMessage)

    // Pause
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Envoyer les alertes DANGER en priorité
    for (const alerte of alertesDanger) {
      console.log(`\n🔴 Génération alerte CRITIQUE pour ${alerte.chantier.client_nom}...`)

      const analyse = await genererAnalyseRentabilite(
        alerte.chantier,
        alerte.margeReelle,
        alerte.margePct,
        alerte.status
      )

      const coutMainOeuvre = (alerte.chantier.heures_travaillees || 0) * 45
      const coutTotal = coutMainOeuvre + (alerte.chantier.depenses || 0)

      const alerteMessage = `🔴 <b>ALERTE CRITIQUE - RENTABILITÉ</b>

📋 <b>Chantier :</b> ${alerte.chantier.client_nom}
💰 <b>Montant devis :</b> ${alerte.chantier.montant_devis}€

<b>📊 Coûts actuels :</b>
• Main d'œuvre : ${alerte.chantier.heures_travaillees}h × 45€ = ${coutMainOeuvre}€
• Dépenses : ${alerte.chantier.depenses}€
• <b>Total coûts :</b> ${coutTotal}€

<b>💸 Marge réelle :</b> ${alerte.margeReelle.toFixed(2)}€ (${alerte.margePct.toFixed(1)}%)

<b>🔍 Analyse :</b>
<i>${analyse}</i>

────────────────────`

      await envoyerMessage(alerteMessage)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Envoyer les alertes WARNING
    for (const alerte of alertesWarning) {
      console.log(`\n🟠 Génération alerte ATTENTION pour ${alerte.chantier.client_nom}...`)

      const analyse = await genererAnalyseRentabilite(
        alerte.chantier,
        alerte.margeReelle,
        alerte.margePct,
        alerte.status
      )

      const coutMainOeuvre = (alerte.chantier.heures_travaillees || 0) * 45
      const coutTotal = coutMainOeuvre + (alerte.chantier.depenses || 0)

      const alerteMessage = `🟠 <b>ATTENTION - RENTABILITÉ</b>

📋 <b>Chantier :</b> ${alerte.chantier.client_nom}
💰 <b>Montant devis :</b> ${alerte.chantier.montant_devis}€

<b>📊 Coûts actuels :</b>
• Main d'œuvre : ${alerte.chantier.heures_travaillees}h × 45€ = ${coutMainOeuvre}€
• Dépenses : ${alerte.chantier.depenses}€
• <b>Total coûts :</b> ${coutTotal}€

<b>💸 Marge réelle :</b> ${alerte.margeReelle.toFixed(2)}€ (${alerte.margePct.toFixed(1)}%)

<b>🔍 Analyse :</b>
<i>${analyse}</i>

────────────────────`

      await envoyerMessage(alerteMessage)
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Envoyer les confirmations SUCCESS (condensé)
    if (alertesSuccess.length > 0) {
      const successList = alertesSuccess
        .map((a) => `• ${a.chantier.client_nom}: ${a.margePct.toFixed(1)}% de marge`)
        .join('\n')

      const successMessage = `🟢 <b>CHANTIERS RENTABLES</b>

${successList}

Excellent travail ! Continuez sur cette lancée. 💪

────────────────────`

      await envoyerMessage(successMessage)
    }

    await logAgentActivity(
      `${totalChantiers} chantier(s) analysé(s)`,
      'success',
      JSON.stringify({
        total: totalChantiers,
        danger: alertesDanger.length,
        warning: alertesWarning.length,
        success: alertesSuccess.length,
      })
    )

    console.log('\n✅ [Agent Rentabilité Chantier] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Rentabilité Chantier] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Rentabilité Chantier', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  rentabiliteChantierAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default rentabiliteChantierAgent
