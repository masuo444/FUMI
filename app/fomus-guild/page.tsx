import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

const FEATURES = [
  { label: 'グローバルビジネス最前線', desc: '海外展開・越境ビジネスの実践情報と事例を厳選配信。' },
  { label: 'クリエイターの実践ノウハウ', desc: 'コンテンツ制作・ブランディング・収益化の具体的メソッド。' },
  { label: 'メンバー同士のコラボレーション', desc: '招待制ならではの深い繋がりとビジネスチャンス。' },
  { label: '厳選メルマガ定期配信', desc: '価値ある情報だけを凝縮してお届けするニュースレター。' },
  { label: '完全非公開のプライベート空間', desc: '招待制・クローズドだからこそ話せる本音の議論。' },
  { label: 'ビジネス・クリエイティブ・グローバル', desc: '3つのテーマを軸に、本質的な情報と繋がりを提供。' },
]

export default async function FomusGuildPage() {
  const supabase = await createServiceClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('id, invite_code, payment_url, hero_image_url')
    .eq('name', 'FOMUS GUILD')
    .maybeSingle()

  const salonId = salon?.id
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
        style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1208 50%, #2a1f00 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #c9a227 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b6914 0%, transparent 50%)' }}
        />
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 relative flex gap-0">
          {/* Left: text */}
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-amber-400/60 mb-5">Private Guild</p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-4">
              FOMUS GUILD
            </h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg mb-10">
              FOMUSが運営する招待制プライベートコミュニティ。グローバル・ビジネス・クリエイティブの本質的な情報を届ける。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://guild-app.fomusglobal.com/invite/4UJQVV3K"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                ギルドメンバーになる →
              </a>
              <a
                href="https://guild-app.fomusglobal.com/auth/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white text-sm font-semibold hover:border-white/50 transition-colors"
              >
                会員の方はこちら
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
          <h2 className="text-xl font-bold tracking-tight mb-3">GUILDが届けるもの</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 divide-y sm:divide-y-0 divide-[#E0E0E0] border-t border-[#E0E0E0]">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`flex gap-3 py-5 items-start ${i % 2 === 1 ? 'sm:border-l sm:border-[#E0E0E0] sm:pl-12' : ''} ${i >= 2 ? 'sm:border-t sm:border-[#E0E0E0]' : ''}`}
            >
              <span className="text-lg font-bold leading-none mt-0.5 shrink-0" style={{ color: '#c9a227' }}>›</span>
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
