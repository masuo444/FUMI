'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RetranslateButton } from '@/components/owner/RetranslateButton'
import { formatDate } from '@/lib/utils'
import { TranslationStatus, PostStatus } from '@/types'

interface PostItem {
  id: string
  salon_id: string
  status: PostStatus
  original_language: string
  cover_image_url: string | null
  published_at: string | null
  created_at: string
  post_translations: { language_code: string; title: string; status: TranslationStatus }[]
  salons: { name: string } | null
}

export function PostsListClient({
  posts,
  salonId,
}: {
  posts: PostItem[]
  salonId?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmId(null)
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = posts.filter((post) => {
    const translations = post.post_translations ?? []
    const jaT = translations.find((t) => t.language_code === 'ja')
    const enT = translations.find((t) => t.language_code === 'en')
    const title = jaT?.title || enT?.title || ''
    const matchSearch = title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || post.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="タイトルで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {([
            { value: 'all', label: 'すべて' },
            { value: 'published', label: '公開済み' },
            { value: 'draft', label: '下書き' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 transition-colors ${
                statusFilter === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400">{filtered.length}件</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            {posts.length === 0
              ? <>まだ記事がありません。 <Link href={`/posts/new${salonId ? `?salon=${salonId}` : ''}`} className="underline">最初の記事を書く</Link></>
              : '条件に一致する記事がありません'}
          </p>
        )}

        {filtered.map((post) => {
          const translations = post.post_translations ?? []
          const jaT = translations.find((t) => t.language_code === 'ja')
          const enT = translations.find((t) => t.language_code === 'en')
          const title = jaT?.title || enT?.title || '(無題)'
          const targetLang = post.original_language === 'ja' ? 'en' : 'ja'
          const targetT = post.original_language === 'ja' ? enT : jaT
          const needsRetranslate =
            post.status === 'published' &&
            (targetT?.status === 'pending_insufficient_balance' || targetT?.status === 'failed')

          return (
            <div key={post.id} className="flex items-center gap-4 px-6 py-4">
              {/* Thumbnail */}
              <div className="w-16 h-12 rounded bg-gray-100 shrink-0 overflow-hidden">
                {post.cover_image_url ? (
                  <Image src={post.cover_image_url} alt="" width={64} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {post.salons?.name} · {formatDate(post.created_at)}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={post.status} />
                <TBadge status={jaT?.status} lang="JA" />
                <TBadge status={enT?.status} lang="EN" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {needsRetranslate && (
                  <RetranslateButton postId={post.id} targetLang={targetLang} />
                )}
                <Link href={`/posts/${post.id}/edit${salonId ? `?salon=${salonId}` : ''}`}>
                  <Button variant="secondary" size="sm">編集</Button>
                </Link>
                {post.status === 'published' && (
                  <Link href={`/salon/${post.salon_id}/${post.id}`} target="_blank">
                    <Button variant="ghost" size="sm">表示</Button>
                  </Link>
                )}

                {/* Delete */}
                {confirmId === post.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === post.id ? '削除中…' : '確認'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(post.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="削除"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4M8.5 6v4M3 3.5l.7 8.5h6.6L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === 'published') return <Badge variant="success">公開済み</Badge>
  return <Badge variant="muted">下書き</Badge>
}

function TBadge({ status, lang }: { status?: TranslationStatus; lang: string }) {
  if (!status) return <Badge variant="muted">{lang} —</Badge>
  if (status === 'completed') return <Badge variant="success">{lang} ✓</Badge>
  if (status === 'pending_insufficient_balance') return <Badge variant="warning">{lang} 残高不足</Badge>
  return <Badge variant="danger">{lang} エラー</Badge>
}
