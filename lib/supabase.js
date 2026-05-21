import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Récupère les devis en attente depuis plus de X jours
 * @param {number} days - Nombre de jours
 * @returns {Promise<Array>} Liste des devis
 */
export async function getDevisEnAttente(days = 3) {
  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - days)

  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('statut', 'en_attente')
    .lt('date_envoi', dateLimit.toISOString())

  if (error) {
    console.error('Erreur lors de la récupération des devis:', error)
    throw error
  }

  return data || []
}

/**
 * Récupère les chantiers prévus pour une période donnée
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Promise<Array>} Liste des chantiers
 */
export async function getChantiersPrevu(startDate, endDate) {
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('statut', 'prevu')
    .gte('date_debut', startDate.toISOString().split('T')[0])
    .lte('date_debut', endDate.toISOString().split('T')[0])

  if (error) {
    console.error('Erreur lors de la récupération des chantiers:', error)
    throw error
  }

  return data || []
}

/**
 * Met à jour le statut d'un devis
 * @param {string} devisId - ID du devis
 * @param {string} nouveauStatut - Nouveau statut
 * @returns {Promise<Object>} Devis mis à jour
 */
export async function updateDevisStatut(devisId, nouveauStatut) {
  const { data, error } = await supabase
    .from('devis')
    .update({ statut: nouveauStatut })
    .eq('id', devisId)
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la mise à jour du devis:', error)
    throw error
  }

  return data
}
