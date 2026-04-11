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

const MARQUEE_ITEMS = [
  'Newsletter', 'AI Translation', 'Multi-language', 'Global Delivery',
  'Members Only', 'Auto-translate', 'Newsletter', 'AI Translation',
  'Multi-language', 'Global Delivery', 'Members Only', 'Auto-translate',
]

const LANG_FLAGS = ['🇯🇵', '🇺🇸', '🇩🇪', '🇫🇷', '🇰🇷', '🇨🇳', '+12']

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
    <div className="min-h-screen bg-white text-[#0a0a0a]">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#ebebeb]">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 h-[62px] flex items-center justify-between">
          <span className="text-[15px] font-black tracking-[0.04em] text-[#0a0a0a]">Fumi</span>
          <nav className="flex items-center gap-7 text-[13px]">
            <a href="#how" className="hidden md:block text-[#aaa] hover:text-[#0a0a0a] transition-colors duration-200">
              {tx(T.nav.how, lang)}
            </a>
            <a href="#channels" className="hidden md:block text-[#aaa] hover:text-[#0a0a0a] transition-colors duration-200">
              {tx(T.nav.channels, lang)}
            </a>
            <Link href="/pricing" className="hidden md:block text-[#aaa] hover:text-[#0a0a0a] transition-colors duration-200">
              {tx(T.nav.pricing, lang)}
            </Link>
            <Link href="/login" className="text-[#aaa] hover:text-[#0a0a0a] transition-colors duration-200">
              {tx(T.nav.signin, lang)}
            </Link>
            <Link href="/login" className="px-5 py-2 text-[12px] font-bold bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors rounded-full">
              {tx(T.nav.start, lang)}
            </Link>
            <LanguageToggle lang={lang} />
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-[140px] pb-24 px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">

            {/* Left: text */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.6em] uppercase text-[#ccc] mb-10">
                {tx(T.hero.label, lang)}
              </p>
              <h1 className="text-[72px] sm:text-[100px] lg:text-[120px] font-black leading-[0.88] tracking-[-0.04em] text-[#0a0a0a] whitespace-pre-line mb-12">
                {tx(T.hero.title, lang)}
              </h1>
              <div className="border-t border-[#ebebeb] pt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
                <p className="text-[15px] text-[#777] leading-[1.85] max-w-[460px] whitespace-pre-line">
                  {tx(T.hero.sub, lang)}
                </p>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Link href="/login" className="px-7 py-3 text-[13px] font-semibold bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors rounded-full">
                    {tx(T.hero.ctaTrial, lang)}
                  </Link>
                  <Link href="/pricing" className="px-7 py-3 text-[13px] font-semibold border border-[#ddd] text-[#666] hover:border-[#999] hover:text-[#0a0a0a] transition-colors rounded-full">
                    {tx(T.nav.pricing, lang)}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: newsletter mockup */}
            <div className="hidden lg:flex flex-col gap-3">
              {/* Main newsletter card */}
              <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.08)]">
                {/* Email top bar */}
                <div className="bg-[#f7f7f7] border-b border-[#ebebeb] px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
                    <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
                    <div className="w-3 h-3 rounded-full bg-[#e0e0e0]" />
                  </div>
                  <div className="flex-1 bg-white border border-[#e8e8e8] rounded-full px-4 py-1 text-[10px] text-[#ccc]">
                    newsletter@fumi.app
                  </div>
                </div>
                {/* Email content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-[#0a0a0a] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-[11px] font-black">F</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#0a0a0a]">Fumi Newsletter</p>
                      <p className="text-[10px] text-[#aaa]">terroir HUB · Vol.24</p>
                    </div>
                    <span className="ml-auto text-[9px] bg-[#0a0a0a] text-white px-2.5 py-1 rounded-full font-semibold tracking-wide">EN</span>
                  </div>
                  {/* Article image placeholder */}
                  <div className="rounded-xl overflow-hidden mb-5 h-[120px]"
                    style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 40%, #3d2800 100%)' }}>
                    <div className="h-full flex items-end p-4">
                      <span className="text-[#d4a96a] font-black text-[22px] tracking-widest leading-none">terroir</span>
                    </div>
                  </div>
                  {/* Article title */}
                  <h4 className="text-[14px] font-bold text-[#0a0a0a] mb-3 leading-snug">
                    {lang === 'ja' ? '日本酒の発酵文化が世界を繋ぐ' : 'How Japanese Sake Bridges Cultures Worldwide'}
                  </h4>
                  <div className="space-y-2 mb-5">
                    <div className="h-[6px] bg-[#f2f2f2] rounded-full w-full" />
                    <div className="h-[6px] bg-[#f2f2f2] rounded-full w-[88%]" />
                    <div className="h-[6px] bg-[#f2f2f2] rounded-full w-[75%]" />
                  </div>
                  {/* Language badges */}
                  <div className="border-t border-[#f5f5f5] pt-4">
                    <p className="text-[9px] text-[#ccc] font-bold uppercase tracking-[0.3em] mb-2">
                      {lang === 'ja' ? '配信言語' : 'Delivered in'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {LANG_FLAGS.map((flag, i) => (
                        <span key={i} className="text-[11px] bg-[#f7f7f7] border border-[#eeeeee] rounded-full px-2 py-0.5 leading-none">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-widest font-semibold">
                    {lang === 'ja' ? '対応言語' : 'Languages'}
                  </p>
                  <p className="text-[22px] font-black text-white leading-none">24+</p>
                </div>
                <div className="bg-[#f7f7f7] border border-[#ebebeb] rounded-xl p-4">
                  <p className="text-[10px] text-[#ccc] mb-1 uppercase tracking-widest font-semibold">
                    {lang === 'ja' ? 'AI翻訳' : 'AI Translate'}
                  </p>
                  <p className="text-[22px] font-black text-[#0a0a0a] leading-none">Auto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="bg-[#0a0a0a] py-3.5 overflow-hidden">
        <div className="flex animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/25 px-5">{item}</span>
              <span className="text-white/10 text-[10px]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how" className="py-32 px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between pb-10 mb-16 border-b border-[#ebebeb]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#ccc] mb-3">
                {tx(T.how.label, lang)}
              </p>
              <h2 className="text-[34px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
                {tx(T.how.title, lang)}
              </h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#ebebeb]">
            {T.how.steps.map((item, i) => (
              <div key={item.step} className="px-0 sm:px-10 first:pl-0 last:pr-0 py-10 sm:py-0">
                {/* Visual icon area */}
                <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-6">
                  {i === 0 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 4h14M3 8h10M3 12h12M3 16h8" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {i === 1 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="#0a0a0a" strokeWidth="1.5"/>
                      <path d="M10 3c0 0-3 3-3 7s3 7 3 7M10 3c0 0 3 3 3 7s-3 7-3 7M3 10h14" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {i === 2 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="4" width="16" height="12" rx="2" stroke="#0a0a0a" strokeWidth="1.5"/>
                      <path d="M2 8h16" stroke="#0a0a0a" strokeWidth="1.5"/>
                      <path d="M6 12h4" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <p className="text-[72px] font-black text-[#f2f2f2] leading-none mb-4 tracking-tighter">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="text-[17px] font-bold text-[#0a0a0a] mb-3 tracking-tight">
                  {tx(item.title, lang)}
                </h3>
                <p className="text-[13px] text-[#888] leading-relaxed">
                  {tx(item.body, lang)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Translation visual strip ── */}
      <section className="bg-[#0a0a0a] py-20 px-8 lg:px-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
            <div>
              <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/30 mb-4">
                {lang === 'ja' ? 'AI翻訳テクノロジー' : 'AI Translation'}
              </p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.03em] leading-[0.92] mb-6">
                {lang === 'ja' ? '1記事が\n世界中の言語に。' : 'One article.\nEvery language.'}
              </h2>
              <p className="text-[14px] text-white/40 leading-relaxed max-w-md">
                {lang === 'ja'
                  ? 'Claude AIが記事のニュアンスを保ちながら24言語以上に自動翻訳。翻訳作業は一切不要です。'
                  : 'Claude AI auto-translates your content into 24+ languages while preserving tone and nuance. No manual translation needed.'}
              </p>
            </div>
            {/* Translation cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { flag: '🇯🇵', lang: '日本語', text: '日本酒は、米と水と麹で造られた芸術品です。' },
                { flag: '🇺🇸', lang: 'English', text: 'Sake is a work of art crafted from rice, water, and koji.' },
                { flag: '🇩🇪', lang: 'Deutsch', text: 'Sake ist ein Kunstwerk aus Reis, Wasser und Koji.' },
                { flag: '🇫🇷', lang: 'Français', text: 'Le saké est une œuvre d\'art à base de riz, d\'eau et de koji.' },
              ].map((item, i) => (
                <div key={i} className={`rounded-xl p-4 border ${i === 0 ? 'border-white/20 bg-white/10' : 'border-white/[0.08] bg-white/[0.04]'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[16px]">{item.flag}</span>
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">{item.lang}</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For Who ── */}
      <section className="bg-[#f7f7f7] border-t border-[#ebebeb] py-32 px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#ccc] mb-3">
              {tx(T.forWho.label, lang)}
            </p>
            <h2 className="text-[34px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
              {tx(T.forWho.title, lang)}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {T.forWho.cards.map((card, i) => (
              <div key={card.label.ja}
                className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden hover:border-[#d0d0d0] hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all duration-300">
                {/* Visual header */}
                <div className={`h-32 flex items-end p-6 ${i === 0
                  ? 'bg-gradient-to-br from-[#0a0a0a] to-[#222]'
                  : 'bg-gradient-to-br from-[#1a0f00] to-[#2d1a00]'
                }`}>
                  <p className="text-[10px] font-bold tracking-[0.45em] uppercase text-white/40">
                    {tx(card.label, lang)}
                  </p>
                </div>
                <div className="p-10">
                  <h3 className="text-[22px] font-bold text-[#0a0a0a] mb-4 leading-snug tracking-tight">
                    {tx(card.title, lang)}
                  </h3>
                  <p className="text-[13px] text-[#777] leading-relaxed mb-5">
                    {tx(card.body, lang)}
                  </p>
                  <p className="text-[11px] text-[#bbb] leading-relaxed border-t border-[#f0f0f0] pt-4">
                    {tx(card.examples, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section id="channels" className="border-t border-[#ebebeb] py-32 px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between pb-10 mb-16 border-b border-[#ebebeb]">
            <div>
              <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-[#ccc] mb-3">
                {tx(T.channels.label, lang)}
              </p>
              <h2 className="text-[34px] font-bold tracking-[-0.02em] text-[#0a0a0a]">
                {tx(T.channels.title, lang)}
              </h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {fixedWithImages.map((salon) => (
              <Link key={salon.key} href={salon.href}
                className="group block rounded-xl overflow-hidden border border-[#ebebeb] bg-white hover:border-[#ccc] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="relative h-52 overflow-hidden">
                  {salon.image ? (
                    <Image src={salon.image} alt={salon.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-end p-5" style={{ background: salon.fallbackBg }}>
                      <span className="font-black text-lg tracking-widest select-none" style={{ color: salon.fallbackColor }}>
                        {salon.fallbackText}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#ccc] mb-1.5">
                    {tx(salon.tagline, lang)}
                  </p>
                  <h3 className="text-[13px] font-bold text-[#0a0a0a] leading-snug mb-2">{salon.name}</h3>
                  <p className="text-[12px] text-[#aaa] leading-relaxed line-clamp-2">
                    {tx(salon.description, lang)}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#0a0a0a]">
                    <span>{lang === 'ja' ? '詳しく見る' : 'Learn more'}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
            {dynamicSalons.map((salon, i) => {
              const bgs = [
                'linear-gradient(135deg,#1e1e2e,#2d2b55)',
                'linear-gradient(135deg,#1a2035,#243050)',
                'linear-gradient(135deg,#1e2a1e,#2a402a)',
              ]
              return (
                <Link key={salon.id} href={`/salon/${salon.id}`}
                  className="group block rounded-xl overflow-hidden border border-[#ebebeb] bg-white hover:border-[#ccc] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
                  <div className="relative h-52 flex items-end p-5" style={{ background: bgs[i % bgs.length] }}>
                    {salon.hero_image_url ? (
                      <Image src={salon.hero_image_url} alt={salon.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="font-black text-xl text-white/30 select-none">{salon.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-[13px] font-bold text-[#0a0a0a] mb-2">{salon.name}</h3>
                    {salon.description && (
                      <p className="text-[12px] text-[#aaa] line-clamp-2">{salon.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#0a0a0a]">
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
      <section className="bg-[#0a0a0a] text-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-36 text-center">
          <p className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/25 mb-8">
            {tx(T.bottomCta.sub, lang)}
          </p>
          <h2 className="text-[52px] sm:text-[80px] font-black tracking-[-0.04em] leading-[0.9] mb-14 whitespace-pre-line">
            {tx(T.bottomCta.title, lang)}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="px-10 py-3.5 text-[13px] font-semibold bg-white text-[#0a0a0a] hover:bg-[#f0f0f0] transition-colors rounded-full">
              {tx(T.bottomCta.button, lang)}
            </Link>
            <Link href="/pricing" className="px-10 py-3.5 text-[13px] font-semibold border border-white/20 text-white/50 hover:border-white/50 hover:text-white transition-colors rounded-full">
              {tx(T.nav.pricing, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0a0a] border-t border-white/[0.06] text-white">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-black text-[15px] block mb-1">Fumi</span>
            <span className="text-white/25 text-[11px]">{tx(T.footer.tagline, lang)}</span>
          </div>
          <div className="flex gap-8 text-[12px] text-white/30">
            <Link href="/login" className="hover:text-white transition-colors">{tx(T.footer.ownerLogin, lang)}</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">{tx(T.nav.pricing, lang)}</Link>
          </div>
          <span className="text-white/20 text-[11px]">© 2026 Fumi</span>
        </div>
      </footer>

    </div>
  )
}
