'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Salon, NotificationLanguage } from '@/types'

interface Props {
  salon: Salon
  onSaved: (updated: Salon) => void
}

export function SalonSettingsForm({ salon, onSaved }: Props) {
  const [name, setName] = useState(salon.name)
  const [description, setDescription] = useState(salon.description ?? '')
  const [paymentUrl, setPaymentUrl] = useState(salon.payment_url ?? '')
  const [heroImageUrl, setHeroImageUrl] = useState(salon.hero_image_url ?? '')
  const [heroUploading, setHeroUploading] = useState(false)
  const [inviteEnabled, setInviteEnabled] = useState(!!(salon as any).invite_code)
  const [inviteCode, setInviteCode] = useState((salon as any).invite_code ?? '')
  const [notifLang, setNotifLang] = useState<NotificationLanguage>(
    salon.notification_language ?? 'member'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)

  async function uploadHeroImage(file: File) {
    setHeroUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) { setError('画像のアップロードに失敗しました'); return }
      const { url } = await res.json()
      setHeroImageUrl(url)
    } finally {
      setHeroUploading(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('サロン名を入力してください'); return }
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch(`/api/salons?id=${salon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        payment_url: paymentUrl.trim() || null,
        hero_image_url: heroImageUrl.trim() || null,
        invite_code: inviteEnabled ? (inviteCode.trim() || null) : null,
        notification_language: notifLang,
      }),
    })

    if (res.ok) {
      const updated: Salon = await res.json()
      onSaved(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const { error } = await res.json()
      setError(error ?? '保存に失敗しました')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Input
        label="サロン名 *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My Salon"
        required
      />
      <Textarea
        label="説明"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="サロンの紹介文（ユーザーページに表示されます）"
      />
      {/* ヒーロー画像 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          ヒーロー画像（サロンページ右側に表示）
        </label>
        {heroImageUrl && (
          <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img src={heroImageUrl} alt="hero" className="w-full h-32 object-cover" />
            <button
              type="button"
              onClick={() => setHeroImageUrl('')}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <input
          ref={heroInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadHeroImage(file)
          }}
        />
        <button
          type="button"
          onClick={() => heroInputRef.current?.click()}
          disabled={heroUploading}
          className="w-fit px-4 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          {heroUploading ? 'アップロード中...' : heroImageUrl ? '画像を変更' : '画像をアップロード'}
        </button>
        <p className="text-xs text-gray-400">推奨: 横長（16:9）の写真。右側に縦いっぱいに表示されます。</p>
      </div>

      <Input
        label="外部決済リンク（payment_url）"
        type="url"
        value={paymentUrl}
        onChange={(e) => setPaymentUrl(e.target.value)}
        placeholder="https://example.com/join"
      />
      <p className="text-xs text-gray-400">
        会員登録・会費決済はこのリンクで行います。プラットフォームは決済を受け取りません。
      </p>

      {/* 招待コードトグル */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-gray-700">招待コードで入会を許可</span>
            <p className="text-xs text-gray-400 mt-0.5">
              ONにするとユーザーがコードを入力して自分で入会できます
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={inviteEnabled}
            onClick={() => setInviteEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              inviteEnabled ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                inviteEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>

        {inviteEnabled && (
          <Input
            label="招待コード"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="例: GPSRUN-2026"
          />
        )}
      </div>

      {/* 通知メール言語 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">通知メールの言語</label>
        <div className="flex flex-col gap-1.5">
          {([
            { value: 'member', label: '会員ごとの設定に従う（推奨）', desc: '各会員の preferred_language でJA/ENを自動選択' },
            { value: 'ja',     label: '常に日本語で送る',              desc: '全会員に日本語の通知メールを送る' },
            { value: 'en',     label: '常に英語で送る',                desc: '全会員に英語の通知メールを送る' },
          ] as { value: NotificationLanguage; label: string; desc: string }[]).map((opt) => (
            <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="notif_lang"
                value={opt.value}
                checked={notifLang === opt.value}
                onChange={() => setNotifLang(opt.value)}
                className="mt-0.5 accent-gray-900"
              />
              <span>
                <span className="text-sm text-gray-800">{opt.label}</span>
                <span className="block text-xs text-gray-400">{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">保存しました</Alert>}
      <div>
        <Button type="submit" loading={saving}>保存する</Button>
      </div>
    </form>
  )
}
