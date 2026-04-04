import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#f97316',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🚚
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#f97316',
                letterSpacing: '-0.5px',
              }}
            >
              RakAshi Admin
            </span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            管理者ポータルへようこそ
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
