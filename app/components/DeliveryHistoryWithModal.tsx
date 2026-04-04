'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const DeliveryDetailModal = dynamic(
  () => import('./DeliveryDetailModal').then(m => ({ default: m.DeliveryDetailModal })),
  { ssr: false }
)

interface DeliveryRow {
  id: string
  driver_id: string
  started_at: string | null
  completed_at: string | null
  total_distance_km: number | null
  total_duration_min: number | null
  earnings_inr: number | null
  on_time: boolean | null
  photo_url: string | null
  route_coordinates: [number, number][] | null
  start_lat: number | null
  job_id?: string | null
}

interface Props {
  deliveries: DeliveryRow[]
}

export const DeliveryHistoryWithModal = ({ deliveries }: Props) => {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRow | null>(null)

  if (deliveries.length === 0) {
    return (
      <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
        配送履歴がありません
      </p>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {deliveries.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelectedDelivery(d)}
            style={{
              padding: '10px 12px',
              background: '#0f0f1a',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = '#1f2937'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = '#0f0f1a'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>
                  Job: {d.job_id ?? '-'}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {d.completed_at
                    ? new Date(d.completed_at).toLocaleString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#16a34a', fontSize: '11px' }}>✅ 完了</span>
                {d.total_duration_min != null && (
                  <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                    {d.total_duration_min}分
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 600 }}>
                {d.earnings_inr != null ? `₹${d.earnings_inr.toLocaleString()}` : '-'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {d.photo_url && (
                  <img
                    src={d.photo_url}
                    alt="delivery"
                    style={{
                      width: '36px',
                      height: '36px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <span style={{ fontSize: '10px', color: '#4b5563' }}>詳細 →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedDelivery && selectedDelivery.started_at && selectedDelivery.completed_at && (
        <DeliveryDetailModal
          delivery={{
            id: selectedDelivery.id,
            driver_id: selectedDelivery.driver_id,
            started_at: selectedDelivery.started_at,
            completed_at: selectedDelivery.completed_at,
            total_distance_km: selectedDelivery.total_distance_km ?? 0,
            total_duration_min: selectedDelivery.total_duration_min ?? 0,
            earnings_inr: selectedDelivery.earnings_inr ?? 0,
            on_time: selectedDelivery.on_time ?? false,
            photo_url: selectedDelivery.photo_url,
            route_coordinates: selectedDelivery.route_coordinates,
            start_lat: selectedDelivery.start_lat,
          }}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </>
  )
}
