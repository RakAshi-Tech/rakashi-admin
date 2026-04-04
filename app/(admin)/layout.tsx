import Sidebar from '@/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
