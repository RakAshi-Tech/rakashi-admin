'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

const DeliveryRouteMap = dynamic(
  () => import('./DeliveryRouteMap').then(m => ({ default: m.DeliveryRouteMap })),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%',
        height: '300px',
        background: '#1a1a2e',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
      }}>
        地図を読み込み中...
      </div>
    ),
  }
)

interface Delivery {
  id: string
  driver_id: string
  started_at: string
  completed_at: string
  total_distance_km: number
  total_duration_min: number
  earnings_inr: number
  on_time: boolean
  photo_url: string | null
  route_coordinates: [number, number][] | null
  start_lat: number | null
}

interface Props {
  delivery: Delivery
  onClose: () => void
}

export const DeliveryDetailModal = ({ delivery, onClose }: Props) => {
  const [trackPoints, setTrackPoints] = useState<{ lat: number; lng: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(false)

  useEffect(() => {
    const fetchTrackPoints = async () => {
      try {
        const { data } = await supabase
          .from('gps_track_points')
          .select('lat, lng, recorded_at')
          .eq('delivery_id', delivery.id)
          .order('recorded_at', { ascending: true })

        setTrackPoints(data ?? [])
      } catch (err) {
        console.error('trackPoints fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrackPoints()
  }, [delivery.id])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#12122a',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#ffffff',
              margin: 0,
            }}>
              配送詳細
            </h2>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '4px 0 0',
            }}>
              {formatDate(delivery.started_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#374151',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ✕ 閉じる
          </button>
        </div>

        {/* 地図 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '8px',
            fontSize: '12px',
          }}>
            <span style={{ color: '#3b82f6' }}>━━ 実際の走行軌跡</span>
            <span style={{ color: '#f97316' }}>╌╌ 予定ルート</span>
          </div>
          {loading ? (
            <div style={{
              width: '100%',
              height: '300px',
              background: '#1a1a2e',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}>
              データを読み込み中...
            </div>
          ) : (
            <DeliveryRouteMap
              routeCoordinates={delivery.route_coordinates}
              trackPoints={trackPoints}
              startLat={delivery.start_lat ?? undefined}
            />
          )}
        </div>

        {/* 配送情報カード */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {[
            {
              label: '走行距離',
              value: `${(delivery.total_distance_km || 0).toFixed(1)} km`,
              color: '#ffffff',
            },
            {
              label: '所要時間',
              value: `${delivery.total_duration_min || 0} 分`,
              color: '#ffffff',
            },
            {
              label: '収益',
              value: `₹${(delivery.earnings_inr || 0).toLocaleString()}`,
              color: '#16a34a',
            },
            {
              label: '時間厳守',
              value: delivery.on_time ? '✅ オンタイム' : '❌ 遅延',
              color: delivery.on_time ? '#16a34a' : '#dc2626',
            },
          ].map(item => (
            <div key={item.label} style={{
              background: '#1a1a2e',
              borderRadius: '10px',
              padding: '12px',
            }}>
              <p style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginBottom: '4px',
                margin: '0 0 4px',
              }}>
                {item.label}
              </p>
              <p style={{
                fontSize: '18px',
                fontWeight: 500,
                color: item.color,
                margin: 0,
              }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* 配送写真 */}
        {delivery.photo_url && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '8px',
              margin: '0 0 8px',
            }}>
              📷 配送完了写真
            </p>
            <img
              src={delivery.photo_url}
              alt="delivery"
              onClick={() => setSelectedPhoto(true)}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* 写真拡大 */}
        {selectedPhoto && delivery.photo_url && (
          <div
            onClick={() => setSelectedPhoto(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              cursor: 'pointer',
            }}
          >
            <img
              src={delivery.photo_url}
              alt="delivery full"
              style={{
                maxWidth: '95%',
                maxHeight: '95vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        {/* GPS軌跡ポイント数 */}
        <p style={{
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          margin: 0,
        }}>
          GPS記録ポイント数：{trackPoints.length}件
        </p>
      </div>
    </div>
  )
}
