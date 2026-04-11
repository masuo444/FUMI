import { createServiceClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/lang'
import { lp, tx } from '@/lib/i18n'
import { LanguageToggle } from '@/components/LanguageToggle'
import Link from 'next/link'
import Image from 'next/image'

const FIXED_SALONS = [
  {
    key: 'fomus-guild',
    href: '/fomus-guild',
    name: 'FOMUS GUILD',
    tagline: { ja: 'プライベートコミュニティ', en: 'Private Community' },
    description: { ja: '招待制の会員制コミュニティ。グローバル・ビジネス・クリエイティブをテーマに厳選情報を配信。', en: 'An invitation-only membership community delivering curated insights on global business and creative culture.' },
    image: null as string | null,
    fallbackBg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1208 50%, #2a1f00 100%)',
    fallbackText: 'GUILD',
    fallbackColor: '#c9a227',
  },
  {
    key: 'gps-runner',
    href: '/gps-runner',
    name: 'GPS RUNNER SUPPORTERS',
    tagline: { ja: 'ランニングコミュニティ', en: 'Running Community' },
    description: { ja: 'GPSウォッチで走る仲間たちのコミュニティ。レース・トレーニング・ギア情報をシェア。', en: 'A community for GPS watch runners. Race reports, training tips, and gear reviews.' },
    image: null as string | null,
    fallbackBg: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a3322 100%)',
    fallbackText: 'RUN',
    fallbackColor: '#ffffff',
  },
  {
    key: 'terroir-hub',
    href: '/terroir-hub',
    name: 'terroir HUB',
    tagline: { ja: '発酵文化グローバルコミュニティ', en: 'Fermentation Culture' },
    description: { ja: '日本酒・焼酎・ワインなど発酵文化を愛するグローバルコミュニティ。生産者と愛好家を繋ぐ。', en: 'A global community for sake, shochu, wine and fermentation culture lovers.' },
    image: null as string | null,
    fallbackBg: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 40%, #1a1200 100%)',
    fallbackText: 'terroir',
    fallbackColor: '#d4a96a',
  },
  {
    key: 'masshu-blog',
    href: '/masshu-blog',
    name: 'まっすー活動記',
    tagline: { ja: '活動ブログ', en: 'Activity Blog' },
    description: { ja: 'まっすーの日々の活動・挑戦・気づきを綴るブログ。ランニング、ビジネス、海外生活など。', en: 'Daily chronicles of running, business, and life abroad by Massu.' },
    image: null as string | null,
    fallbackBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    fallbackText: 'まっすー',
    fallbackColor: '#ffffff',
  },
]

const FIXED_NAMES = FIXED_SALONS.map((s) => s.name)

