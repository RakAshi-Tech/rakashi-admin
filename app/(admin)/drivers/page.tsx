import { supabase } from '@/lib/supabase'
import DriversTable from '@/components/DriversTable'

async function getDrivers() {
  try {
    const { data } = await supabase
      .from('driver_profiles')
      .select(`
        id,
        name,
        phone_number,
        vehicle_type,
        trust_score,
        total_deliveries,
        is_active,
        created_at,
        experience_years
      `)
      .order('trust_score', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}

export default async function DriversPage() {
  const drivers = await getDrivers()

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>Drivers</h1>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '13px' }}>
            登録ドライバー一覧（{drivers.length}名）
          </p>
        </div>
      </div>

      <DriversTable drivers={drivers} />
    </div>
  )
}
