'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function freezeAccount(driverId: string) {
  try {
    await supabase
      .from('driver_profiles')
      .update({ is_active: false })
      .eq('id', driverId)

    await supabase.from('penalties').insert({
      driver_id: driverId,
      type: 'account_freeze',
      message: 'アカウントを凍結しました',
    })

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${driverId}`)
  } catch (error) {
    console.error('freezeAccount error:', error)
    throw error
  }
}

export async function unfreezeAccount(driverId: string) {
  try {
    await supabase
      .from('driver_profiles')
      .update({ is_active: true })
      .eq('id', driverId)

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${driverId}`)
  } catch (error) {
    console.error('unfreezeAccount error:', error)
    throw error
  }
}

export async function sendWarning(driverId: string, message: string) {
  try {
    await supabase.from('penalties').insert({
      driver_id: driverId,
      type: 'warning',
      message: message,
    })

    revalidatePath(`/drivers/${driverId}`)
    revalidatePath('/penalties')
  } catch (error) {
    console.error('sendWarning error:', error)
    throw error
  }
}

export async function adjustScore(driverId: string, newScore: number) {
  const clamped = Math.min(Math.max(newScore, 0), 100)
  try {
    await supabase
      .from('driver_profiles')
      .update({ trust_score: clamped })
      .eq('id', driverId)

    await supabase.from('penalties').insert({
      driver_id: driverId,
      type: 'score_adjust',
      message: `TrustScoreを${clamped}に調整`,
    })

    revalidatePath('/drivers')
    revalidatePath(`/drivers/${driverId}`)
  } catch (error) {
    console.error('adjustScore error:', error)
    throw error
  }
}
