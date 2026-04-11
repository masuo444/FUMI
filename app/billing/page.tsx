import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from './BillingClient'

export default async function BillingPage() {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-bold">Fumi</span>
          <span className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</span>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
          <BillingClient />
        </Suspense>
      </div>
    </div>
  )
}
