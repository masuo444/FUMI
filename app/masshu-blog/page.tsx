import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

const BLOG_URL = 'https://masu-blog.fomus.jp'


export default async function MasshuBlogPage() {
  const supabase = await createServiceClient()
  const { data: salon } = await supabase
    .from('salons')
    .select('hero_image_url')
    .eq('name', 'まっすー活動記')
    .maybeSingle()

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
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 relative flex gap-0">
          {/* Left: text */}
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-white/40 mb-5">Blog</p>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-4">
              まっすー活動記
            </h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg mb-10">
              日々の活動・挑戦・気づきを綴るブログ。ランニング・海外・ビジネスなど、様々なテーマで本音を発信。
            </p>
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              masu-blog.fomus.jp を開く →
            </a>
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
