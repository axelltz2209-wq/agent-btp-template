import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const VALID_AGENTS = [
  'relance-devis',
  'daily-briefing',
  'avis-client',
  'suivi-chantier',
  'prospection',
  'reporting',
]

export async function POST(request: NextRequest) {
  try {
    const { agentName } = await request.json()

    // Validate agent name
    if (!agentName || !VALID_AGENTS.includes(agentName)) {
      return NextResponse.json(
        { success: false, message: 'Agent invalide' },
        { status: 400 }
      )
    }

    // Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Log the manual trigger
    const { error: logError } = await supabase.from('agent_logs').insert({
      agent_name: agentName,
      action: `Agent déclenché manuellement par ${user.email}`,
      status: 'success',
      details: 'Déclenchement manuel via le cockpit',
    })

    if (logError) {
      console.error('Error logging trigger:', logError)
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la journalisation' },
        { status: 500 }
      )
    }

    // TODO: Here you would actually trigger the agent execution
    // For now, we just log it. In production, this would:
    // 1. Queue the agent for execution
    // 2. Call the agent's handler function
    // 3. Return the run ID

    console.log(`Manual trigger requested for agent: ${agentName}`)

    return NextResponse.json({
      success: true,
      message: `Agent ${agentName} déclenché avec succès`,
      runId: crypto.randomUUID(),
    })
  } catch (error) {
    console.error('Error in trigger endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
