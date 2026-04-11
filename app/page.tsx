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
    accent: '#c9a227',
    initial: 'F',
  },
  {
    key: 'gps-runner',
    href: '/gps-runner',
    name: 'GPS RUNNER SUPPORTERS',
    tagline: { ja: 'ランニングコミュニティ', en: 'Running Community' },
    description: { ja: 'GPSウォッチで走る仲間たちのコミュニティ。レース・トレーニング・ギア情報をシェア。', en: 'A community for GPS watch runners. Sharing race reports, training tips, and gear reviews.' },
    accent: '#4ade80',
    initial: 'G',
  },
  {
    key: 'terroir-hub',
    href: '/terroir-hub',
    name: 'terroir HUB',
    tagline: { ja: '発酵文化グローバルコミュニティ', en: 'Fermentation Culture' },
    description: { ja: '日本酒・焼酎・ワインなど発酵文化を愛するグローバルコミュニティ。生産者と愛好家を繋ぐ。', en: 'A global community for lovers of sake, shochu, wine and fermentation culture.' },
    accent: '#d4a96a',
    initial: 'T',
  },
  {
    key: 'masshu-blog',
    href: '/masshu-blog',
    name: 'まっすー活動記',
    tagline: { ja: '活動ブログ', en: 'Activity Blog' },
    description: { ja: 'まっすーの日々の活動・挑戦・気づきを綴るブログ。ランニング、ビジネス、海外生活など。', en: 'Daily chronicles of running, business, and life abroad by Massu.' },
    accent: '#60a5fa',
    initial: 'M',
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
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Fumi</span>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#how" className="hidden md:block text-white/50 hover:text-white transition-colors">{tx(T.nav.how, lang)}</a>
            <a href="#channels" className="hidden md:block text-white/50 hover:text-white transition-colors">{tx(T.nav.channels, lang)}</a>
            <a href="#pricing" className="hidden md:block text-white/50 hover:text-white transition-colors">{tx(T.nav.pricing, lang)}</a>
            <Link href="/my/login" className="text-white/50 hover:text-white transition-colors">{tx(T.nav.signin, lang)}</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors rounded-full">
              {tx(T.nav.start, lang)}
            </Link>
            <LanguageToggle lang={lang} />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-white/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 mb-10 tracking-widest uppercase">
            {tx(T.hero.label, lang)}
          </div>
          <h1 className="text-6xl sm:text-8xl font-bold leading-[1.0] tracking-[-0.03em] mb-8 max-w-3xl whitespace-pre-line">
            {tx(T.hero.title, lang)}
          </h1>
          <p className="text-lg text-white/40 leading-relaxed max-w-lg mb-12 whitespace-pre-line">
            {tx(T.hero.sub, lang)}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="px-8 py-4 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors rounded-full">
              {tx(T.hero.ctaTrial, lang)}
            </Link>
            <Link href="/my/login" className="px-8 py-4 text-sm font-semibold border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors rounded-full">
              {tx(T.hero.ctaMember, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-white/[0.06]" />

      {/* ── How it works ── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-28">
        <div className="mb-16">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-4">{tx(T.how.label, lang)}</p>
          <h2 className="text-4xl font-bold tracking-tight">{tx(T.how.title, lang)}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-px bg-white/[0.06]">
          {T.how.steps.map((item) => (
            <div key={item.step} className="bg-[#0A0A0A] p-10">
              <p className="text-xs font-semibold tracking-[0.3em] text-white/20 mb-8">{item.step}</p>
              <h3 className="text-2xl font-bold mb-4">{tx(item.title, lang)}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{tx(item.body, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For who ── */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-4">{tx(T.forWho.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight max-w-xl">{tx(T.forWho.title, lang)}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06]">
            {T.forWho.cards.map((card) => (
              <div key={card.label.ja} className="bg-[#0A0A0A] p-10">
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-6">{tx(card.label, lang)}</p>
                <h3 className="text-xl font-bold mb-4 leading-snug">{tx(card.title, lang)}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-6">{tx(card.body, lang)}</p>
                <p className="text-xs text-white/20 leading-relaxed">{tx(card.examples, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-4">{tx(T.channels.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight">{tx(T.channels.title, lang)}</h2>
          </div>
          <div className="space-y-px bg-white/[0.06]">
            {FIXED_SALONS.map((salon) => (
              <Link key={salon.key} href={salon.href}
                className="group flex items-center gap-8 bg-[#0A0A0A] p-8 hover:bg-white/[0.03] transition-colors">
                <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `${salon.accent}18`, color: salon.accent }}>
                  {salon.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/30 mb-1">{tx(salon.tagline, lang)}</p>
                  <h3 className="text-base font-bold text-white leading-snug">{salon.name}</h3>
                  <p className="text-sm text-white/30 leading-relaxed mt-1 hidden sm:block">{tx(salon.description, lang)}</p>
                </div>
                <span className="text-white/20 group-hover:text-white/60 transition-colors text-xl">→</span>
              </Link>
            ))}
            {dynamicSalons.map((salon, i) => {
              const accents = ['#a78bfa', '#34d399', '#fb923c']
              const accent = accents[i % accents.length]
              return (
                <Link key={salon.id} href={`/salon/${salon.id}`}
                  className="group flex items-center gap-8 bg-[#0A0A0A] p-8 hover:bg-white/[0.03] transition-colors">
                  <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: `${accent}18`, color: accent }}>
                    {salon.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white">{salon.name}</h3>
                    {salon.description && <p className="text-sm text-white/30 mt-1 hidden sm:block">{salon.description}</p>}
                  </div>
                  <span className="text-white/20 group-hover:text-white/60 transition-colors text-xl">→</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-4">{tx(T.pricing.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight">{tx(T.pricing.title, lang)}</h2>
          </div>
          <div className="max-w-sm">
            <div className="border border-white/[0.1] p-10">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-6xl font-bold">$10</span>
                <span className="text-white/30 text-sm mb-2">/ {lang === 'ja' ? '月' : 'month'}</span>
              </div>
              <p className="text-white/30 text-sm mb-8">{tx(T.pricing.trialNote, lang)}</p>
              <div className="border-t border-white/[0.08] pt-8 mb-8">
                <ul className="space-y-4">
                  {T.pricing.features.map((f) => (
                    <li key={f.ja} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/40 shrink-0">✓</span>
                      {tx(f, lang)}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/login" className="block text-center py-4 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors rounded-full">
                {tx(T.pricing.cta, lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-32 text-center">
          <h2 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] mb-6">{tx(T.bottomCta.title, lang)}</h2>
          <p className="text-base text-white/30 mb-12">{tx(T.bottomCta.sub, lang)}</p>
          <Link href="/login" className="inline-block px-10 py-4 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors rounded-full">
            {tx(T.bottomCta.button, lang)}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-bold block mb-1">Fumi</span>
            <span className="text-white/20 text-xs">{tx(T.footer.tagline, lang)}</span>
          </div>
          <div className="flex gap-8 text-sm text-white/30">
            <Link href="/my/login" className="hover:text-white transition-colors">{tx(T.footer.memberLogin, lang)}</Link>
            <Link href="/login" className="hover:text-white transition-colors">{tx(T.footer.ownerLogin, lang)}</Link>
          </div>
          <span className="text-white/15 text-xs">© 2026 Fumi</span>
        </div>
      </footer>
    </div>
  )
}
