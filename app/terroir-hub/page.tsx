import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

const FEATURES = [
  { label: '日本酒・焼酎・泡盛の蔵元情報', desc: '全国1,700以上の蔵元から生まれる銘酒と生産者の物語。' },
  { label: '海外市場への発信・輸出情報', desc: '欧米・アジアへの日本発酵文化の展開とビジネス動向。' },
  { label: 'ワイン・クラフトビールなど発酵全般', desc: '国境を越えた醸造文化を横断的に掘り下げる。' },
  { label: 'メンバー向け厳選メルマガ', desc: '業界の最新ニュースと深い考察を定期配信。' },
  { label: '蔵元・輸入業者・愛好家のネットワーク', desc: '生産者と消費者をつなぐグローバルコミュニティ。' },
  { label: 'テロワールで語る発酵文化', desc: '土地の個性が宿る醸造文化を、世界の視点で発信。' },
]

export default async function TerroirHubPage() {
  const supabase = await createServiceClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('id, invite_code, payment_url, hero_image_url')
    .eq('name', 'terroir HUB')
    .maybeSingle()

  const salonId = salon?.id
  const hasInviteCode = !!(salon as any)?.invite_code
  const paymentUrl = salon?.payment_url
  const heroImageUrl = (salon as any)?.hero_image_url ?? null

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-sm font-bold text-[#1A1A1A] hover:opacity-70 transition-opacity">
            ← Fumi
          </Link>
        </div>
      </header>

      {/* ── Hero + CTA ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a1200 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #d4a96a 0%, transparent 55%), radial-gradient(circle at 75% 25%, #8b5e2a 0%, transparent 50%)' }}
        />
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 relative flex gap-0">
          {/* Left: text */}
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase mb-5" style={{ color: 'rgba(212,169,106,0.6)' }}>
              Fermentation Culture Community
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-2">
              Terroir HUB
            </h1>
            <p className="text-lg text-white/40 font-medium mb-4">テロワールハブ</p>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg mb-10">
              日本酒・焼酎・ワインなど発酵文化を世界に届けるグローバルコミュニティ。生産者・愛好家・バイヤーが集まるプラットフォーム。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://terroirhub.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                テロワールハブ公式サイト →
              </a>
            </div>
          </div>
          {/* Right: hero image */}
          {heroImageUrl && (
            <div className="hidden sm:block w-[380px] lg:w-[460px] shrink-0 -my-16 sm:-my-20 -mr-6 relative overflow-hidden">
              <img
                src={heroImageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-14 pb-20">
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-tight mb-3">コミュニティが届けるもの</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 divide-y sm:divide-y-0 divide-[#E0E0E0] border-t border-[#E0E0E0]">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`flex gap-3 py-5 items-start ${i % 2 === 1 ? 'sm:border-l sm:border-[#E0E0E0] sm:pl-12' : ''} ${i >= 2 ? 'sm:border-t sm:border-[#E0E0E0]' : ''}`}
            >
              <span className="text-lg font-bold leading-none mt-0.5 shrink-0" style={{ color: '#d4a96a' }}>›</span>
              <div>
                <h3 className="font-bold text-sm text-[#1A1A1A] mb-0.5">{f.label}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111111] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">← トップに戻る</Link>
          <span className="text-sm font-bold text-white">Fumi</span>
        </div>
      </footer>
    </div>
  )
}
