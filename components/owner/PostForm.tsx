'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { LanguageCode, TranslationEstimate, PostStatus } from '@/types'

interface PostFormProps {
  postId?: string
  initialData?: {
    title: string
    body: string
    original_language: LanguageCode
    cover_image_url?: string
    status: PostStatus
    send_notification: boolean
    salon_id: string
  }
  salons: Array<{ id: string; name: string }>
  defaultSalonId?: string
  currentBalance: number
}

export function PostForm({ postId, initialData, salons, defaultSalonId, currentBalance }: PostFormProps) {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [salonId, setSalonId] = useState(
    initialData?.salon_id ?? defaultSalonId ?? salons[0]?.id ?? ''
  )
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [body, setBody] = useState(initialData?.body ?? '')
  const [originalLang, setOriginalLang] = useState<LanguageCode>(initialData?.original_language ?? 'ja')
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_image_url ?? '')
  const [sendNotif, setSendNotif] = useState(initialData?.send_notification ?? false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<TranslationEstimate | null>(null)

  // Bilingual mode — user inputs both JA+EN manually (no token deduction)
  const [bilingualMode, setBilingualMode] = useState(false)
  const [title2, setTitle2] = useState('')
  const [body2, setBody2] = useState('')
  const body2Ref = useRef<HTMLTextAreaElement>(null)

  function autoResize2() {
    const el = body2Ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => { autoResize2() }, [body2])

  // Auto-resize body textarea
  function autoResize() {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => { autoResize() }, [body])

  // Debounced translation estimate (only when NOT in bilingual mode)
  useEffect(() => {
    if (bilingualMode || (!title && !body)) return
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/translate/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        })
        if (res.ok) setEstimate(await res.json())
      } catch {}
    }, 1000)
    return () => clearTimeout(t)
  }, [title, body, bilingualMode])

  // ── Toolbar actions ────────────────────────────────────────────
  function insertAtCursor(before: string, after: string, placeholder = '') {
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end) || placeholder
    const newBody = body.slice(0, start) + before + selected + after + body.slice(end)
    setBody(newBody)
    // restore cursor
    setTimeout(() => {
      el.focus()
      const pos = start + before.length + selected.length + after.length
      el.setSelectionRange(pos, pos)
    }, 0)
  }

  function handleBold() {
    const el = bodyRef.current
    if (!el) return
    const selected = body.slice(el.selectionStart, el.selectionEnd)
    if (selected) {
      insertAtCursor('**', '**')
    } else {
      insertAtCursor('**', '**', 'テキスト')
    }
  }

  async function handleImageInsert(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'post-images')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const { url } = await res.json()
      insertAtCursor(`\n![](${url})\n`, '')
    } finally {
      setUploading(false)
    }
  }

  async function handleCoverUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'post-images')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) return
      const { url } = await res.json()
      setCoverUrl(url)
    } finally {
      setUploading(false)
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  async function submit(status: PostStatus, newsletterOnly = false) {
    if (!salonId) { setError('サロンを選択してください'); return }
    if (!title.trim()) { setError('タイトルを入力してください'); return }
    if (!body.trim()) { setError('本文を入力してください'); return }
    if (bilingualMode && (!title2.trim() || !body2.trim())) {
      setError('両言語モードでは、もう一方の言語のタイトルと本文も入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        id: postId,
        salon_id: salonId,
        original_language: originalLang,
        title,
        body,
        cover_image_url: coverUrl || undefined,
        status,
        send_notification: newsletterOnly ? true : sendNotif,
        newsletter_only: newsletterOnly,
      }
      if (bilingualMode && title2.trim() && body2.trim()) {
        payload.manual_translation = { title: title2.trim(), body: body2.trim() }
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setError(error ?? 'エラーが発生しました')
        return
      }
      router.push('/posts')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky top bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Salon selector */}
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            className="text-sm text-gray-600 border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-gray-400 bg-white"
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
              {(['ja', 'en'] as LanguageCode[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setOriginalLang(lang)}
                  className={`px-3 py-1.5 transition-colors ${
                    originalLang === lang
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {lang === 'ja' ? 'JA' : 'EN'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => submit('draft')}
              disabled={saving || uploading}
              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中…' : '下書き保存'}
            </button>
            <button
              type="button"
              onClick={() => submit('draft', true)}
              disabled={saving || uploading}
              title="記事を公開せずメールだけ送る"
              className="px-4 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              📨 メルマガ送信
            </button>
            <button
              type="button"
              onClick={() => submit('published')}
              disabled={saving || uploading}
              className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              公開する
            </button>
          </div>
        </div>
      </div>

      {/* ── Editor area ──────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 pb-32">

        {/* Cover image */}
        <div className="mt-8 mb-6">
          {coverUrl ? (
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('cover-input')?.click()}>
              <img src={coverUrl} alt="cover" className="w-full h-56 object-cover rounded-xl" />
              <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">画像を変更</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById('cover-input')?.click()}
              className="w-full h-12 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
            >
              <span>＋</span> カバー画像を追加
            </button>
          )}
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }}
          />
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル"
          rows={1}
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none resize-none leading-tight mb-6 bg-transparent"
          style={{ overflow: 'hidden' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
        />

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-4 pb-3 border-b border-gray-100">
          <ToolbarButton
            onClick={handleBold}
            title="太文字 (⌘B)"
            label={<span className="font-bold text-base">B</span>}
          />
          <ToolbarButton
            onClick={() => imageInputRef.current?.click()}
            title="画像を挿入"
            label={
              uploading
                ? <span className="text-xs">...</span>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            }
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageInsert(f) }}
          />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setBilingualMode((v) => !v)}
            title="日英両方を手動入力（トークン不要）"
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              bilingualMode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {bilingualMode ? '両言語モード ON' : '両言語で入力'}
          </button>
        </div>

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => { setBody(e.target.value); autoResize() }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
              e.preventDefault()
              handleBold()
            }
          }}
          placeholder="本文を書く..."
          className="w-full text-gray-800 placeholder-gray-300 border-none outline-none resize-none leading-relaxed text-lg bg-transparent min-h-96"
          style={{ overflow: 'hidden' }}
        />

        {/* Second language fields (bilingual mode) */}
        {bilingualMode && (
          <div className="mt-10 pt-8 border-t-2 border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
              {originalLang === 'ja' ? '英語（手動入力）' : '日本語（手動入力）'}
            </p>
            <textarea
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              placeholder={originalLang === 'ja' ? 'タイトル（英語）' : 'タイトル（日本語）'}
              rows={1}
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none resize-none leading-tight mb-6 bg-transparent"
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
            />
            <textarea
              ref={body2Ref}
              value={body2}
              onChange={(e) => { setBody2(e.target.value); autoResize2() }}
              placeholder={originalLang === 'ja' ? '本文（英語）...' : '本文（日本語）...'}
              className="w-full text-gray-800 placeholder-gray-300 border-none outline-none resize-none leading-relaxed text-lg bg-transparent min-h-64"
              style={{ overflow: 'hidden' }}
            />
          </div>
        )}

        {/* ── Bottom settings ─────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col gap-4">
          {/* Notification */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotif}
              onChange={(e) => setSendNotif(e.target.checked)}
              className="w-4 h-4 accent-gray-900"
            />
            <span className="text-sm text-gray-600">公開時に会員へ通知メールを送る</span>
          </label>

          {/* Translation estimate (hidden in bilingual mode) */}
          {!bilingualMode && estimate && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{estimate.estimated_chars.toLocaleString()}文字</span>
              <span>·</span>
              <span>翻訳コスト概算 {formatCurrency(estimate.estimated_cost_jpy)}</span>
              <span>·</span>
              {estimate.sufficient_balance
                ? <Badge variant="success">残高OK</Badge>
                : <Badge variant="warning">残高不足</Badge>
              }
            </div>
          )}
          {bilingualMode && (
            <p className="text-sm text-gray-400">両言語モード：翻訳トークンは消費しません</p>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  title,
  label,
}: {
  onClick: () => void
  title: string
  label: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      {label}
    </button>
  )
}
