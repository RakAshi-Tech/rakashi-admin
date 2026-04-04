'use client'

import { useState } from 'react'
import { freezeAccount, unfreezeAccount, sendWarning, adjustScore } from '@/app/actions/driver'

type Driver = {
  id: string
  name: string | null
  is_active: boolean | null
  trust_score: number | null
}

export default function DriverActions({ driver }: { driver: Driver }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [warningModal, setWarningModal] = useState(false)
  const [scoreModal, setScoreModal] = useState(false)
  const [warningText, setWarningText] = useState('')
  const [newScore, setNewScore] = useState(driver.trust_score?.toString() ?? '50')

  const handle = async (action: string, fn: () => Promise<void>) => {
    setLoading(action)
    try {
      await fn()
    } finally {
      setLoading(null)
    }
  }

  const btnStyle = (color: string, bg: string): React.CSSProperties => ({
    padding: '9px 16px',
    background: bg,
    color: color,
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    opacity: loading ? 0.6 : 1,
    whiteSpace: 'nowrap',
  })

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {/* Freeze / Unfreeze */}
        {driver.is_active ? (
          <button
            disabled={!!loading}
            onClick={() => handle('freeze', () => freezeAccount(driver.id))}
            style={btnStyle('#dc2626', 'rgba(220,38,38,0.15)')}
          >
            {loading === 'freeze' ? '処理中...' : '🔒 アカウント凍結'}
          </button>
        ) : (
          <button
            disabled={!!loading}
            onClick={() => handle('unfreeze', () => unfreezeAccount(driver.id))}
            style={btnStyle('#16a34a', 'rgba(22,163,74,0.15)')}
          >
            {loading === 'unfreeze' ? '処理中...' : '🔓 凍結解除'}
          </button>
        )}

        {/* Warning */}
        <button
          disabled={!!loading}
          onClick={() => setWarningModal(true)}
          style={btnStyle('#d97706', 'rgba(217,119,6,0.15)')}
        >
          ⚠️ 警告送信
        </button>

        {/* Score Adjust */}
        <button
          disabled={!!loading}
          onClick={() => setScoreModal(true)}
          style={btnStyle('#3b82f6', 'rgba(59,130,246,0.15)')}
        >
          📊 スコア調整
        </button>
      </div>

      {/* Warning Modal */}
      {warningModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setWarningModal(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '28px',
              width: '440px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>⚠️ 警告送信 — {driver.name}</h3>
            <textarea
              value={warningText}
              onChange={(e) => setWarningText(e.target.value)}
              placeholder="警告メッセージを入力..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0f0f1a',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setWarningModal(false)}
                style={{ padding: '8px 16px', background: '#2a2a4a', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                disabled={!warningText.trim() || loading === 'warning'}
                onClick={async () => {
                  await handle('warning', () => sendWarning(driver.id, warningText))
                  setWarningModal(false)
                  setWarningText('')
                }}
                style={{
                  padding: '8px 16px',
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !warningText.trim() ? 'not-allowed' : 'pointer',
                  opacity: !warningText.trim() ? 0.5 : 1,
                }}
              >
                {loading === 'warning' ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setScoreModal(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              borderRadius: '12px',
              padding: '28px',
              width: '380px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>📊 TrustScore調整 — {driver.name}</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              現在のスコア: <strong style={{ color: '#ffffff' }}>{driver.trust_score ?? 0}</strong>
            </p>
            <div>
              <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                新しいスコア (0〜100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0f0f1a',
                  border: '1px solid #2a2a4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setScoreModal(false)}
                style={{ padding: '8px 16px', background: '#2a2a4a', color: '#9ca3af', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                disabled={loading === 'score'}
                onClick={async () => {
                  const score = parseInt(newScore)
                  if (isNaN(score)) return
                  await handle('score', () => adjustScore(driver.id, score))
                  setScoreModal(false)
                }}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {loading === 'score' ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
