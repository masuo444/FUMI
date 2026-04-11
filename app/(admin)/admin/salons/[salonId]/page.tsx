import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default async function AdminSalonPage({
  params,
}: {
  params: Promise<{ salonId: string }>
}) {
  const { salonId } = await params
  const { service } = await requireAdmin()

  const [{ data: salon }, { data: posts }, { data: members }] = await Promise.all([
    service.from('salons').select('*, owners(name, email)').eq('id', salonId).single(),
    service
      .from('posts')
      .select('id, status, published_at, created_at, post_translations(language_code, title, status)')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false }),
    service
      .from('members')
      .select('id, email, name, preferred_language, status, created_at')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false }),
  ])

  if (!salon) notFound()

  const owner = (salon as any).owners

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">← 一覧に戻る</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{salon.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            オーナー: {owner?.name}（{owner?.email}）
          </p>
          {salon.description && <p className="text-sm text-gray-400 mt-1">{salon.description}</p>}
        </div>
        <Link
          href={`/salon/${salonId}`}
          target="_blank"
          className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          ユーザー画面で見る →
        </Link>
      </div>

      {/* Posts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">記事一覧（{(posts ?? []).length}件）</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {(posts ?? []).length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">記事なし</p>
          )}
          {(posts ?? []).map((post) => {
            const translations = (post.post_translations as any[]) ?? []
            const jaTitle = translations.find((t) => t.language_code === 'ja')?.title
            const enTitle = translations.find((t) => t.language_code === 'en')?.title
            const title = jaTitle ?? enTitle ?? '(無題)'
            return (
              <div key={post.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(post.published_at ?? post.created_at)}
                    {' · '}
                    <span className={post.status === 'published' ? 'text-green-600' : 'text-gray-400'}>
                      {post.status === 'published' ? '公開' : '下書き'}
                    </span>
                    {' · '}
                    JA:{translations.find((t) => t.language_code === 'ja')?.status ?? 'なし'}
                    {' / '}
                    EN:{translations.find((t) => t.language_code === 'en')?.status ?? 'なし'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/salon/${salonId}/${post.id}`}
                    target="_blank"
                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    表示
                  </Link>
                  <Link
                    href={`/admin/salons/${salonId}/posts/${post.id}/edit`}
                    className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700"
                  >
                    編集
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">会員一覧（{(members ?? []).length}件）</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {(members ?? []).length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-gray-400">会員なし</p>
          )}
          {(members ?? []).map((m) => (
            <div key={m.id} className="px-6 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{m.name ?? m.email}</p>
                {m.name && <p className="text-xs text-gray-400">{m.email}</p>}
              </div>
              <span className="text-xs text-gray-500">{m.preferred_language.toUpperCase()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                m.status === 'active'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {m.status === 'active' ? '有効' : '無効'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
