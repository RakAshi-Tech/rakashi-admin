'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { freezeAccount, unfreezeAccount } from '@/app/actions/driver'

type Driver = {
  id: string
  name: string | null
  phone_number: string | null
  vehicle_type: string | null
  trust_score: number | null
  total_deliveries: number | null
  is_active: boolean | null
  created_at: string | null
  experience_years: number | null
}

function getTrustRank(score: number) {
  if (score >= 80) return { label: 'Leader', color: '#f97316' }
  if (score >= 60) return { label: 'Sub-Leader', color: '#3b82f6' }
  if (score >= 30) return { label: 'Standard', color: '#eab308' }
  return { label: 'New', color: '#ef4444' }
}

export default function DriversTable({ drivers }: { drivers: Driver[] }) {
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const score = d.trust_score ?? 0
      const rank = getTrustRank(score)

      if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false
      if (rankFilter !== 'all' && rank.label !== rankFilter) return false
      if (statusFilter === 'active' && !d.is_active) return false
      if (statusFilter === 'frozen' && d.is_active) return false
      return true
    })
  }, [drivers, search, rankFilter, statusFilter])

  const handleToggleFreeze = async (driver: Driver) => {
    setPendingId(driver.id)
    try {
      if (driver.is_active) {
        await freezeAccount(driver.id)
      } else {
        await unfreezeAccount(driver.id)
      }
    } finally {
      setPendingId(null)
    }
  }

  const filterBtnStyle = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid',
    borderColor: active ? '#f97316' : '#2a2a4a',
    background: active ? 'rgba(249,115,22,0.15)' : 'transparent',
    color: active ? '#f97316' : '#9ca3af',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="名前で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '7px 12px',
            background: '#1a1a2e',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            outline: 'none',
            width: '180px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'Leader', 'Sub-Leader', 'Standard', 'New'].map((r) => (
            <button key={r} onClick={() => setRankFilter(r)} style={filterBtnStyle(rankFilter === r)}>
              {r === 'all' ? '全員' : r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: '全ステータス' },
            { key: 'active', label: 'アクティブ' },
            { key: 'frozen', label: '凍結中' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={filterBtnStyle(statusFilter === key)}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: 'auto' }}>
          {filtered.length} / {drivers.length} 件
        </span>
      </div>

      {/* Table */}
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
              {['ドライバー', '電話番号', '車両', 'TrustScore', 'ランク', '配送数', 'ステータス', 'アクション'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 14px',
                      textAlign: 'left',
                      color: '#9ca3af',
                      fontSize: '12px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  ドライバーが見つかりません
                </td>
              </tr>
            ) : (
              filtered.map((driver) => {
                const score = driver.trust_score ?? 0
                const rank = getTrustRank(score)
                const loading = pendingId === driver.id

                return (
                  <tr key={driver.id} style={{ borderBottom: '1px solid #1e1e38' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: `${rank.color}33`,
                            color: rank.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {driver.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <Link
                          href={`/drivers/${driver.id}`}
                          style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {driver.name ?? 'N/A'}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '13px' }}>
                      {driver.phone_number ?? '-'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#9ca3af', fontSize: '13px' }}>
                      {driver.vehicle_type ?? '-'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: '#2a2a4a',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${score}%`,
                              height: '100%',
                              background: rank.color,
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '24px' }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: `${rank.color}22`,
                          color: rank.color,
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rank.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#ffffff', fontSize: '13px' }}>
                      {(driver.total_deliveries ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          background: driver.is_active ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                          color: driver.is_active ? '#16a34a' : '#dc2626',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {driver.is_active ? 'アクティブ' : '凍結中'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link
                          href={`/drivers/${driver.id}`}
                          style={{
                            padding: '5px 10px',
                            background: '#2a2a4a',
                            color: '#ffffff',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          詳細
                        </Link>
                        <button
                          onClick={() => handleToggleFreeze(driver)}
                          disabled={loading}
                          style={{
                            padding: '5px 10px',
                            background: driver.is_active ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)',
                            color: driver.is_active ? '#dc2626' : '#16a34a',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                            opacity: loading ? 0.6 : 1,
                          }}
                        >
                          {loading ? '...' : driver.is_active ? '凍結' : '解除'}
                        </button>
                      </div>
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
