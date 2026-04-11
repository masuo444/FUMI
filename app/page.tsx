import { createServiceClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/lang'
import { lp, tx } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'

const FIXED_SALONS = [
  {
    key: 'fomus-guild',
    href: '/fomus-guild',
    name: 'FOMUS GUILD',
    tagline: { ja: 'プライベートコミュニティ', en: 'Private Community' },
    description: { ja: '招待制の会員制コミュニティ。グローバル・ビジネス・クリエイティブをテーマに厳選情報を配信。', en: 'An invitation-only membership community delivering curated insights on global business and creative culture.' },
    bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1208 50%, #2a1f00 100%)',
    label: 'GUILD',
    color: '#c9a227',
  },
  {
    key: 'gps-runner',
    href: '/gps-runner',
    name: 'GPS RUNNER SUPPORTERS',
    tagline: { ja: 'ランニングコミュニティ', en: 'Running Community' },
    description: { ja: 'GPSウォッチで走る仲間たちのサポーターコミュニティ。レース・トレーニング・ギア情報をシェア。', en: 'A supporters community for GPS watch runners. Sharing race reports, training tips, and gear reviews.' },
    bg: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a3322 100%)',
    label: 'RUN',
    color: '#ffffff',
  },
  {
    key: 'terroir-hub',
    href: '/terroir-hub',
    name: 'terroir HUB',
    tagline: { ja: '発酵文化グローバルコミュニティ', en: 'Fermentation Culture' },
    description: { ja: '日本酒・焼酎・ワインなど発酵文化を愛するグローバルコミュニティ。生産者と愛好家を繋ぐプラットフォーム。', en: 'A global community for lovers of sake, shochu, wine and fermentation culture. Connecting producers and enthusiasts worldwide.' },
    bg: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 40%, #1a1200 100%)',
    label: 'terroir',
    color: '#d4a96a',
  },
  {
    key: 'masshu-blog',
    href: '/masshu-blog',
    name: 'まっすー活動記',
    tagline: { ja: '活動ブログ', en: 'Activity Blog' },
    description: { ja: 'まっすーの日々の活動・挑戦・気づきを綴るブログ。ランニング、ビジネス、海外生活など。', en: 'Daily chronicles of running, business, and life abroad by Massu.' },
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    label: '活動',
    color: '#ffffff',
  },
]

const FIXED_NAMES = FIXED_SALONS.map((s) => s.name)

