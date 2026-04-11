import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const copy = {
  title:    { ja: 'Fumiへようこそ！', en: 'Welcome to Fumi!' },
  trial:    { ja: (n: number) => `無料トライアル開始。あと${n}日間使えます。`, en: (n: number) => `Your free trial has started. ${n} days remaining.` },
  sub:      { ja: '3ステップで始めましょう。', en: 'Get started in 3 steps.' },
  steps: [
    { num: '1', title: { ja: 'チャンネルを作る', en: 'Create a channel' }, body: { ja: 'サイドバーの「+ サロンを追加」からチャンネルを作成します。', en: 'Click "+ Add salon" in the sidebar to create your first channel.' } },
    { num: '2', title: { ja: '記事を書く', en: 'Write a post' }, body: { ja: '記事を書いて公開すると、会員にメールで届きます。', en: 'Publish a post and it will be delivered to members by email.' } },
    { num: '3', title: { ja: '会員を追加する', en: 'Add members' }, body: { ja: '会員管理からメールアドレスを登録します。StripeとつなぐとPro機能で自動追加できます。', en: 'Add members from the Members page. Connect Stripe for automatic sign-ups with Pro.' } },
  ],
  proTitle: { ja: '翻訳機能はProプランで使えます', en: 'Translation requires the Pro plan' },
  proBody:  { ja: 'トライアル中は記事の公開・配信・会員管理が使えます。多言語への自動翻訳はProプラン（¥2,980/月）にアップグレードしてからご利用ください。', en: 'During your trial, you can publish posts, deliver emails, and manage members. Auto-translation to other languages requires the Pro plan (¥2,980/month).' },
  upgradeBtn: { ja: 'Proにアップグレード →', en: 'Upgrade to Pro →' },
  skipBtn:    { ja: 'ダッシュボードへ',     en: 'Go to dashboard' },
}

function tx<T extends { ja: string; en: string }>(entry: T, lang: 'ja' | 'en'): string {
  return entry[lang]
}

export default async function WelcomePage() {
  const [{ owner, service }, lang] = await Promise.all([requireOwner(), getLang()])

  // すでにサロンを持っている場合はダッシュボードへ
  const { count } = await service
    .from('salons')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', owner.id)
  if ((count ?? 0) > 0) redirect('/dashboard')

  const trialEnd = new Date(new Date((owner as any).created_at ?? Date.now()).getTime() + 5 * 24 * 60 * 60 * 1000)
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))

  const C = copy

  return (
    <div className="max-w-2xl">
      {/* Language toggle */}
      <div className="flex justify-end mb-6">
        <LanguageToggle lang={lang} />
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">{tx(C.title, lang)}</h1>
        <div className="inline-block px-3 py-1.5 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded mb-3">
          {lang === 'ja' ? C.trial.ja(daysLeft) : C.trial.en(daysLeft)}
        </div>
        <p className="text-gray-500 text-sm">{tx(C.sub, lang)}</p>
      </div>

      {/* 3 steps */}
      <div className="border border-gray-200 divide-y divide-gray-200 mb-8">
        {C.steps.map((step) => (
          <div key={step.num} className="flex gap-5 p-6">
            <div className="shrink-0 w-8 h-8 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center">
              {step.num}
            </div>
            <div>
              <p className="font-semibold mb-1">{tx(step.title, lang)}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{tx(step.body, lang)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pro notice */}
      <div className="bg-gray-50 border border-gray-200 p-6 mb-8">
        <p className="font-semibold mb-2 flex items-center gap-2">
          <span className="text-amber-500">⚠</span>
          {tx(C.proTitle, lang)}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{tx(C.proBody, lang)}</p>
        <Link href="/billing" className="inline-block px-4 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors">
          {tx(C.upgradeBtn, lang)}
        </Link>
      </div>

      {/* Skip */}
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        {tx(C.skipBtn, lang)} →
      </Link>
    </div>
  )
}