export default async function Home() {
  const [lang, supabaseResult] = await Promise.all([
    getLang(),
    createServiceClient().then(s =>
      s.from('salons').select('id, name, description, hero_image_url').order('created_at')
    ),
  ])
  const { data: salons } = supabaseResult
  const dynamicSalons = (salons ?? []).filter((s) => !FIXED_NAMES.includes(s.name))

  const fixedWithImages = FIXED_SALONS.map((fs) => {
    const dbSalon = (salons ?? []).find((s) => s.name === fs.name)
    return { ...fs, image: dbSalon?.hero_image_url ?? null }
  })

  const T = lp

  return (
    <div className="min-h-screen bg-white text-[#111]">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Fumi</span>
          <nav className="flex items-center gap-7 text-sm">
            <a href="#how" className="hidden md:block text-[#888] hover:text-[#111] transition-colors">{tx(T.nav.how, lang)}</a>
            <a href="#channels" className="hidden md:block text-[#888] hover:text-[#111] transition-colors">{tx(T.nav.channels, lang)}</a>
            <Link href="/pricing" className="hidden md:block text-[#888] hover:text-[#111] transition-colors">{tx(T.nav.pricing, lang)}</Link>
            <Link href="/login" className="px-5 py-2.5 text-sm font-semibold bg-[#111] text-white hover:bg-[#333] transition-colors rounded-full">
              {tx(T.nav.start, lang)}
            </Link>
            <LanguageToggle lang={lang} />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-36 pb-28 px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.4em] uppercase text-[#AAA] mb-8">
            {tx(T.hero.label, lang)}
          </p>
          <h1 className="text-6xl sm:text-8xl font-bold leading-[1.0] tracking-[-0.03em] mb-8 max-w-4xl whitespace-pre-line text-[#111]">
            {tx(T.hero.title, lang)}
          </h1>
          <p className="text-lg text-[#888] leading-relaxed max-w-xl mb-12 whitespace-pre-line">
            {tx(T.hero.sub, lang)}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="px-8 py-4 text-sm font-semibold bg-[#111] text-white hover:bg-[#333] transition-colors rounded-full">
              {tx(T.hero.ctaTrial, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-t border-[#F0F0F0] bg-[#F8F8F8]">
        <div className="max-w-7xl mx-auto px-8 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#AAA] mb-4">{tx(T.how.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight text-[#111]">{tx(T.how.title, lang)}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {T.how.steps.map((item, i) => (
              <div key={item.step}>
                <div className="w-10 h-10 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center text-xs font-bold text-[#AAA] mb-6">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-bold text-[#111] mb-3">{tx(item.title, lang)}</h3>
                <p className="text-sm text-[#888] leading-relaxed">{tx(item.body, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For who ── */}
      <section className="border-t border-[#F0F0F0]">
        <div className="max-w-7xl mx-auto px-8 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#AAA] mb-4">{tx(T.forWho.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight text-[#111]">{tx(T.forWho.title, lang)}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {T.forWho.cards.map((card) => (
              <div key={card.label.ja} className="bg-[#F8F8F8] border border-[#EBEBEB] p-10 rounded-2xl">
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#BBB] mb-6">{tx(card.label, lang)}</p>
                <h3 className="text-xl font-bold text-[#111] mb-4 leading-snug">{tx(card.title, lang)}</h3>
                <p className="text-sm text-[#888] leading-relaxed mb-6">{tx(card.body, lang)}</p>
                <p className="text-xs text-[#BBB] leading-relaxed">{tx(card.examples, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-[#F0F0F0] bg-[#F8F8F8]">
        <div className="max-w-7xl mx-auto px-8 py-28">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#AAA] mb-4">{tx(T.channels.label, lang)}</p>
            <h2 className="text-4xl font-bold tracking-tight text-[#111]">{tx(T.channels.title, lang)}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fixedWithImages.map((salon) => (
              <Link key={salon.key} href={salon.href}
                className="group block rounded-2xl overflow-hidden border border-[#EBEBEB] bg-white hover:border-[#CCC] hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  {salon.image ? (
                    <Image src={salon.image} alt={salon.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: salon.fallbackBg }}>
                      <span className="font-bold text-2xl tracking-widest select-none" style={{ color: salon.fallbackColor }}>
                        {salon.fallbackText}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#BBB] mb-2">{tx(salon.tagline, lang)}</p>
                  <h3 className="text-sm font-bold text-[#111] leading-snug mb-2">{salon.name}</h3>
                  <p className="text-xs text-[#999] leading-relaxed line-clamp-2">{tx(salon.description, lang)}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#111]">
                    <span>{lang === 'ja' ? '詳しく見る' : 'Learn more'}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
            {dynamicSalons.map((salon, i) => {
              const bgs = ['linear-gradient(135deg,#1e1e2e,#2d2b55)', 'linear-gradient(135deg,#1a2035,#243050)', 'linear-gradient(135deg,#1e2a1e,#2a402a)']
              return (
                <Link key={salon.id} href={`/salon/${salon.id}`}
                  className="group block rounded-2xl overflow-hidden border border-[#EBEBEB] bg-white hover:border-[#CCC] hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 flex items-center justify-center" style={{ background: bgs[i % bgs.length] }}>
                    {salon.hero_image_url ? (
                      <Image src={salon.hero_image_url} alt={salon.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="font-bold text-3xl text-white/50 select-none">{salon.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-sm font-bold text-[#111] mb-2">{salon.name}</h3>
                    {salon.description && <p className="text-xs text-[#999] line-clamp-2">{salon.description}</p>}
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#111]">
                      <span>{lang === 'ja' ? '詳しく見る' : 'Learn more'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-[#111] text-white">
        <div className="max-w-7xl mx-auto px-8 py-32 text-center">
          <h2 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] mb-6">{tx(T.bottomCta.title, lang)}</h2>
          <p className="text-base text-white/40 mb-10">{tx(T.bottomCta.sub, lang)}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login" className="px-10 py-4 text-sm font-semibold bg-white text-[#111] hover:bg-[#F0F0F0] transition-colors rounded-full">
              {tx(T.bottomCta.button, lang)}
            </Link>
            <Link href="/pricing" className="px-10 py-4 text-sm font-semibold border border-white/20 text-white/60 hover:border-white/40 hover:text-white transition-colors rounded-full">
              {tx(T.nav.pricing, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111] text-white border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-bold block mb-1">Fumi</span>
            <span className="text-white/25 text-xs">{tx(T.footer.tagline, lang)}</span>
          </div>
          <div className="flex gap-8 text-sm text-white/40">
            <Link href="/login" className="hover:text-white transition-colors">{tx(T.footer.ownerLogin, lang)}</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">{tx(T.nav.pricing, lang)}</Link>
          </div>
          <span className="text-white/20 text-xs">© 2026 Fumi</span>
        </div>
      </footer>
    </div>
  )
}
