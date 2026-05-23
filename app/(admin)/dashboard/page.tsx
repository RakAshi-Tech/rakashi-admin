import { supabase } from '@/lib/supabase'

async function getDashboardStats() {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
      { count: totalDrivers },
      { count: activeDrivers },
      { count: frozenDrivers },
      { count: monthlyDeliveries },
      { data: earningsData },
    ] = await Promise.all([
      supabase.from('driver_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('driver_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('driver_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
      supabase
        .from('gps_delivery_summary')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', startOfMonth.toISOString())
        .not('completed_at', 'is', null),
      supabase
        .from('gps_delivery_summary')
        .select('earnings_inr')
        .gte('completed_at', startOfMonth.toISOString())
        .not('completed_at', 'is', null),
    ])

    const monthlyEarnings = (earningsData ?? []).reduce(
      (sum: number, row: { earnings_inr?: number | null }) => sum + (row.earnings_inr ?? 0),
      0
    )

    return {
      totalDrivers: totalDrivers ?? 0,
      activeDrivers: activeDrivers ?? 0,
      frozenDrivers: frozenDrivers ?? 0,
      monthlyDeliveries: monthlyDeliveries ?? 0,
      monthlyEarnings,
    }
  } catch {
    return { totalDrivers: 0, activeDrivers: 0, frozenDrivers: 0, monthlyDeliveries: 0, monthlyEarnings: 0 }
  }
}

async function getRecentDrivers() {
  try {
    const { data } = await supabase
      .from('driver_profiles')
      .select('id, name, trust_score, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    return data ?? []
  } catch {
    return []
  }
}

function StatCard({
  title,
  value,
  icon,
  color,
  sub,
}: {
  title: string
  value: number | string
  icon: string
  color: string
  sub?: string
}) {
  return (
    <div
      style={{
        background: '#1a1a2e',
        border: '1px solid #2a2a4a',
        borderRadius: '12px',
        padding: '20px',
        flex: 1,
        minWidth: '180px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{title}</span>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color, marginBottom: '4px' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div style={{ color: '#9ca3af', fontSize: '12px' }}>{sub}</div>}
    </div>
  )
}

function getTrustRank(score: number) {
  if (score >= 80) return { label: 'Leader', color: '#f97316' }
  if (score >= 60) return { label: 'Sub-Leader', color: '#3b82f6' }
  if (score >= 30) return { label: 'Standard', color: '#eab308' }
  return { label: 'New', color: '#ef4444' }
}

export default async function DashboardPage() {
  const [stats, recentDrivers] = await Promise.all([getDashboardStats(), getRecentDrivers()])
  const { monthlyEarnings } = stats

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>RakAshi ドライバー管理の概要</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard title="総ドライバー数" value={stats.totalDrivers} icon="👥" color="#ffffff" />
        <StatCard title="アクティブ" value={stats.activeDrivers} icon="✅" color="#16a34a" sub="稼働中" />
        <StatCard title="凍結中" value={stats.frozenDrivers} icon="🔒" color="#dc2626" sub="要対応" />
        <StatCard title="今月の配送数" value={stats.monthlyDeliveries} icon="📦" color="#f97316" sub="今月累計" />
        <StatCard title="今月の収益合計" value={`₹${monthlyEarnings.toLocaleString()}`} icon="💰" color="#16a34a" sub="今月累計" />
      </div>

      {/* Recent Drivers */}
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>最近登録されたドライバー</h2>
          <a href="/drivers" style={{ color: '#f97316', textDecoration: 'none', fontSize: '13px' }}>
            すべて見る →
          </a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
              {['名前', 'TrustScore', 'ランク', 'ステータス', '登録日'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentDrivers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  データがありません
                </td>
              </tr>
            ) : (
              recentDrivers.map((driver: any) => {
                const rank = getTrustRank(driver.trust_score ?? 0)
                return (
                  <tr key={driver.id} style={{ borderBottom: '1px solid #1e1e38' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#2a2a4a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            flexShrink: 0,
                          }}
                        >
                          {driver.name?.[0] ?? '?'}
                        </div>
                        <a
                          href={`/drivers/${driver.id}`}
                          style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {driver.name ?? 'N/A'}
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: '#2a2a4a',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            maxWidth: '80px',
                          }}
                        >
                          <div
                            style={{
                              width: `${driver.trust_score ?? 0}%`,
                              height: '100%',
                              background: rank.color,
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{driver.trust_score ?? 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: `${rank.color}22`,
                          color: rank.color,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {rank.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: driver.is_active ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                          color: driver.is_active ? '#16a34a' : '#dc2626',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {driver.is_active ? 'アクティブ' : '凍結中'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '12px' }}>
                      {driver.created_at ? new Date(driver.created_at).toLocaleDateString('ja-JP') : '-'}
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
