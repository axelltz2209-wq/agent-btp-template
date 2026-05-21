'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import companyConfig from '@/config/company'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const getLinkClasses = (path: string) => {
    return `nav-item ${isActive(path) ? 'active' : ''}`
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col slide-in-left" style={{
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border-subtle)',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-105"
            style={{
              backgroundColor: companyConfig.color,
              boxShadow: `0 4px 12px ${companyConfig.color}40`
            }}
          >
            <span className="text-white font-bold text-base">{companyConfig.avatar}</span>
          </div>
          <span className="font-semibold text-base" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)'
          }}>
            {companyConfig.name}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8">
        <div className="space-y-1">
          <Link href="/" className={getLinkClasses('/')}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Tableau de bord
          </Link>

          <Link href="/devis" className={getLinkClasses('/devis')}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Devis
          </Link>

          <Link href="/chantiers" className={getLinkClasses('/chantiers')}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Chantiers
          </Link>

          <Link href="/agents" className={getLinkClasses('/agents')}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Agents
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-[var(--color-background)] cursor-pointer">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-blue) 0%, var(--color-accent-purple) 100%)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="text-white font-semibold text-sm">{companyConfig.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-primary)'
            }}>
              {companyConfig.owner}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
              Administrateur
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
