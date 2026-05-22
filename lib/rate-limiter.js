/**
 * Rate limiter simple pour les appels API (Claude, etc.)
 * Prévient les appels excessifs et les coûts incontrôlés
 */

class RateLimiter {
  constructor(maxRequests = 60, windowMs = 60 * 60 * 1000) {
    this.maxRequests = maxRequests // Nombre max de requêtes
    this.windowMs = windowMs // Fenêtre de temps en ms (default: 1 heure)
    this.requests = [] // Tableau des timestamps des requêtes
    this.blocked = false
    this.blockUntil = null
  }

  /**
   * Vérifie si une requête peut être effectuée
   * @returns {{allowed: boolean, retryAfter: number|null, remaining: number}}
   */
  checkLimit() {
    const now = Date.now()

    // Si bloqué, vérifie si le blocage est expiré
    if (this.blocked && this.blockUntil && now < this.blockUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((this.blockUntil - now) / 1000), // secondes
        remaining: 0,
      }
    } else if (this.blocked) {
      // Débloquer si le temps est écoulé
      this.blocked = false
      this.blockUntil = null
    }

    // Nettoie les requêtes hors de la fenêtre de temps
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs)

    // Vérifie si on peut faire une nouvelle requête
    if (this.requests.length < this.maxRequests) {
      return {
        allowed: true,
        retryAfter: null,
        remaining: this.maxRequests - this.requests.length - 1,
      }
    }

    // Limite atteinte
    const oldestRequest = Math.min(...this.requests)
    const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000)

    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    }
  }

  /**
   * Enregistre une requête effectuée
   */
  recordRequest() {
    this.requests.push(Date.now())
  }

  /**
   * Bloque temporairement toutes les requêtes (circuit breaker)
   * @param {number} durationMs - Durée du blocage en ms
   */
  block(durationMs = 5 * 60 * 1000) {
    this.blocked = true
    this.blockUntil = Date.now() + durationMs
    console.warn(`⚠️ Rate limiter: Circuit breaker activated for ${durationMs / 1000}s`)
  }

  /**
   * Réinitialise le rate limiter
   */
  reset() {
    this.requests = []
    this.blocked = false
    this.blockUntil = null
  }

  /**
   * Retourne les statistiques du rate limiter
   * @returns {{total: number, remaining: number, resetIn: number}}
   */
  getStats() {
    const now = Date.now()
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs)

    const oldestRequest = this.requests.length > 0 ? Math.min(...this.requests) : now
    const resetIn = oldestRequest + this.windowMs - now

    return {
      total: this.requests.length,
      remaining: Math.max(0, this.maxRequests - this.requests.length),
      resetIn: Math.max(0, Math.ceil(resetIn / 1000)), // secondes
    }
  }
}

// Instance globale pour les appels Claude API
// Limite: 60 requêtes par heure (ajustable selon votre plan Anthropic)
export const claudeRateLimiter = new RateLimiter(
  process.env.CLAUDE_API_RATE_LIMIT || 60,
  60 * 60 * 1000 // 1 heure
)

// Instance globale pour les appels Telegram API
// Telegram limite: 30 messages par seconde, mais on limite à 10/minute pour éviter le spam
export const telegramRateLimiter = new RateLimiter(
  10, // 10 messages max
  60 * 1000 // par minute
)

/**
 * Wrapper pour appliquer le rate limiting à une fonction
 * @param {Function} fn - Fonction à wrapper
 * @param {RateLimiter} limiter - Rate limiter à utiliser
 * @param {string} name - Nom de l'opération (pour les logs)
 * @returns {Function} Fonction wrappée avec rate limiting
 */
export function withRateLimit(fn, limiter, name = 'API call') {
  return async function (...args) {
    const check = limiter.checkLimit()

    if (!check.allowed) {
      const error = new Error(
        `Rate limit exceeded for ${name}. Retry after ${check.retryAfter}s. Remaining: ${check.remaining}`
      )
      error.retryAfter = check.retryAfter
      error.remaining = check.remaining
      throw error
    }

    try {
      limiter.recordRequest()
      return await fn(...args)
    } catch (error) {
      // Si erreur 429 (Too Many Requests), active le circuit breaker
      if (error.status === 429 || error.message?.includes('rate limit')) {
        console.error(`❌ Rate limit error from ${name}, activating circuit breaker`)
        limiter.block()
      }
      throw error
    }
  }
}

/**
 * Middleware de rate limiting pour les agents
 * @param {string} agentName - Nom de l'agent
 * @param {RateLimiter} limiter - Rate limiter à utiliser
 */
export function rateLimitMiddleware(agentName, limiter) {
  const check = limiter.checkLimit()
  const stats = limiter.getStats()

  console.log(
    `📊 Rate limit status for ${agentName}: ${stats.total}/${limiter.maxRequests} requests used (${stats.remaining} remaining, resets in ${stats.resetIn}s)`
  )

  if (!check.allowed) {
    throw new Error(
      `⚠️ ${agentName}: Rate limit exceeded. Retry after ${check.retryAfter}s.`
    )
  }
}

export default RateLimiter
