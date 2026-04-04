import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import DriverActions from '@/components/DriverActions'
import DriverPhotoGallery from '@/components/DriverPhotoGallery'
import { DeliveryHistoryWithModal } from '@/app/components/DeliveryHistoryWithModal'

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
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
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

async function getShifts(driverId: string) {
  try {
    const { data } = await supabase
      .from('driver_shifts')
      .select('*')
      .eq('driver_id', driverId)
      .order('shift_date', { ascending: false })
      .limit(30)
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
  const [driver, deliveries, chartDeliveries, penalties, shifts] = await Promise.all([
    getDriver(id),
    getDeliveries(id),
    getRecentDeliveryChart(id),
    getPenalties(id),
    getShifts(id),
  ])

  if (!driver) notFound()

  const score = driver.trust_score ?? 0
  const rank = getTrustRank(score)
  const chartData = buildChartData(chartDeliveries)
  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  // Earnings calculations
  const totalEarnings = deliveries.reduce((sum: number, d: { earnings_inr?: number | null }) => sum + (d.earnings_inr ?? 0), 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthlyEarnings = deliveries
    .filter((d: { completed_at?: string | null }) => d.completed_at && new Date(d.completed_at) >= startOfMonth)
    .reduce((sum: number, d: { earnings_inr?: number | null }) => sum + (d.earnings_inr ?? 0), 0)

  // Photos
  const photosWithUrl = deliveries
    .filter((d: { photo_url?: string | null }) => d.photo_url)
    .map((d: { id: string; photo_url: string | null; completed_at: string | null }) => ({
      id: d.id,
      photo_url: d.photo_url,
      completed_at: d.completed_at,
    }))

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

      {/* Stats Row */}
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

      {/* Earnings Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, borderLeft: '3px solid #f97316' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>総収益</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f97316' }}>
            ₹{totalEarnings.toLocaleString()}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>全期間累計</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '3px solid #16a34a' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>今月の収益</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
            ₹{monthlyEarnings.toLocaleString()}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>今月累計</div>
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

      {/* Photo Gallery */}
      <DriverPhotoGallery photos={photosWithUrl} />

      {/* Shift History */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>稼働履歴（直近30件）</h2>
        {shifts.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>稼働履歴がありません</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
                  {['日付', '配送数', '収益', '距離 (km)', '稼働時間 (分)'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#9ca3af', fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((s: {
                  id: string
                  shift_date: string | null
                  total_deliveries?: number | null
                  total_earnings_inr?: number | null
                  total_distance_km?: number | null
                  total_duration_min?: number | null
                }) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1e1e38' }}>
                    <td style={{ padding: '8px 12px' }}>
                      {s.shift_date ? new Date(s.shift_date).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{s.total_deliveries ?? '-'}</td>
                    <td style={{ padding: '8px 12px', color: '#16a34a' }}>
                      {s.total_earnings_inr != null ? `₹${s.total_earnings_inr.toLocaleString()}` : '-'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {s.total_distance_km != null ? s.total_distance_km.toFixed(1) : '-'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>{s.total_duration_min ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Delivery History */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>配送履歴</h2>
          <DeliveryHistoryWithModal deliveries={deliveries} />
        </div>

        {/* Penalty History */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>ペナルティ履歴</h2>
          {penalties.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>ペナルティ履歴がありません</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {penalties.map((p: {
                id: string
                type: string
                created_at: string
                message?: string | null
              }) => {
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
