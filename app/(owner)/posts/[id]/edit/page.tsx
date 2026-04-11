import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { notFound } from 'next/navigation'
import { PostForm } from '@/components/owner/PostForm'
import { TranslationGateBanner } from '@/components/owner/TranslationGateBanner'
import Link from 'next/link'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ owner, service, supabase }, lang] = await Promise.all([requireOwner(), getLang()])

  const { getAccessibleSalonIds, canAccessSalon } = await import('@/lib/salon-access')
  const accessibleIds = await getAccessibleSalonIds(service, owner.id)

  // 記事取得（owner_id ではなくアクセス可能な salon_id で判定）
  const { data: post } = await service
    .from('posts')
    .select('*, post_translations(*)')
    .eq('id', id)
    .single()

  // アクセス権チェック（記事が自分のアクセス可能なサロンに属しているか）
  const hasAccess = post && (
    post.owner_id === owner.id ||
    await canAccessSalon(service, owner.id, post.salon_id)
  )

  const [salonsResult, { data: wallet }, { data: ownerData }] = await Promise.all([
    accessibleIds.length > 0
      ? service.from('salons').select('id, name').in('id', accessibleIds).order('created_at')
      : Promise.resolve({ data: [] }),
    supabase.from('owner_wallets').select('balance').eq('owner_id', owner.id).single(),
    service.from('owners').select('plan').eq('id', owner.id).single(),
  ])
  const salons = salonsResult.data ?? []
  const isPro = ownerData?.plan === 'pro'

  if (!post || !hasAccess) notFound()

  const translations = (post.post_translations as any[]) ?? []
  const origTranslation = translations.find((t) => t.language_code === post.original_language)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/posts" className="hover:text-gray-700">記事一覧</Link>
        <span>/</span>
        <span className="text-gray-900">編集</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">記事を編集</h1>
      <TranslationGateBanner isPro={isPro} lang={lang} />
      <PostForm
        postId={id}
        initialData={{
          salon_id: post.salon_id,
          title: origTranslation?.title ?? '',
          body: origTranslation?.body ?? '',
          original_language: post.original_language,
          cover_image_url: post.cover_image_url ?? undefined,
          status: post.status,
          send_notification: post.send_notification,
        }}
        salons={salons}
        currentBalance={wallet?.balance ?? 0}
      />
    </div>
  )
}
