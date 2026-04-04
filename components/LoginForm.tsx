'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <form action={action} style={{ width: '100%' }}>
      {state?.error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#fca5a5',
            fontSize: '13px',
          }}
        >
          {state.error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="id"
          style={{ display: 'block', marginBottom: '6px', color: '#9ca3af', fontSize: '12px' }}
        >
          管理者ID
        </label>
        <input
          id="id"
          name="id"
          type="text"
          placeholder="admin"
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#0f0f1a',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#f97316')}
          onBlur={(e) => (e.target.style.borderColor = '#2a2a4a')}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="password"
          style={{ display: 'block', marginBottom: '6px', color: '#9ca3af', fontSize: '12px' }}
        >
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#0f0f1a',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#f97316')}
          onBlur={(e) => (e.target.style.borderColor = '#2a2a4a')}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          width: '100%',
          padding: '12px',
          background: pending ? '#c2531e' : '#f97316',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: pending ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {pending ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}
