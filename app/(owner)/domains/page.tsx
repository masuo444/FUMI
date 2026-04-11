import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DomainsClient } from '@/components/owner/DomainsClient'

export default async function DomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: owner } = await supabase.from('owners').select('id').eq('email', user.email!).single()
  if (!owner) redirect('/login')

  const { data: domains } = await supabase
    .from('owner_sender_domains')
    .select('*, owner_sender_addresses(*)')
    .eq('owner_id', owner.id)
    .order('created_at')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">送信元ドメイン設定</h1>
      <p className="text-sm text-gray-500 mb-6">
        会員への通知メールを独自ドメインから送信するための設定です。
        未設定の場合は共通ドメインから送信されます。
      </p>
      <DomainsClient initialDomains={domains ?? []} />
    </div>
  )
}