export default async function Home() {
  const [lang, supabaseResult] = await Promise.all([
    getLang(),
    createServiceClient().then(s => s.from('salons').select('id, name, description').order('created_at')),
  ])
  const { data: salons } = supabaseResult
  const dynamicSalons = (salons ?? []).filter((s) => !FIXED_NAMES.includes(s.name))

  const T = lp

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight">Fumi</span>
          <nav className="flex items-center gap-5 text-sm text-[#555]">
            <a href="#how" className="hidden md:block hover:text-[#1A1A1A] transition-colors">{tx(T.nav.how, lang)}</a>
            <a href="#channels" className="hidden md:block hover:text-[#1A1A1A] transition-colors">{tx(T.nav.channels, lang)}</a>
            <a href="#pricing" className="hidden md:block hover:text-[#1A1A1A] transition-colors">{tx(T.nav.pricing, lang)}</a>
            <Link href="/my/login" className="hover:text-[#1A1A1A] transition-colors">{tx(T.nav.signin, lang)}</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors">
              {tx(T.nav.start, lang)}
            </Link>
            <LanguageToggle lang={lang} />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-28 sm:py-40">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-white/40 mb-8">
            {tx(T.hero.label, lang)}
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold leading-[1.08] tracking-tight mb-8 max-w-2xl whitespace-pre-line">
            {tx(T.hero.title, lang)}
          </h1>
          <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-md mb-12 whitespace-pre-line">
            {tx(T.hero.sub, lang)}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="px-7 py-3.5 text-sm font-semibold bg-white text-[#1A1A1A] hover:bg-[#F0F0F0] transition-colors">
              {tx(T.hero.ctaTrial, lang)}
            </Link>
            <Link href="/my/login" className="px-7 py-3.5 text-sm font-semibold border border-white/30 text-white hover:border-white/60 transition-colors">
              {tx(T.hero.ctaMember, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#999] mb-3">{tx(T.how.label, lang)}</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">{tx(T.how.title, lang)}</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>
        <div className="grid sm:grid-cols-3 gap-0 border border-[#E0E0E0] divide-y sm:divide-y-0 sm:divide-x divide-[#E0E0E0]">
          {T.how.steps.map((item) => (
            <div key={item.step} className="p-8 sm:p-10">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-[#999] mb-4">{item.step}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-[#4F6AF5]">›</span>
                <h3 className="text-xl font-bold">{tx(item.title, lang)}</h3>
              </div>
              <p className="text-sm text-[#666] leading-relaxed">{tx(item.body, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For who ── */}
      <section className="bg-[#F5F5F5] border-t border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#999] mb-3">{tx(T.forWho.label, lang)}</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">{tx(T.forWho.title, lang)}</h2>
            <div className="w-8 h-[3px] bg-[#1A1A1A]" />
          </div>
          <div className="grid sm:grid-cols-2 gap-10">
            {T.forWho.cards.map((card) => (
              <div key={card.label.ja} className="bg-white border border-[#E0E0E0] p-8">
                <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#999] mb-4">{tx(card.label, lang)}</p>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg font-bold text-[#4F6AF5] shrink-0 mt-0.5">›</span>
                  <h3 className="text-lg font-bold leading-snug">{tx(card.title, lang)}</h3>
                </div>
                <p className="text-sm text-[#666] leading-relaxed mb-4">{tx(card.body, lang)}</p>
                <p className="text-xs text-[#999]">{tx(card.examples, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#999] mb-3">{tx(T.channels.label, lang)}</p>
          <h2 className="text-2xl font-bold tracking-tight mb-3">{tx(T.channels.title, lang)}</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>
        <div className="divide-y divide-[#E0E0E0] border-t border-[#E0E0E0]">
          {FIXED_SALONS.map((salon) => (
            <Link key={salon.key} href={salon.href} className="group flex gap-6 sm:gap-10 py-10 items-start hover:bg-[#FAFAFA] transition-colors px-2 -mx-2">
              <div className="shrink-0 w-[100px] h-[80px] sm:w-[200px] sm:h-[140px] overflow-hidden flex items-center justify-center" style={{ background: salon.bg }}>
                <span className="font-bold text-xl sm:text-3xl tracking-widest select-none transition-transform duration-300 group-hover:scale-110" style={{ color: salon.color }}>{salon.label}</span>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#999] mb-2">{tx(salon.tagline, lang)}</p>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg font-bold leading-none mt-0.5 shrink-0 text-[#4F6AF5]">›</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] leading-snug tracking-tight">{salon.name}</h3>
                </div>
                <p className="text-sm text-[#666] leading-relaxed max-w-lg hidden sm:block">{tx(salon.description, lang)}</p>
              </div>
              <span className="shrink-0 text-xl font-light text-[#CCC] group-hover:text-[#1A1A1A] transition-colors self-center">›</span>
            </Link>
          ))}
          {dynamicSalons.map((salon, i) => {
            const gradients = ['linear-gradient(135deg, #1e1e2e 0%, #2d2b55 100%)', 'linear-gradient(135deg, #1a2035 0%, #243050 100%)', 'linear-gradient(135deg, #1e2a1e 0%, #2a402a 100%)']
            return (
              <Link key={salon.id} href={`/salon/${salon.id}`} className="group flex gap-6 sm:gap-10 py-10 items-start hover:bg-[#FAFAFA] transition-colors px-2 -mx-2">
                <div className="shrink-0 w-[100px] h-[80px] sm:w-[200px] sm:h-[140px] overflow-hidden flex items-center justify-center" style={{ background: gradients[i % gradients.length] }}>
                  <span className="font-bold text-3xl text-white/70 select-none">{salon.name.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg font-bold leading-none mt-0.5 shrink-0 text-[#4F6AF5]">›</span>
                    <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] leading-snug tracking-tight">{salon.name}</h3>
                  </div>
                  {salon.description && <p className="text-sm text-[#666] leading-relaxed max-w-lg hidden sm:block">{salon.description}</p>}
                </div>
                <span className="shrink-0 text-xl font-light text-[#CCC] group-hover:text-[#1A1A1A] transition-colors self-center">›</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#F5F5F5] border-t border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#999] mb-3">{tx(T.pricing.label, lang)}</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">{tx(T.pricing.title, lang)}</h2>
            <div className="w-8 h-[3px] bg-[#1A1A1A]" />
          </div>
          <div className="max-w-sm">
            <div className="bg-[#1A1A1A] text-white p-10">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold">¥2,980</span>
                <span className="text-white/40 text-sm mb-1.5">/ {lang === 'ja' ? '月' : 'month'}</span>
              </div>
              <p className="text-white/50 text-sm mb-2">{tx(T.pricing.trialNote, lang)}</p>
              <div className="w-8 h-[2px] bg-white/20 my-6" />
              <ul className="space-y-3 text-sm text-white/70 mb-8">
                {T.pricing.features.map((f) => (
                  <li key={f.ja} className="flex gap-2"><span className="text-white">›</span>{tx(f, lang)}</li>
                ))}
              </ul>
              <Link href="/login" className="block text-center py-3.5 text-sm font-semibold bg-white text-[#1A1A1A] hover:bg-[#F0F0F0] transition-colors">
                {tx(T.pricing.cta, lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">{tx(T.bottomCta.title, lang)}</h2>
          <p className="text-base text-white/50 mb-10">{tx(T.bottomCta.sub, lang)}</p>
          <Link href="/login" className="inline-block px-10 py-4 text-sm font-semibold bg-white text-[#1A1A1A] hover:bg-[#F0F0F0] transition-colors">
            {tx(T.bottomCta.button, lang)}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0A0A0A] text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-bold text-base block mb-1">Fumi</span>
            <span className="text-white/30 text-xs">{tx(T.footer.tagline, lang)}</span>
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <Link href="/my/login" className="hover:text-white transition-colors">{tx(T.footer.memberLogin, lang)}</Link>
            <Link href="/login" className="hover:text-white transition-colors">{tx(T.footer.ownerLogin, lang)}</Link>
          </div>
          <span className="text-white/20 text-xs">© 2026 Fumi. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
