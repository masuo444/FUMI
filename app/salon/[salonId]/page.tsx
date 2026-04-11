import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { SignOutButton } from '@/components/salon/SignOutButton'

async function getMember(salonId: string, email: string) {
  const service = await createServiceClient()
  const { data } = await service
    .from('members')
    .select('id, name')
    .eq('salon_id', salonId)
    .eq('email', email)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

export default async function SalonPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const member = user?.email ? await getMember(salonId, user.email) : null

  const { data: salon } = await supabase
    .from('salons')
    .select('*, owners(name)')
    .eq('id', salonId)
    .single()

  if (!salon) notFound()

  if (!user) return <SalonGate salon={salon} reason="login" salonId={salonId} />
  if (!member) return <SalonGate salon={salon} reason="not_member" salonId={salonId} />

  const { data: posts } = await supabase
    .from('posts')
    .select('id, cover_image_url, published_at, created_at, post_translations(language_code, title, body)')
    .eq('salon_id', salonId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const accent = (salon as any).theme_color ?? '#4F6AF5'

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-[#1A1A1A] hover:opacity-70 transition-opacity">
            Fumi
          </Link>
          <div className="flex items-center gap-4">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: `${accent}18`, color: accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: accent }} />
              会員
            </span>
            <span className="text-xs text-[#999] hidden md:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-white/40 mb-6">
            Membership Salon
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            {salon.name}
          </h1>
          {salon.description && (
            <p className="text-sm text-white/50 leading-relaxed max-w-md mb-6">
              {salon.description}
            </p>
          )}
          <p className="text-xs text-white/30">
            by <span className="text-white/50 font-medium">{(salon.owners as any)?.name}</span>
          </p>
          {salon.payment_url && (
            <a
              href={salon.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-[#111111] transition-all"
            >
              会員登録・決済はこちら →
            </a>
          )}
        </div>
      </section>

      {/* ── Article list ── */}
      <main className="max-w-6xl mx-auto px-6 py-14 pb-24">
        <div className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-3">記事一覧</h2>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>

        {(posts ?? []).length === 0 && (
          <p className="py-24 text-sm text-[#999]">まだ記事がありません</p>
        )}

        <div className="divide-y divide-[#E0E0E0] border-t border-[#E0E0E0]">
          {(posts ?? []).map((post) => {
            const translations = (post.post_translations as any[]) ?? []
            const t =
              translations.find((t) => t.language_code === 'ja') ??
              translations.find((t) => t.language_code === 'en')
            const title = t?.title ?? '(無題)'
            const excerpt = t?.body
              ? t.body.replace(/\n/g, ' ').slice(0, 130) + (t.body.length > 130 ? '…' : '')
              : null

            return (
              <Link
                key={post.id}
                href={`/salon/${salonId}/${post.id}`}
                className="group flex gap-6 sm:gap-10 py-10 items-start hover:bg-[#FAFAFA] transition-colors px-2 -mx-2"
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-[120px] h-[90px] sm:w-[200px] sm:h-[150px] rounded-xl overflow-hidden bg-[#F0F0F0] border border-[#E0E0E0]">
                  {post.cover_image_url ? (
                    <Image
                      src={post.cover_image_url}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `${accent}12` }}
                    >
                      <span className="text-4xl font-bold select-none" style={{ color: `${accent}50` }}>
                        {title.slice(0, 1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-1 min-w-0 pt-1">
                  <div>
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xl font-bold leading-none mt-0.5 shrink-0" style={{ color: accent }}>›</span>
                      <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] leading-snug tracking-tight group-hover:underline underline-offset-2">
                        {title}
                      </h3>
                    </div>
                    {excerpt && (
                      <p className="text-sm text-[#666] leading-relaxed line-clamp-2 mb-4">
                        {excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#999]">
                      {formatDate(post.published_at ?? post.created_at)}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: accent }}>
                      記事を読む →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold hover:opacity-70 transition-opacity">Fumi</Link>
          <span className="text-white/30 text-xs">© 2026 Fumi</span>
        </div>
      </footer>
    </div>
  )
}

// ── Gate ──────────────────────────────────────────────────────────────────
function SalonGate({
  salon,
  reason,
  salonId,
}: {
  salon: { name: string; description: string | null; payment_url: string | null; invite_code: string | null }
  reason: 'login' | 'not_member'
  salonId: string
}) {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      <header className="border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-sm font-bold hover:opacity-70 transition-opacity">Fumi</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-white/40 mb-6">Membership Salon</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{salon.name}</h1>
          {salon.description && (
            <p className="text-sm text-white/50 leading-relaxed max-w-md">{salon.description}</p>
          )}
        </div>
      </section>

      {/* Gate card */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">
              {reason === 'login' ? '会員ログインが必要です' : 'このサロンの会員ではありません'}
            </h2>
            <div className="w-8 h-[3px] bg-[#1A1A1A]" />
          </div>

          <p className="text-sm text-[#666] leading-relaxed mb-8">
            {reason === 'login'
              ? 'このサロンのコンテンツは会員限定です。登録済みのメールアドレスでログインしてください。'
              : '会員登録後にログインしてご利用ください。'}
          </p>

          <div className="flex flex-col gap-3">
            {reason === 'login' ? (
              <>
                <Link
                  href={`/salon/${salonId}/login`}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
                >
                  会員ログイン →
                </Link>
                {salon.invite_code && (
                  <Link
                    href={`/salon/${salonId}/join`}
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold border border-[#E0E0E0] text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                  >
                    招待コードで入会
                  </Link>
                )}
                {!salon.invite_code && salon.payment_url && (
                  <a
                    href={salon.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold border border-[#E0E0E0] text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                  >
                    会員登録はこちら →
                  </a>
                )}
              </>
            ) : (
              <>
                {salon.invite_code && (
                  <Link
                    href={`/salon/${salonId}/join`}
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
                  >
                    招待コードで入会 →
                  </Link>
                )}
                {!salon.invite_code && salon.payment_url && (
                  <a
                    href={salon.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
                  >
                    会員登録はこちら →
                  </a>
                )}
                <Link
                  href={`/salon/${salonId}/login`}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 text-sm font-semibold border border-[#E0E0E0] text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                >
                  別のアカウントでログイン
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-xs text-[#999]">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">← プラットフォームトップへ</Link>
          </p>
        </div>
      </div>

      <footer className="bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          <span className="text-sm font-bold">Fumi</span>
          <span className="text-white/30 text-xs">© 2026 Fumi</span>
        </div>
      </footer>
    </div>
  )
}
