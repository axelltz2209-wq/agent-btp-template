import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Devis {
  id: string
  client_nom: string
  montant: number
  date_envoi: string
  statut: string
  telephone: string | null
}

export interface Chantier {
  id: string
  client_nom: string
  montant_devis: number
  date_debut: string
  statut: string
  telephone: string | null
  heures_travaillees: number | null
  depenses: number | null
}
