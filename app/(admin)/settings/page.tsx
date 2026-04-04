export default function SettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>管理者設定</p>
      </div>

      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {[
          {
            title: 'Supabase接続',
            description: '接続先のSupabaseプロジェクト設定',
            value: process.env.NEXT_PUBLIC_SUPABASE_URL
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(8, 30)}...`
              : '未設定',
            status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error',
          },
          {
            title: '管理者認証',
            description: '管理者パスワード（環境変数 ADMIN_PASSWORD）',
            value: '設定済み',
            status: 'ok',
          },
        ].map(({ title, description, value, status }) => (
          <div
            key={title}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #2a2a4a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>{description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontFamily: 'monospace' }}>
                {value}
              </div>
              <span
                style={{
                  background: status === 'ok' ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                  color: status === 'ok' ? '#16a34a' : '#dc2626',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                }}
              >
                {status === 'ok' ? '正常' : 'エラー'}
              </span>
            </div>
          </div>
        ))}

        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>Supabase テーブル設定</div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
            penaltiesテーブルが未作成の場合は以下のSQLをSupabaseで実行してください
          </div>
          <pre
            style={{
              background: '#0f0f1a',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '14px',
              color: '#a5f3fc',
              fontSize: '12px',
              overflowX: 'auto',
              margin: 0,
            }}
          >
{`CREATE TABLE IF NOT EXISTS penalties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  driver_id text NOT NULL,
  type text NOT NULL,
  message text,
  created_by text DEFAULT 'admin',
  resolved_at timestamptz
);`}
          </pre>
        </div>
      </div>
    </div>
  )
}
