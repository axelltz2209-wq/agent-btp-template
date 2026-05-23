'use client'

import { useState } from 'react'

interface TriggerButtonProps {
  agentName: string
  onTrigger?: () => void
}

export function TriggerButton({ agentName, onTrigger }: TriggerButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleTrigger = async () => {
    if (loading) return

    const confirmed = confirm(`Voulez-vous lancer l'agent ${agentName} manuellement ?`)
    if (!confirmed) return

    setLoading(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        onTrigger?.()
      } else {
        throw new Error(data.message || 'Erreur lors du déclenchement')
      }
    } catch (error) {
      console.error('Error triggering agent:', error)
      setStatus('error')
    } finally {
      setLoading(false)

      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={loading}
      className={`
        relative px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-300
        ${
          loading
            ? 'bg-gray-700 text-gray-400 cursor-wait'
            : status === 'success'
              ? 'bg-green-600 text-white'
              : status === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/50'
        }
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Lancement...
        </span>
      ) : status === 'success' ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Lancé !
        </span>
      ) : status === 'error' ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Erreur
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Lancer
        </span>
      )}
    </button>
  )
}
