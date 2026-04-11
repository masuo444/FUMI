import { requireOwner } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RetranslateButton } from '@/components/owner/RetranslateButton'
import { formatDate } from '@/lib/utils'
import { TranslationStatus } from '@/types'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>
}) {
  const { salon: salonId } = await searchParams
  const { owner, service } = await requireOwner()

  // アクセス可能なサロン（オーナー + 共同管理者）で絞り込む
  const { getAccessibleSalonIds } = await import('@/lib/salon-access')
  const accessibleIds = await getAccessibleSalonIds(service, owner.id)
  const filterIds = salonId ? [salonId] : accessibleIds

  let query = service
    .from('posts')
    .select(`
      id, salon_id, status, original_language, cover_image_url, published_at, created_at,
      post_translations(language_code, title, status),
      salons(name)
    `)
    .order('created_at', { ascending: false })

  if (filterIds.length > 0) {
    query = query.in('salon_id', filterIds)
  } else {
    query = query.in('salon_id', ['none'])
  }

  const { data: posts } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link href={`/posts/new${salonId ? `?salon=${salonId}` : ''}`}>
          <Button>+ New post</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {(posts ?? []).length === 0 && (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            No posts yet.{' '}
            <Link href={`/posts/new${salonId ? `?salon=${salonId}` : ''}`} className="underline">
              Write your first post
            </Link>
          </p>
        )}
        {(posts ?? []).map((post) => {
          const translations = (post.post_translations as any[]) ?? []
          const jaT = translations.find((t) => t.language_code === 'ja')
          const enT = translations.find((t) => t.language_code === 'en')
          const title = jaT?.title || enT?.title || '(無題)'
          const targetLang = post.original_language === 'ja' ? 'en' : 'ja'
          const targetT = post.original_language === 'ja' ? enT : jaT
          const needsRetranslate =
            post.status === 'published' &&
            (targetT?.status === 'pending_insufficient_balance' ||
              targetT?.status === 'failed')

          return (
            <div key={post.id} className="flex items-center gap-4 px-6 py-4">
              {/* Thumbnail */}
              <div className="w-16 h-12 rounded bg-gray-100 shrink-0 overflow-hidden">
                {post.cover_image_url ? (
                  <Image
                    src={post.cover_image_url}
                    alt=""
                    width={64}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No img
                  </div>
                )}
              </div>

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(post.salons as any)?.name} · {formatDate(post.created_at)}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={post.status === 'published' ? 'success' : 'muted'}>
                  {post.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
                <TBadge status={jaT?.status} lang="JA" />
                <TBadge status={enT?.status} lang="EN" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {needsRetranslate && (
                  <RetranslateButton postId={post.id} targetLang={targetLang} />
                )}
                <Link href={`/posts/${post.id}/edit${salonId ? `?salon=${salonId}` : ''}`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                {post.status === 'published' && (
                  <Link href={`/salon/${post.salon_id}/${post.id}`} target="_blank">
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TBadge({ status, lang }: { status?: TranslationStatus; lang: string }) {
  if (!status) return <Badge variant="muted">{lang} —</Badge>
  if (status === 'completed') return <Badge variant="success">{lang} ✓</Badge>
  if (status === 'pending_insufficient_balance') return <Badge variant="warning">{lang} low balance</Badge>
  return <Badge variant="danger">{lang} error</Badge>
}
