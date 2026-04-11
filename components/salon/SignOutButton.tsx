'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      ログアウト
    </button>
  )
}
