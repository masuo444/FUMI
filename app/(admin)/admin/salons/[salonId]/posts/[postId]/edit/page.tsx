import { requireAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { PostForm } from '@/components/owner/PostForm'
import Link from 'next/link'

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ salonId: string; postId: string }>
}) {
  const { salonId, postId } = await params
  const { service } = await requireAdmin()

  const [{ data: post }, { data: salon }, { data: owner }] = await Promise.all([
    service
      .from('posts')
      .select('*, post_translations(*)')
      .eq('id', postId)
      .eq('salon_id', salonId)
      .single(),
    service.from('salons').select('id, name, owner_id').eq('id', salonId).single(),
    Promise.resolve({ data: null as null }),
  ])

  if (!post || !salon) notFound()

  // Get owner wallet for the balance indicator
  const { data: wallet } = await service
    .from('owner_wallets')
    .select('balance')
    .eq('owner_id', salon.owner_id)
    .single()

  const translations = (post.post_translations as any[]) ?? []
  const origTranslation = translations.find((t) => t.language_code === post.original_language)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-700">管理者</Link>
        <span>/</span>
        <Link href={`/admin/salons/${salonId}`} className="hover:text-gray-700">{salon.name}</Link>
        <span>/</span>
        <span className="text-gray-900">記事編集</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">記事を編集（管理者）</h1>
      <p className="text-sm text-gray-400 mb-6">サロン: {salon.name}</p>
      <PostForm
        postId={postId}
        initialData={{
          salon_id: salonId,
          title: origTranslation?.title ?? '',
          body: origTranslation?.body ?? '',
          original_language: post.original_language,
          cover_image_url: post.cover_image_url ?? undefined,
          status: post.status,
          send_notification: post.send_notification,
        }}
        salons={[{ id: salonId, name: salon.name }]}
        currentBalance={wallet?.balance ?? 0}
      />
    </div>
  )
}
