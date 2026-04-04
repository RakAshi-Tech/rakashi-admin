import { supabase } from '@/lib/supabase'

async function getReportData() {
  try {
    const [{ data: drivers }, { data: deliveries }] = await Promise.all([
      supabase.from('driver_profiles').select('trust_score, is_active, vehicle_type, total_deliveries'),
      supabase
        .from('gps_delivery_summary')
        .select('started_at, completed_at, total_duration_min')
        .not('completed_at', 'is', null)
        .limit(500),
    ])

    const d = drivers ?? []
    const del = deliveries ?? []

    const rankDistribution = { Leader: 0, 'Sub-Leader': 0, Standard: 0, New: 0 }
    let totalScore = 0
    const vehicleCounts: Record<string, number> = {}

    for (const dr of d) {
      const score = dr.trust_score ?? 0
      totalScore += score
      if (score >= 80) rankDistribution['Leader']++
      else if (score >= 60) rankDistribution['Sub-Leader']++
      else if (score >= 30) rankDistribution['Standard']++
      else rankDistribution['New']++

      const vt = dr.vehicle_type ?? 'Unknown'
      vehicleCounts[vt] = (vehicleCounts[vt] ?? 0) + 1
    }

    const avgScore = d.length > 0 ? Math.round(totalScore / d.length) : 0
    const avgDuration =
      del.length > 0
        ? Math.round(del.reduce((s, x) => s + (x.total_duration_min ?? 0), 0) / del.length)
        : 0

    return {
      totalDrivers: d.length,
      activeDrivers: d.filter((x) => x.is_active).length,
      avgScore,
      totalDeliveries: del.length,
      avgDuration,
      rankDistribution,
      vehicleCounts,
    }
  } catch {
    return null
  }
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
        <span>{label}</span>
        <span style={{ color: '#9ca3af' }}>{value}</span>
      </div>
      <div style={{ height: '8px', background: '#2a2a4a', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  const data = await getReportData()

  const cardStyle: React.CSSProperties = {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '20px',
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Reports</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>統計レポート</p>
      </div>

      {!data ? (
        <p style={{ color: '#9ca3af' }}>データの取得に失敗しました</p>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[
              { label: '総ドライバー', value: data.totalDrivers, unit: '名', color: '#ffffff' },
              { label: 'アクティブ率', value: data.totalDrivers > 0 ? Math.round((data.activeDrivers / data.totalDrivers) * 100) : 0, unit: '%', color: '#16a34a' },
              { label: '平均TrustScore', value: data.avgScore, unit: 'pt', color: '#f97316' },
              { label: '配送完了数', value: data.totalDeliveries, unit: '件', color: '#3b82f6' },
              { label: '平均配送時間', value: data.avgDuration, unit: '分', color: '#eab308' },
            ].map(({ label, value, unit, color }) => (
              <div
                key={label}
                style={{ ...cardStyle, flex: 1, minWidth: '140px' }}
              >
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color }}>
                  {value.toLocaleString()}
                  <span style={{ fontSize: '14px', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Rank Distribution */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>ランク分布</h2>
              {Object.entries(data.rankDistribution).map(([rank, count]) => {
                const colors: Record<string, string> = {
                  Leader: '#f97316',
                  'Sub-Leader': '#3b82f6',
                  Standard: '#eab308',
                  New: '#ef4444',
                }
                return (
                  <Bar
                    key={rank}
                    label={rank}
                    value={count}
                    max={data.totalDrivers}
                    color={colors[rank] ?? '#9ca3af'}
                  />
                )
              })}
            </div>

            {/* Vehicle Distribution */}
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>車両タイプ分布</h2>
              {Object.entries(data.vehicleCounts).length === 0 ? (
                <p style={{ color: '#9ca3af' }}>データがありません</p>
              ) : (
                Object.entries(data.vehicleCounts).map(([type, count]) => (
                  <Bar
                    key={type}
                    label={type}
                    value={count}
                    max={data.totalDrivers}
                    color="#f97316"
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
