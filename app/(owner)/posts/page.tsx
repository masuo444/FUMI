import { requireOwner } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PostsListClient } from '@/components/owner/PostsListClient'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>
}) {
  const { salon: salonId } = await searchParams
  const { owner, service } = await requireOwner()


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
        <h1 className="text-2xl font-bold">記事</h1>
        <Link href={`/posts/new${salonId ? `?salon=${salonId}` : ''}`}>
          <Button>+ 新しい記事</Button>
        </Link>
      </div>

      <PostsListClient posts={(posts ?? []) as any} salonId={salonId} />
    </div>
  )
}
