'use client'

import { useState } from 'react'

type PhotoItem = {
  id: string
  photo_url: string | null
  completed_at: string | null
}

export default function DriverPhotoGallery({ photos }: { photos: PhotoItem[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  return (
    <>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '14px', color: '#ffffff', marginBottom: '12px', margin: '0 0 12px' }}>
          📷 配送写真（{photos.length}件）
        </h3>

        {photos.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            写真はまだありません
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {photos.map((delivery) => (
              <div key={delivery.id} style={{ position: 'relative' }}>
                <img
                  src={delivery.photo_url!}
                  alt="delivery"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                  onClick={() => setSelectedPhoto(delivery.photo_url)}
                />
                <p style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  textAlign: 'center',
                  marginBottom: 0,
                }}>
                  {delivery.completed_at
                    ? new Date(delivery.completed_at).toLocaleDateString('ja-JP')
                    : '-'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
          }}
        >
          <img
            src={selectedPhoto}
            alt="delivery full"
            style={{
              maxWidth: '90%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
          <button
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕ 閉じる
          </button>
        </div>
      )}
    </>
  )
}
