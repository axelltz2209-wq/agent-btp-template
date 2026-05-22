import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key (NEVER expose to client)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables')
}

// Create a Supabase client with service role key (bypasses RLS)
// This should ONLY be used in API routes, never in client components
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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
  avis_demande: boolean | null
}
