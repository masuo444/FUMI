export const dynamic = 'force-dynamic'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LogoutButton } from '@/components/owner/LogoutButton'
import { SalonSelector } from '@/components/owner/SalonSelector'
import { OwnerNav } from '@/components/owner/OwnerNav'
import { LanguageToggle } from '@/components/LanguageToggle'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if owner record exists; if not, create one.
  // Must use service client for INSERT — the RLS policy on owners is self-referential
  // and blocks inserts when no owner row exists yet (first login).
  const service = await createServiceClient()
  const { data: owner } = await service
    .from('owners')
    .select('id, plan, created_at')
    .eq('email', user.email!)
    .single()

  if (!owner) {
    await service.from('owners').insert({
      email: user.email!,
      name: user.email!.split('@')[0],
    })
  }

  // 招待コード（salon_admin_invites）がある場合は自動承認
  const currentOwner = owner ?? (
    await service.from('owners').select('id, plan, created_at').eq('email', user.email!).single()
  ).data
  if (currentOwner) {
    const { data: invites } = await service
      .from('salon_admin_invites')
      .select('salon_id')
      .eq('email', user.email!)
    if (invites && invites.length > 0) {
      await Promise.all(
        invites.map((inv: any) =>
          service.from('salon_admins').upsert(
            { salon_id: inv.salon_id, owner_id: currentOwner.id },
            { onConflict: 'salon_id,owner_id' },
          )
        )
      )
      await service.from('salon_admin_invites').delete().eq('email', user.email!)
    }
  }

  const isAdmin = isAdminEmail(user.email!)
  const lang = await getLang()

  // Trial / plan gate — admins bypass
  if (currentOwner && !isAdmin) {
    const isPro = currentOwner.plan === 'pro'
    const trialEnd = new Date(new Date(currentOwner.created_at).getTime() + 5 * 24 * 60 * 60 * 1000)
    const inTrial = new Date() < trialEnd
    if (!isPro && !inTrial) {
      redirect('/billing')
    }
  }

  // 初回ログイン検知 — サロン未作成のオーナーを /welcome へ
  // /welcome 自体はこのチェックをスキップ（無限ループ防止のため welcome ページ側で制御）
  if (currentOwner && !isAdmin) {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const pathname = headersList.get('x-invoke-path') ?? ''
    const isWelcome = pathname.startsWith('/welcome')
    if (!isWelcome) {
      const { count } = await service
        .from('salons')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', currentOwner.id)
      if ((count ?? 0) === 0) {
        redirect('/welcome')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-0.5">
            <h1 className="text-base font-bold text-gray-900">Fumi</h1>
            <LanguageToggle lang={lang} />
          </div>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        {/* useSearchParams を使うため Suspense でラップ */}
        <Suspense fallback={<div className="px-3 py-2 border-b border-gray-200 text-xs text-gray-400">Loading…</div>}>
          <SalonSelector />
        </Suspense>
        <Suspense fallback={<div className="flex-1" />}>
          <OwnerNav isAdmin={isAdmin} lang={lang} />
        </Suspense>
        <div className="px-4 py-4 border-t border-gray-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}

