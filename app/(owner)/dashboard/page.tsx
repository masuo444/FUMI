import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { owner as O, tx } from '@/lib/i18n'
import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const [{ owner, supabase, service }, lang] = await Promise.all([requireOwner(), getLang()])
  const D = O.dashboard

  const { getAccessibleSalonIds } = await import('@/lib/salon-access')
  const accessibleIds = await getAccessibleSalonIds(service, owner.id)
  const filterIds = accessibleIds.length > 0 ? accessibleIds : ['none']

  const [{ data: wallet }, { data: posts }] = await Promise.all([
    supabase.from('owner_wallets').select('balance').eq('owner_id', owner.id).single(),
    service.from('posts')
      .select('id, salon_id, status, created_at, post_translations(language_code, title, status)')
      .in('salon_id', filterIds)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const balance = wallet?.balance ?? 0
  const salonIds = accessibleIds

  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .in('salon_id', salonIds.length > 0 ? salonIds : ['none'])

  const untranslatedCount = (posts ?? []).filter((p) => {
    const translations = (p.post_translations as any[]) ?? []
    return p.status === 'published' && translations.some(
      (t) => t.status === 'pending_insufficient_balance' || t.status === 'failed'
    )
  }).length

  const lowBalance = balance < 100

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{tx(D.title, lang)}</h1>

      {lowBalance && (
        <Alert variant="warning" className="mb-6">
          {tx(D.lowBalance, lang)}（{formatCurrency(balance)}）
          <Link href="/wallet" className="ml-2 underline font-medium">{tx(D.topUp, lang)}</Link>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label={tx(D.statBalance, lang)} value={formatCurrency(balance)} href="/wallet" color={lowBalance ? 'text-red-600' : 'text-gray-900'} />
        <StatCard label={tx(D.statMembers, lang)} value={`${memberCount ?? 0}`} href="/members" />
        <StatCard label={tx(D.statUntrans, lang)} value={`${untranslatedCount}`} href="/posts" color={untranslatedCount > 0 ? 'text-yellow-600' : 'text-gray-900'} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold">{tx(D.recentPosts, lang)}</h2>
          <Link href="/posts" className="text-sm text-gray-500 hover:text-gray-700">{tx(D.viewAll, lang)}</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(posts ?? []).length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">{tx(D.noPosts, lang)}</p>
          )}
          {(posts ?? []).map((post) => {
            const translations = (post.post_translations as any[]) ?? []
            const jaT = translations.find((t) => t.language_code === 'ja')
            const enT = translations.find((t) => t.language_code === 'en')
            const title = jaT?.title || enT?.title || '(無題)'
            return (
              <div key={post.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-gray-400">{formatDate(post.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={post.status === 'published' ? 'success' : 'muted'}>
                    {post.status === 'published' ? tx(D.published, lang) : tx(D.draft, lang)}
                  </Badge>
                  <TranslationBadge status={jaT?.status} lang="JA" />
                  <TranslationBadge status={enT?.status} lang="EN" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href, color = 'text-gray-900' }: { label: string; value: string; href: string; color?: string }) {
  return (
    <Link href={href} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </Link>
  )
}

function TranslationBadge({ status, lang }: { status?: string; lang: string }) {
  if (!status) return <Badge variant="muted">{lang} -</Badge>
  if (status === 'completed') return <Badge variant="success">{lang} ✓</Badge>
  if (status === 'pending_insufficient_balance') return <Badge variant="warning">{lang} 未</Badge>
  return <Badge variant="danger">{lang} ✗</Badge>
}
