'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { member, tx, type Lang } from '@/lib/i18n'
import Link from 'next/link'

export default function MemberLoginPage() {
  const params = useParams()
  const router = useRouter()
  const salonId = params.salonId as string

  const [lang, setLang] = useState<Lang>('ja')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const c = document.cookie.split(';').find(s => s.trim().startsWith('fumi_lang='))?.split('=')[1]
    if (c === 'en') setLang('en')
  }, [])

  const t = member.login

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const check = await fetch('/api/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), salon_id: salonId }),
      })
      if (!check.ok) {
        const { error } = await check.json()
        setError(error ?? tx(t.sendBtn, lang))
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
        setError(lang === 'ja' ? 'メールの送信に失敗しました。しばらくしてから再度お試しください。' : 'Failed to send email. Please try again later.')
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
          <h1 className="text-2xl font-bold mb-3">{tx(t.sentTitle, lang)}</h1>
          <p className="text-sm text-[#666] leading-relaxed mb-6">
            {t.sentBody[lang](email)}
          </p>
          <p className="text-xs text-[#999]">{tx(t.spamNote, lang)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <Link href="/" className="absolute top-6 left-6 text-sm font-bold text-[#1A1A1A] hover:opacity-70 transition-opacity">Fumi</Link>

      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#999] mb-3">{tx(t.membersOnly, lang)}</p>
        <h1 className="text-2xl font-bold mb-1">{tx(t.title, lang)}</h1>
        <p className="text-sm text-[#999] mb-8">{tx(t.sub, lang)}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#999] mb-1.5">{tx(t.emailLabel, lang)}</label>
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
            disabled={loading || !email.trim()}
            className="w-full py-3.5 bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            {loading ? tx(t.sendingBtn, lang) : tx(t.sendBtn, lang)}
          </button>
        </form>

        <p className="mt-8 text-xs text-[#999]">
          {lang === 'ja' ? 'まだ会員でない方は' : "Not a member yet?"}{' '}
          <Link href={`/salon/${salonId}/join`} className="text-[#1A1A1A] underline underline-offset-2">
            {lang === 'ja' ? 'こちらから入会' : 'Join here'}
          </Link>
        </p>
      </div>
    </div>
  )
}
