import { supabase } from '@/lib/supabase'
import Link from 'next/link'

async function getPenalties() {
  try {
    const { data } = await supabase
      .from('penalties')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    return data ?? []
  } catch {
    return []
  }
}

const penaltyLabels: Record<string, string> = {
  warning: '警告',
  account_freeze: 'アカウント凍結',
  payment_reminder: '支払い催促',
  score_adjust: 'スコア調整',
  suspension: '一時停止',
}

const penaltyColors: Record<string, string> = {
  warning: '#d97706',
  account_freeze: '#dc2626',
  payment_reminder: '#9ca3af',
  score_adjust: '#3b82f6',
  suspension: '#ef4444',
}

export const sqlForPenaltiesTable = `
CREATE TABLE IF NOT EXISTS penalties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  driver_id text NOT NULL,
  type text NOT NULL,
  message text,
  created_by text DEFAULT 'admin',
  resolved_at timestamptz
);
`

export default async function PenaltiesPage() {
  const penalties = await getPenalties()

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Penalties</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>
          ペナルティ履歴（{penalties.length}件）
        </p>
      </div>

      {/* SQL Note */}
      <div
        style={{
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#9ca3af',
        }}
      >
        <strong style={{ color: '#3b82f6' }}>ℹ️ Supabase Setup: </strong>
        penaltiesテーブルが未作成の場合は以下のSQLを実行してください:{' '}
        <code style={{ color: '#ffffff', fontSize: '11px' }}>
          CREATE TABLE IF NOT EXISTS penalties (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, created_at timestamptz DEFAULT now(), driver_id text NOT NULL, type text NOT NULL, message text, created_by text DEFAULT &apos;admin&apos;, resolved_at timestamptz);
        </code>
      </div>

      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
              {['種類', 'ドライバーID', 'メッセージ', '発行者', '日時', '解決日'].map((h) => (
                <th
                  key={h}
                  style={{ padding: '12px 14px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', fontWeight: 500 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {penalties.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  ペナルティ履歴がありません
                </td>
              </tr>
            ) : (
              penalties.map((p) => {
                const color = penaltyColors[p.type] ?? '#9ca3af'
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1e1e38' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: `${color}22`,
                          color,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {penaltyLabels[p.type] ?? p.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link
                        href={`/drivers/${p.driver_id}`}
                        style={{ color: '#f97316', textDecoration: 'none', fontSize: '12px', fontFamily: 'monospace' }}
                      >
                        {p.driver_id?.slice(0, 12)}...
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px', maxWidth: '300px' }}>
                      {p.message ?? '-'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px' }}>
                      {p.created_by ?? 'admin'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(p.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                      {p.resolved_at ? (
                        <span style={{ color: '#16a34a' }}>
                          {new Date(p.resolved_at).toLocaleDateString('ja-JP')}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>未解決</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
