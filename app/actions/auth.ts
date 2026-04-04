'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type AuthState = { error: string } | null

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const id = formData.get('id') as string
  const password = formData.get('password') as string

  if (id === 'admin' && password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    redirect('/dashboard')
  }

  return { error: 'IDまたはパスワードが間違っています' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  redirect('/')
}
