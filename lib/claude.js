import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.ANTHROPIC_API_KEY

if (!apiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable')
}

const anthropic = new Anthropic({
  apiKey: apiKey,
})

/**
 * Génère un message de relance pour un devis
 * @param {Object} devis - Objet devis {client_nom, montant, date_envoi, telephone}
 * @returns {Promise<string>} Message de relance généré
 */
export async function genererMessageRelance(devis) {
  const joursEcoules = Math.floor(
    (new Date() - new Date(devis.date_envoi)) / (1000 * 60 * 60 * 24)
  )

  const prompt = `Tu es l'assistant d'un entrepreneur du BTP.
Un devis de ${devis.montant}€ a été envoyé à ${devis.client_nom} il y a ${joursEcoules} jours.
Le client n'a pas encore répondu.

Génère un message de relance professionnel, courtois et personnalisé.
Le message doit :
- Rappeler le devis
- Montrer de l'intérêt pour le projet
- Proposer d'être disponible pour des questions
- Rester sympathique et pas insistant
- Faire environ 3-4 lignes

Ne mets pas de formule de politesse au début ni à la fin (pas de "Bonjour" ni "Cordialement").
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
 * Génère un résumé du CA prévu pour la semaine
 * @param {Array} chantiers - Liste des chantiers [{client_nom, montant_devis, date_debut}]
 * @returns {Promise<string>} Résumé généré
 */
export async function genererResumeCAPrev(chantiers) {
  const totalCA = chantiers.reduce((sum, c) => sum + parseFloat(c.montant_devis), 0)

  const chantiersTexte = chantiers
    .map(
      (c) =>
        `- ${c.client_nom}: ${c.montant_devis}€ (début: ${new Date(
          c.date_debut
        ).toLocaleDateString('fr-FR')})`
    )
    .join('\n')

  const prompt = `Tu es l'assistant d'un entrepreneur du BTP.
Voici les chantiers prévus cette semaine :

${chantiersTexte}

Total CA prévu : ${totalCA}€

Génère un message de résumé motivant qui :
- Résume la semaine à venir
- Donne le CA total prévu
- Liste les chantiers de façon concise
- Termine par une note motivante

Le message doit faire environ 5-6 lignes et être optimiste.`

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
