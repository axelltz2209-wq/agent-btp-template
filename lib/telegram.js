import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID

if (!token || !chatId) {
  throw new Error('Missing Telegram environment variables')
}

const bot = new TelegramBot(token, { polling: false })

/**
 * Envoie un message sur Telegram
 * @param {string} message - Le message à envoyer
 * @param {Object} options - Options supplémentaires (parse_mode, etc.)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function envoyerMessage(message, options = {}) {
  try {
    const result = await bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...options,
    })
    console.log('✅ Message envoyé sur Telegram')
    return result
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi sur Telegram:', error.message)
    throw error
  }
}

/**
 * Envoie un message de relance de devis
 * @param {Object} devis - Objet devis
 * @param {string} messageRelance - Message de relance généré
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function envoyerRelanceDevis(devis, messageRelance) {
  const joursEcoules = Math.floor(
    (new Date() - new Date(devis.date_envoi)) / (1000 * 60 * 60 * 24)
  )

  const message = `🔔 <b>RELANCE DEVIS</b>

📋 <b>Client :</b> ${devis.client_nom}
💰 <b>Montant :</b> ${devis.montant}€
📅 <b>Envoyé il y a :</b> ${joursEcoules} jours
📞 <b>Téléphone :</b> ${devis.telephone || 'Non renseigné'}

<b>Message suggéré :</b>
<i>${messageRelance}</i>

────────────────────`

  return envoyerMessage(message)
}

/**
 * Envoie le résumé du CA prévu pour la semaine
 * @param {Array} chantiers - Liste des chantiers
 * @param {string} resume - Résumé généré par Claude
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function envoyerResumeCASemaine(chantiers, resume) {
  const totalCA = chantiers.reduce((sum, c) => sum + parseFloat(c.montant_devis), 0)

  const message = `📊 <b>RÉSUMÉ HEBDOMADAIRE</b>

💰 <b>CA prévu cette semaine :</b> ${totalCA.toFixed(2)}€
🏗️ <b>Nombre de chantiers :</b> ${chantiers.length}

${resume}

────────────────────`

  return envoyerMessage(message)
}

/**
 * Envoie un message d'erreur
 * @param {string} agentName - Nom de l'agent
 * @param {Error} error - L'erreur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function envoyerErreur(agentName, error) {
  const message = `⚠️ <b>ERREUR AGENT</b>

<b>Agent :</b> ${agentName}
<b>Erreur :</b> ${error.message}

<i>Vérifiez les logs pour plus de détails.</i>`

  return envoyerMessage(message)
}
