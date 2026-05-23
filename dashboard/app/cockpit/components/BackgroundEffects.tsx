'use client'

import styles from '../cockpit.module.css'

export function BackgroundEffects() {
  return (
    <>
      {/* Animated grid background */}
      <div
        className={`fixed inset-0 pointer-events-none ${styles.gridMove}`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(249, 115, 22, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Radial glow effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`fixed w-1 h-1 bg-orange-500/30 rounded-full pointer-events-none ${styles.float}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}

      {/* Scan line effect */}
      <div
        className={`fixed left-0 right-0 h-px pointer-events-none ${styles.scan}`}
        style={{
          background: 'linear-gradient(to right, transparent, rgba(6, 182, 212, 0.5), transparent)',
        }}
      />
    </>
  )
}
