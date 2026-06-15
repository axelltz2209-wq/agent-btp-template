'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import companyConfig from '@/config/company'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const redirectTo = searchParams.get('redirectedFrom') || '/'
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Une erreur est survenue lors de la connexion')
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 text-sm rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-slate-50"
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden bg-white"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ borderBottom: '1px solid #E2E8F0' }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
              }}
            >
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{companyConfig.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Connectez-vous à votre tableau de bord</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white"
                style={{
                  background: loading ? '#2563eb' : '#3b82f6',
                  boxShadow: loading ? 'none' : '0 2px 8px rgba(59, 130, 246, 0.25)',
                }}
                onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = '#2563eb')}
                onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = '#3b82f6')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Tableau de bord — Gestion BTP
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
