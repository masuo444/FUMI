import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { PostForm } from '@/components/owner/PostForm'
import { TranslationGateBanner } from '@/components/owner/TranslationGateBanner'
import Link from 'next/link'

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>
}) {
  const { salon: defaultSalonId } = await searchParams
  const [{ owner, service, supabase }, lang] = await Promise.all([requireOwner(), getLang()])

  const { getAccessibleSalonIds } = await import('@/lib/salon-access')
  const accessibleIds = await getAccessibleSalonIds(service, owner.id)

  const [salonsResult, { data: wallet }, { data: ownerData }] = await Promise.all([
    accessibleIds.length > 0
      ? service.from('salons').select('id, name').in('id', accessibleIds).order('created_at')
      : Promise.resolve({ data: [] }),
    supabase.from('owner_wallets').select('balance').eq('owner_id', owner.id).single(),
    service.from('owners').select('plan').eq('id', owner.id).single(),
  ])
  const salons = salonsResult.data ?? []
  const isPro = ownerData?.plan === 'pro'

  if (salons.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">記事を書くにはまずサロンを作成してください</p>
        <p className="text-sm text-gray-400">サイドバーの「+ サロンを追加」から作成できます</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/posts" className="hover:text-gray-700">記事一覧</Link>
        <span>/</span>
        <span className="text-gray-900">新しい記事</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">記事を書く</h1>
      <TranslationGateBanner isPro={isPro} lang={lang} />
      <PostForm
        salons={salons}
        defaultSalonId={defaultSalonId ?? salons[0].id}
        currentBalance={wallet?.balance ?? 0}
      />
    </div>
  )
}
