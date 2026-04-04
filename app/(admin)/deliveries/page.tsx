import { supabase } from '@/lib/supabase'

async function getDeliveries() {
  try {
    const { data } = await supabase
      .from('gps_delivery_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries()

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Deliveries</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>
          配送履歴（最新{deliveries.length}件）
        </p>
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
              {['Job ID', 'ドライバーID', '開始時刻', '完了時刻', '所要時間', 'ステータス'].map((h) => (
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
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  配送データがありません
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #1e1e38' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#f97316' }}>
                    {d.job_id ?? '-'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {d.driver_id?.slice(0, 10)}...
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {d.started_at
                      ? new Date(d.started_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {d.completed_at
                      ? new Date(d.completed_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#ffffff' }}>
                    {d.total_duration_min != null ? `${d.total_duration_min}分` : '-'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {d.completed_at ? (
                      <span
                        style={{
                          background: 'rgba(22,163,74,0.15)',
                          color: '#16a34a',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                        }}
                      >
                        完了
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(217,119,6,0.15)',
                          color: '#d97706',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                        }}
                      >
                        進行中
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
