'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/drivers', label: 'Drivers', icon: '👥' },
  { href: '/deliveries', label: 'Deliveries', icon: '📦' },
  { href: '/penalties', label: 'Penalties', icon: '⚠️' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div
      style={{
        width: '200px',
        minWidth: '200px',
        background: '#12122a',
        borderRight: '1px solid #2a2a4a',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid #2a2a4a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#f97316',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            🚚
          </div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#f97316' }}>
            RakAshi
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', paddingLeft: '40px' }}>
          Admin Panel
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 10px',
                borderRadius: '8px',
                marginBottom: '4px',
                textDecoration: 'none',
                background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                color: isActive ? '#f97316' : '#9ca3af',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #2a2a4a' }}>
        <form action={logout}>
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.1)'
              e.currentTarget.style.color = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#9ca3af'
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
