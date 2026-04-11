'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JoinPage() {
  const params = useParams()
  const salonId = params.salonId as string

  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/member/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), invite_code: inviteCode.trim(), salon_id: salonId }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setError(error ?? '登録に失敗しました')
        return
      }
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/salon/${salonId}`,
          shouldCreateUser: true,
        },
      })
      if (otpError) {
        setError('メールの送信に失敗しました。時間をおいて再度お試しください。')
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <Link href="/" className="absolute top-6 left-6 text-sm font-bold text-[#1A1A1A] hover:opacity-70 transition-opacity">Fumi</Link>
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">メールを確認してください</h1>
          <p className="text-sm text-[#666] leading-relaxed mb-6">
            <strong className="text-[#1A1A1A]">{email}</strong> にログインリンクを送りました。
          </p>
          <p className="text-xs text-[#999]">届かない場合は迷惑メールフォルダをご確認ください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <Link href="/" className="absolute top-6 left-6 text-sm font-bold text-[#1A1A1A] hover:opacity-70 transition-opacity">Fumi</Link>

      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#999] mb-3">Join</p>
        <h1 className="text-2xl font-bold mb-1">入会する</h1>
        <p className="text-sm text-[#999] mb-8">招待コードとメールアドレスを入力してください。</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#999] mb-1.5">招待コード</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              placeholder="XXXXXXXX"
              className="w-full px-4 py-3.5 border border-[#E0E0E0] text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#999] mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3.5 border border-[#E0E0E0] text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !inviteCode.trim() || !email.trim()}
            className="w-full py-3.5 bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            {loading ? '確認中...' : 'メールを受け取る →'}
          </button>
        </form>

        <p className="mt-8 text-xs text-[#999]">
          すでに会員の方は{' '}
          <Link href={`/salon/${salonId}/login`} className="text-[#1A1A1A] underline underline-offset-2">
            こちらからログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
