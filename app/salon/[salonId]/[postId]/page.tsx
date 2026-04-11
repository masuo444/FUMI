import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PostDetail } from '@/components/salon/PostDetail'

async function getMember(salonId: string, email: string) {
  const service = await createServiceClient()
  const { data } = await service
    .from('members')
    .select('id')
    .eq('salon_id', salonId)
    .eq('email', email)
    .eq('status', 'active')
    .maybeSingle()
  return data
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ salonId: string; postId: string }>
}) {
  const { salonId, postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const member = user?.email ? await getMember(salonId, user.email) : null

  const [{ data: post }, { data: salon }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, post_translations(*), post_images(*)')
      .eq('id', postId)
      .eq('salon_id', salonId)
      .eq('status', 'published')
      .single(),
    supabase.from('salons').select('id, name, payment_url').eq('id', salonId).single(),
  ])

  if (!post || !salon) notFound()
  if (!user) redirect(`/salon/${salonId}/login`)
  if (!member) redirect(`/salon/${salonId}`)

  const translations = (post.post_translations as any[]) ?? []
  const images = (post.post_images as any[]) ?? []

  const coverTitle =
    translations.find((t) => t.language_code === 'ja')?.title ??
    translations.find((t) => t.language_code === 'en')?.title ??
    ''

  const bodyText =
    translations.find((t) => t.language_code === 'ja')?.body ??
    translations.find((t) => t.language_code === 'en')?.body ??
    ''
  const readingMinutes = Math.max(1, Math.ceil(bodyText.length / 400))

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={`/salon/${salonId}`}
            className="flex items-center gap-2 text-sm text-[#666] hover:text-[#1A1A1A] transition-colors"
          >
            ← <span className="hidden sm:inline">{salon.name}</span><span className="sm:hidden">戻る</span>
          </Link>
          <span className="text-sm font-bold text-[#1A1A1A]">Fumi</span>
        </div>
      </header>

      {/* ── Cover image ── */}
      {post.cover_image_url && (
        <div className="relative w-full overflow-hidden bg-[#F0F0F0]" style={{ height: 'clamp(240px, 45vw, 560px)' }}>
          <Image
            src={post.cover_image_url}
            alt={coverTitle}
            fill
            className="object-cover"
            priority
          />
          {/* Subtle bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
        </div>
      )}

      {/* ── Article ── */}
      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="max-w-[720px]">
          {/* Breadcrumb + meta */}
          <div className="flex items-center gap-3 text-xs text-[#999] mb-6">
            <Link href={`/salon/${salonId}`} className="hover:text-[#1A1A1A] transition-colors">
              {salon.name}
            </Link>
            <span>/</span>
            <span>記事</span>
            <span className="ml-auto">読了 {readingMinutes} 分</span>
          </div>

          <div className="mb-10 pb-8 border-b border-[#E0E0E0]">
            <p className="text-xs text-[#999] mb-2">
              {new Date(post.published_at ?? post.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          <PostDetail
            translations={translations}
            publishedAt={post.published_at ?? post.created_at}
            images={images}
            salonPaymentUrl={salon.payment_url}
            isMember={true}
            salonId={salonId}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#111111] text-white mt-20">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          <Link href={`/salon/${salonId}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ← {salon.name}
          </Link>
          <span className="text-sm font-bold">Fumi</span>
        </div>
      </footer>
    </div>
  )
}
