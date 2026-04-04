import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import DriverActions from '@/components/DriverActions'

type Params = { id: string }

async function getDriver(id: string) {
  try {
    const { data } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('id', id)
      .single()
    return data
  } catch {
    return null
  }
}

async function getDeliveries(driverId: string) {
  try {
    const { data } = await supabase
      .from('gps_delivery_summary')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

async function getRecentDeliveryChart(driverId: string) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data } = await supabase
      .from('gps_delivery_summary')
      .select('started_at, completed_at')
      .eq('driver_id', driverId)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

async function getPenalties(driverId: string) {
  try {
    const { data } = await supabase
      .from('penalties')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(10)
    return data ?? []
  } catch {
    return []
  }
}

function getTrustRank(score: number) {
  if (score >= 80) return { label: 'Leader', color: '#f97316' }
  if (score >= 60) return { label: 'Sub-Leader', color: '#3b82f6' }
  if (score >= 30) return { label: 'Standard', color: '#eab308' }
  return { label: 'New', color: '#ef4444' }
}

function buildChartData(deliveries: { started_at: string | null }[]) {
  const counts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    counts[key] = 0
  }
  for (const d of deliveries) {
    if (!d.started_at) continue
    const key = d.started_at.slice(0, 10)
    if (key in counts) counts[key]++
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
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

export default async function DriverDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const [driver, deliveries, chartDeliveries, penalties] = await Promise.all([
    getDriver(id),
    getDeliveries(id),
    getRecentDeliveryChart(id),
    getPenalties(id),
  ])

  if (!driver) notFound()

  const score = driver.trust_score ?? 0
  const rank = getTrustRank(score)
  const chartData = buildChartData(chartDeliveries)
  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  const cardStyle: React.CSSProperties = {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '20px',
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/drivers" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px' }}>
          ← ドライバー一覧
        </Link>
      </div>

      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: `${rank.color}33`,
                color: rank.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {driver.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{driver.name ?? 'N/A'}</h1>
              <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '13px' }}>
                {driver.phone_number ?? '-'} · {driver.vehicle_type ?? '-'}
              </p>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: `${rank.color}22`,
                    color: rank.color,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {rank.label}
                </span>
                <span
                  style={{
                    background: driver.is_active ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                    color: driver.is_active ? '#16a34a' : '#dc2626',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {driver.is_active ? 'アクティブ' : '凍結中'}
                </span>
              </div>
            </div>
          </div>
          <DriverActions driver={{ id: driver.id, name: driver.name, is_active: driver.is_active, trust_score: driver.trust_score }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* TrustScore */}
        <div style={cardStyle}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>TrustScore</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: rank.color, marginBottom: '10px' }}>{score}</div>
          <div style={{ height: '8px', background: '#2a2a4a', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: rank.color, borderRadius: '4px' }} />
          </div>
        </div>

        {/* Stats */}
        <div style={cardStyle}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>総配送数</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{(driver.total_deliveries ?? 0).toLocaleString()}</div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>経験年数: {driver.experience_years ?? '-'} 年</div>
        </div>

        {/* Info */}
        <div style={cardStyle}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>プロフィール</div>
          {[
            { label: '登録日', value: driver.created_at ? new Date(driver.created_at).toLocaleDateString('ja-JP') : '-' },
            { label: 'ID', value: driver.id.slice(0, 8) + '...' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{label}</span>
              <span style={{ fontSize: '12px' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Chart */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>配送実績（直近30日）</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
          {chartData.map(({ date, count }) => (
            <div
              key={date}
              title={`${date}: ${count}件`}
              style={{
                flex: 1,
                background: count > 0 ? '#f97316' : '#2a2a4a',
                height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                minHeight: count > 0 ? '4px' : '2px',
                borderRadius: '2px 2px 0 0',
                opacity: count > 0 ? 1 : 0.4,
                transition: 'opacity 0.2s',
                cursor: 'default',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>30日前</span>
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>今日</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Delivery History */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>配送履歴</h2>
          {deliveries.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>配送履歴がありません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '10px 12px',
                    background: '#0f0f1a',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>Job: {d.job_id ?? '-'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      {d.started_at ? new Date(d.started_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {d.completed_at ? (
                      <span style={{ color: '#16a34a', fontSize: '11px' }}>✅ 完了</span>
                    ) : (
                      <span style={{ color: '#d97706', fontSize: '11px' }}>⏳ 進行中</span>
                    )}
                    {d.total_duration_min != null && (
                      <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                        {d.total_duration_min}分
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Penalty History */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>ペナルティ履歴</h2>
          {penalties.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>ペナルティ履歴がありません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {penalties.map((p) => {
                const color = penaltyColors[p.type] ?? '#9ca3af'
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '10px 12px',
                      background: '#0f0f1a',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span
                        style={{
                          color,
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${color}22`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {penaltyLabels[p.type] ?? p.type}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                        {new Date(p.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {p.message && (
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{p.message}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
