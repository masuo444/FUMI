import { getLang } from '@/lib/lang'
import { lp, tx } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'

export default async function PricingPage() {
  const lang = await getLang()
  const T = lp

  return (
    <div className="min-h-screen bg-white text-[#111]">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-70 transition-opacity">Fumi</Link>
          <div className="flex items-center gap-6">
            <Link href="/my/login" className="text-sm text-[#888] hover:text-[#111] transition-colors">{tx(T.nav.signin, lang)}</Link>
            <Link href="/login" className="px-5 py-2.5 text-sm font-semibold bg-[#111] text-white hover:bg-[#333] transition-colors rounded-full">
              {tx(T.nav.start, lang)}
            </Link>
            <LanguageToggle lang={lang} />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.4em] uppercase text-[#AAA] mb-6">
            {tx(T.pricing.label, lang)}
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-[-0.03em] mb-6 text-[#111]">
            {tx(T.pricing.title, lang)}
          </h1>
          <p className="text-lg text-[#888]">{tx(T.pricing.trialNote, lang)}</p>
        </div>
      </section>

      {/* ── Plan card ── */}
      <section className="max-w-2xl mx-auto px-8 pb-28">
        <div className="bg-white border border-[#E0E0E0] rounded-3xl overflow-hidden shadow-sm">

          {/* Price header */}
          <div className="bg-[#111] text-white px-12 py-14 text-center">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/40 mb-6">Pro</p>
            <div className="flex items-end justify-center gap-2 mb-3">
              <span className="text-8xl font-bold leading-none">$10</span>
              <span className="text-white/40 text-lg mb-3">/ {lang === 'ja' ? '月' : 'mo'}</span>
            </div>
            <p className="text-white/40 text-sm">{tx(T.pricing.trialNote, lang)}</p>
          </div>

          {/* Features */}
          <div className="px-12 py-12">
            <ul className="space-y-5 mb-12">
              {T.pricing.features.map((f) => (
                <li key={f.ja} className="flex items-center gap-4 text-[#333]">
                  <div className="w-6 h-6 rounded-full bg-[#111] flex items-center justify-center shrink-0">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5l3 3L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm">{tx(f, lang)}</span>
                </li>
              ))}
            </ul>

            <Link href="/login"
              className="block w-full text-center py-5 text-sm font-semibold bg-[#111] text-white hover:bg-[#333] transition-colors rounded-2xl">
              {tx(T.pricing.cta, lang)}
            </Link>
            <p className="text-center text-xs text-[#BBB] mt-4">
              {lang === 'ja' ? 'いつでもキャンセル可。初期費用なし。' : 'Cancel anytime. No setup fee.'}
            </p>
          </div>
        </div>

        {/* Translation credits note */}
        <div className="mt-8 bg-[#F8F8F8] border border-[#EBEBEB] rounded-2xl p-8">
          <h3 className="text-sm font-bold text-[#111] mb-3">
            {lang === 'ja' ? '翻訳クレジットについて' : 'About translation credits'}
          </h3>
          <p className="text-sm text-[#888] leading-relaxed">
            {lang === 'ja'
              ? '月額料金には翻訳クレジットが含まれます。クレジットを使って記事をAI翻訳し、世界中の会員にお届けします。不足した場合はダッシュボードから追加チャージが可能です。'
              : 'Your monthly plan includes translation credits. Use them to auto-translate articles for your global members. Run low? Top up anytime from your dashboard.'}
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[#F0F0F0] bg-[#F8F8F8]">
        <div className="max-w-2xl mx-auto px-8 py-24">
          <h2 className="text-3xl font-bold tracking-tight text-[#111] mb-12 text-center">
            {lang === 'ja' ? 'よくある質問' : 'FAQ'}
          </h2>
          <div className="space-y-8">
            {(lang === 'ja' ? [
              { q: 'トライアル期間中はどこまで使えますか？', a: '記事の公開・メール配信がご利用いただけます。AI自動翻訳はProプランで有効になります。' },
              { q: '会員数・チャンネル数に上限はありますか？', a: 'ありません。何チャンネルでも、何人でも追加できます。' },
              { q: 'いつでも解約できますか？', a: 'はい。解約はいつでも可能で、次の更新日から停止されます。違約金はありません。' },
              { q: '海外の会員に対応できますか？', a: 'はい。AI翻訳で記事を自動翻訳し、各会員の言語でメルマガをお届けします。' },
            ] : [
              { q: 'What can I do during the free trial?', a: 'You can publish posts and send email notifications. AI translation is enabled on the Pro plan.' },
              { q: 'Is there a limit on members or channels?', a: 'No. Add as many channels and members as you need.' },
              { q: 'Can I cancel anytime?', a: "Yes, cancel anytime. Your plan will stop at the next renewal date. No penalties." },
              { q: 'Can I reach international members?', a: 'Yes. Fumi auto-translates your posts using AI and delivers newsletters in each member\'s language.' },
            ]).map((item) => (
              <div key={item.q} className="border-b border-[#EBEBEB] pb-8">
                <h3 className="text-sm font-bold text-[#111] mb-3">{item.q}</h3>
                <p className="text-sm text-[#888] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#111] text-white">
        <div className="max-w-7xl mx-auto px-8 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">{tx(T.bottomCta.title, lang)}</h2>
          <p className="text-white/40 mb-10">{tx(T.bottomCta.sub, lang)}</p>
          <Link href="/login" className="inline-block px-10 py-4 text-sm font-semibold bg-white text-[#111] hover:bg-[#F0F0F0] transition-colors rounded-full">
            {tx(T.pricing.cta, lang)}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111] text-white border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Link href="/" className="font-bold hover:opacity-70 transition-opacity">Fumi</Link>
          <div className="flex gap-8 text-sm text-white/40">
            <Link href="/my/login" className="hover:text-white transition-colors">{tx(T.footer.memberLogin, lang)}</Link>
            <Link href="/login" className="hover:text-white transition-colors">{tx(T.footer.ownerLogin, lang)}</Link>
          </div>
          <span className="text-white/20 text-xs">© 2026 Fumi</span>
        </div>
      </footer>
    </div>
  )
}
