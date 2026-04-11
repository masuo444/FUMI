import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

const FEATURES = [
  { label: 'トレーニング・レース記録のシェア', desc: 'GPSデータとともに走りを可視化。仲間の記録から刺激をもらう。' },
  { label: 'ルート・コース情報', desc: '世界各地のランニングコース・おすすめルートをコミュニティで共有。' },
  { label: 'ウォッチ・ギアの最新レビュー', desc: 'GPS機器・シューズ・アパレルの実使用レビューを集約。' },
  { label: '海外レース・大会情報', desc: 'ボストン、東京、シカゴなど主要レースの参加レポートと攻略情報。' },
  { label: 'データドリブンなトレーニング分析', desc: 'VO2max・ペース・心拍数など数値で語るスマートな練習メソッド。' },
  { label: '会員限定メルマガ配信', desc: 'トレーニング理論・レース攻略・ギア情報を定期配信。' },
]

export default async function GpsRunnerPage() {
  const supabase = await createServiceClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('id, hero_image_url')
    .eq('name', 'GPS RUNNER SUPPORTERS')
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
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 60%, #0a3322 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute left-0 right-0 h-px bg-white" style={{ bottom: `${i * 16}px` }} />
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 relative flex gap-0">
          {/* Left: text */}
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-emerald-400/60 mb-5">Running Community</p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-1">
              GPS RUNNER
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-emerald-300/60 tracking-wider mb-4">SUPPORTERS</p>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg mb-10">
              GPSウォッチを身につけて走る仲間たちのサポーターコミュニティ。世界中のランナーと記録・知識・モチベーションをシェア。
            </p>
            {salonId && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/salon/${salonId}/login`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  会員ログイン →
                </Link>
                <a
                  href="https://official.gps-run.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white text-sm font-semibold hover:border-white/50 transition-colors"
                >
                  入会はこちら →
                </a>
              </div>
            )}
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
          <h2 className="text-xl font-bold tracking-tight mb-3">コミュニティで得られるもの</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 divide-y sm:divide-y-0 divide-[#E0E0E0] border-t border-[#E0E0E0]">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`flex gap-3 py-5 items-start ${i % 2 === 1 ? 'sm:border-l sm:border-[#E0E0E0] sm:pl-12' : ''} ${i >= 2 ? 'sm:border-t sm:border-[#E0E0E0]' : ''}`}
            >
              <span className="text-lg font-bold leading-none mt-0.5 shrink-0 text-emerald-600">›</span>
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
