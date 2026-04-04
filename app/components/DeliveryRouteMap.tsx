'use client'
import { useEffect, useRef } from 'react'

interface Props {
  routeCoordinates: [number, number][] | null
  trackPoints: { lat: number; lng: number }[]
  startLat?: number
  startLng?: number
  destLat?: number
  destLng?: number
}

export const DeliveryRouteMap = ({
  routeCoordinates,
  trackPoints,
  startLat,
  startLng,
  destLat,
  destLng,
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Leaflet icon修正
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // 地図の中心を決定
      const centerLat = startLat ?? trackPoints[0]?.lat ?? 35.6762
      const centerLng = startLng ?? trackPoints[0]?.lng ?? 139.6503

      const map = L.map(mapRef.current!, {
        center: [centerLat, centerLng],
        zoom: 14,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
      })

      mapInstanceRef.current = map

      // タイルレイヤー
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap' }
      ).addTo(map)

      // 予定ルート（オレンジ線）
      if (routeCoordinates && routeCoordinates.length > 0) {
        L.polyline(routeCoordinates, {
          color: '#f97316',
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 4',
        }).addTo(map)
      }

      // 実際の走行軌跡（青線）
      if (trackPoints.length > 0) {
        const trackLatLngs = trackPoints.map(p => [p.lat, p.lng] as [number, number])
        L.polyline(trackLatLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.9,
        }).addTo(map)

        // 出発地マーカー（青）
        const startIcon = L.divIcon({
          html: `<div style="
            width: 14px;
            height: 14px;
            background: #3b82f6;
            border: 2px solid #fff;
            border-radius: 50%;
          "></div>`,
          iconSize: [14, 14],
          className: '',
        })
        L.marker(
          [trackPoints[0].lat, trackPoints[0].lng],
          { icon: startIcon }
        )
          .addTo(map)
          .bindPopup('出発地')
      }

      // 目的地マーカー（赤）
      if (destLat && destLng) {
        const destIcon = L.divIcon({
          html: `<div style="
            width: 16px;
            height: 16px;
            background: #ef4444;
            border: 2px solid #fff;
            border-radius: 50%;
          "></div>`,
          iconSize: [16, 16],
          className: '',
        })
        L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup('目的地')
      }

      // 全ポイントが見えるようにズーム調整
      const allPoints: [number, number][] = []
      if (trackPoints.length > 0) {
        trackPoints.forEach(p => allPoints.push([p.lat, p.lng]))
      }
      if (routeCoordinates && routeCoordinates.length > 0) {
        routeCoordinates.forEach(p => allPoints.push(p))
      }
      if (allPoints.length > 1) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] })
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '300px',
        borderRadius: '12px',
        overflow: 'hidden',
        zIndex: 0,
      }}
    />
  )
}
