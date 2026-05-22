/**
 * Utilitaires de validation pour les agents
 * Sécurise les données avant traitement et prévient les injections
 */

/**
 * Valide qu'un objet devis a tous les champs requis et types corrects
 * @param {Object} devis - Objet devis à valider
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateDevis(devis) {
  const errors = []

  if (!devis) {
    return { valid: false, errors: ['Devis object is null or undefined'] }
  }

  // Validation du nom client (string non vide, max 255 caractères)
  if (!devis.client_nom || typeof devis.client_nom !== 'string') {
    errors.push('client_nom must be a non-empty string')
  } else if (devis.client_nom.length > 255) {
    errors.push('client_nom must be less than 255 characters')
  } else if (devis.client_nom.trim().length === 0) {
    errors.push('client_nom cannot be only whitespace')
  }

  // Validation du montant (number positif)
  if (typeof devis.montant !== 'number' && typeof devis.montant !== 'string') {
    errors.push('montant must be a number or numeric string')
  } else {
    const montant = parseFloat(devis.montant)
    if (isNaN(montant) || montant < 0) {
      errors.push('montant must be a positive number')
    } else if (montant > 1000000) {
      errors.push('montant seems unreasonably high (>1M€)')
    }
  }

  // Validation de la date d'envoi (date valide)
  if (!devis.date_envoi) {
    errors.push('date_envoi is required')
  } else {
    const date = new Date(devis.date_envoi)
    if (isNaN(date.getTime())) {
      errors.push('date_envoi must be a valid date')
    } else if (date > new Date()) {
      errors.push('date_envoi cannot be in the future')
    }
  }

  // Validation du statut (enum)
  const validStatuses = ['en_attente', 'accepte', 'refuse']
  if (!validStatuses.includes(devis.statut)) {
    errors.push(`statut must be one of: ${validStatuses.join(', ')}`)
  }

  // Validation du téléphone (optionnel, mais si présent doit être valide)
  if (devis.telephone) {
    if (typeof devis.telephone !== 'string') {
      errors.push('telephone must be a string')
    } else {
      // Format français: 0X XX XX XX XX ou +33X XX XX XX XX
      const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/
      if (!phoneRegex.test(devis.telephone.replace(/\s/g, ''))) {
        errors.push('telephone must be a valid French phone number')
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide qu'un objet chantier a tous les champs requis et types corrects
 * @param {Object} chantier - Objet chantier à valider
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateChantier(chantier) {
  const errors = []

  if (!chantier) {
    return { valid: false, errors: ['Chantier object is null or undefined'] }
  }

  // Validation du nom client
  if (!chantier.client_nom || typeof chantier.client_nom !== 'string') {
    errors.push('client_nom must be a non-empty string')
  } else if (chantier.client_nom.length > 255) {
    errors.push('client_nom must be less than 255 characters')
  }

  // Validation du montant devis
  if (typeof chantier.montant_devis !== 'number' && typeof chantier.montant_devis !== 'string') {
    errors.push('montant_devis must be a number or numeric string')
  } else {
    const montant = parseFloat(chantier.montant_devis)
    if (isNaN(montant) || montant < 0) {
      errors.push('montant_devis must be a positive number')
    }
  }

  // Validation de la date de début
  if (!chantier.date_debut) {
    errors.push('date_debut is required')
  } else {
    const date = new Date(chantier.date_debut)
    if (isNaN(date.getTime())) {
      errors.push('date_debut must be a valid date')
    }
  }

  // Validation du statut
  const validStatuses = ['prevu', 'en_cours', 'termine', 'annule']
  if (!validStatuses.includes(chantier.statut)) {
    errors.push(`statut must be one of: ${validStatuses.join(', ')}`)
  }

  // Validation des heures travaillées (si présent)
  if (chantier.heures_travaillees != null) {
    const heures = parseFloat(chantier.heures_travaillees)
    if (isNaN(heures) || heures < 0) {
      errors.push('heures_travaillees must be a positive number')
    } else if (heures > 10000) {
      errors.push('heures_travaillees seems unreasonably high (>10000h)')
    }
  }

  // Validation des dépenses (si présent)
  if (chantier.depenses != null) {
    const depenses = parseFloat(chantier.depenses)
    if (isNaN(depenses) || depenses < 0) {
      errors.push('depenses must be a positive number')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Nettoie et sanitize une chaîne pour éviter les injections
 * @param {string} str - Chaîne à sanitizer
 * @returns {string} Chaîne nettoyée
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return ''

  return str
    .trim()
    .replace(/[<>]/g, '') // Supprime < et > pour éviter XSS
    .substring(0, 1000) // Limite la longueur
}

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide les variables d'environnement critiques au démarrage
 * @throws {Error} Si des variables critiques manquent
 */
export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'ANTHROPIC_API_KEY',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Valide que les clés ne sont pas les valeurs par défaut de l'exemple
  const exampleValues = [
    'your-key-here',
    'your-project',
    'sk-ant-your-key',
    'your-telegram-bot-token',
    'your-chat-id',
  ]

  for (const key of required) {
    const value = process.env[key]
    if (exampleValues.some((example) => value?.includes(example))) {
      throw new Error(`Environment variable ${key} still contains example value. Please set a real value.`)
    }
  }
}
