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
      agent_name: 'daily-briefing',
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
  const diff = aujourdhui.getDate() - jour + (jour === 0 ? -6 : 1)
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
 * Agent de briefing quotidien
 * Envoie un résumé de la journée chaque matin à 7h
 */
async function dailyBriefingAgent() {
  console.log('🤖 [Agent Daily Briefing] Démarrage...')

  try {
    await logAgentActivity('Agent démarré', 'success')

    // Récupérer tous les devis en attente
    const { data: devisEnAttente, error: devisError } = await supabase
      .from('devis')
      .select('*')
      .eq('statut', 'en_attente')
      .order('date_envoi', { ascending: true })

    if (devisError) throw devisError

    // Récupérer les chantiers de la semaine
    const lundi = getLundi()
    const dimanche = getDimanche()

    const { data: chantiersWeek, error: chantiersError } = await supabase
      .from('chantiers')
      .select('*')
      .gte('date_debut', lundi.toISOString().split('T')[0])
      .lte('date_debut', dimanche.toISOString().split('T')[0])

    if (chantiersError) throw chantiersError

    // Récupérer les chantiers du jour
    const aujourdhui = new Date().toISOString().split('T')[0]
    const { data: chantiersAujourdhui, error: chantiersJourError } = await supabase
      .from('chantiers')
      .select('*')
      .eq('date_debut', aujourdhui)

    if (chantiersJourError) throw chantiersJourError

    console.log(`📋 ${devisEnAttente?.length || 0} devis en attente`)
    console.log(`🏗️ ${chantiersWeek?.length || 0} chantiers cette semaine`)
    console.log(`📅 ${chantiersAujourdhui?.length || 0} chantiers aujourd'hui`)

    // Préparer le contexte pour Claude
    const devisTexte =
      devisEnAttente && devisEnAttente.length > 0
        ? devisEnAttente
            .map((d) => {
              const joursAttente = Math.floor(
                (new Date() - new Date(d.date_envoi)) / (1000 * 60 * 60 * 24)
              )
              return `- ${d.client_nom}: ${d.montant}€ (en attente depuis ${joursAttente} jours)`
            })
            .join('\n')
        : 'Aucun devis en attente'

    const chantiersWeekTexte =
      chantiersWeek && chantiersWeek.length > 0
        ? chantiersWeek
            .map(
              (c) =>
                `- ${c.client_nom}: ${c.montant_devis}€ (${new Date(
                  c.date_debut
                ).toLocaleDateString('fr-FR')})`
            )
            .join('\n')
        : 'Aucun chantier prévu cette semaine'

    const chantiersJourTexte =
      chantiersAujourdhui && chantiersAujourdhui.length > 0
        ? chantiersAujourdhui
            .map((c) => `- ${c.client_nom}: ${c.montant_devis}€`)
            .join('\n')
        : 'Aucun chantier aujourd\'hui'

    const totalCAWeek =
      chantiersWeek?.reduce((sum, c) => sum + parseFloat(c.montant_devis), 0) || 0

    // Générer le briefing avec Claude
    console.log('💬 Génération du briefing quotidien...')

    const prompt = `Tu es l'assistant de Patrick, artisan maçon.
Génère un briefing quotidien concis et motivant pour démarrer la journée.

DEVIS EN ATTENTE (${devisEnAttente?.length || 0}) :
${devisTexte}

CHANTIERS AUJOURD'HUI (${chantiersAujourdhui?.length || 0}) :
${chantiersJourTexte}

CHANTIERS CETTE SEMAINE (${chantiersWeek?.length || 0}) :
Total CA prévu : ${totalCAWeek}€
${chantiersWeekTexte}

Crée un briefing en 4-5 lignes qui :
- Résume l'activité du jour et de la semaine
- Met en avant les points importants
- Termine par une note motivante avec un emoji
- Utilise des émojis pour rendre le message vivant

Le message doit être concis, énergique et positif.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const briefing = message.content[0].text

    console.log(`\n📝 Briefing généré :`)
    console.log(briefing)

    // Envoyer sur Telegram
    const telegramMessage = `☀️ <b>BRIEFING DU JOUR</b>

${briefing}

📊 <b>Chiffres clés :</b>
• ${devisEnAttente?.length || 0} devis en attente
• ${chantiersAujourdhui?.length || 0} chantier(s) aujourd'hui
• ${chantiersWeek?.length || 0} chantier(s) cette semaine
• ${totalCAWeek.toFixed(2)}€ de CA prévu

────────────────────`

    await envoyerMessage(telegramMessage)

    await logAgentActivity(
      'Briefing quotidien envoyé',
      'success',
      JSON.stringify({
        devisCount: devisEnAttente?.length || 0,
        chantiersToday: chantiersAujourdhui?.length || 0,
        chantiersWeek: chantiersWeek?.length || 0,
      })
    )

    console.log('\n✅ [Agent Daily Briefing] Terminé avec succès')
  } catch (error) {
    console.error('❌ [Agent Daily Briefing] Erreur:', error)
    await logAgentActivity('Erreur lors de l\'exécution', 'error', error.message)
    await envoyerErreur('Agent Daily Briefing', error)
    throw error
  }
}

// Si le fichier est exécuté directement (pour les tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  dailyBriefingAgent()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default dailyBriefingAgent
