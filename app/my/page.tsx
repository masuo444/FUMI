import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Salon = {
  id: string
  name: string
  description: string | null
  hero_image_url: string | null
}

export default async function MyPage() {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/my/login')

  const { data: memberships } = await supabase
    .from('members')
    .select('salon_id')
    .eq('email', user.email!)
    .eq('status', 'active')

  const salonIds = (memberships ?? []).map((m: { salon_id: string }) => m.salon_id)

  let salons: Salon[] = []
  if (salonIds.length > 0) {
    const { data } = await supabase
      .from('salons')
      .select('id, name, description, hero_image_url')
      .in('id', salonIds)
      .order('name')
    salons = data ?? []
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E0E0E0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight hover:opacity-70 transition-opacity">
            Fumi
          </Link>
          <span className="text-sm text-[#999] truncate max-w-[200px]">{user.email}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Page heading */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#999] mb-3">My Subscriptions</p>
          <h1 className="text-3xl font-bold tracking-tight mb-3">参加中のチャンネル</h1>
          <div className="w-8 h-[3px] bg-[#1A1A1A]" />
        </div>

        {salons.length === 0 ? (
          <div className="border border-[#E0E0E0] p-12 text-center">
            <p className="text-sm text-[#999] mb-6">まだ参加しているチャンネルはありません。</p>
            <Link
              href="/#salons"
              className="inline-block px-6 py-3 text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
            >
              チャンネルを探す →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E0E0E0] border-t border-[#E0E0E0]">
            {salons.map((salon) => (
              <Link
                key={salon.id}
                href={`/salon/${salon.id}`}
                className="group flex gap-6 sm:gap-10 py-8 items-center hover:bg-[#FAFAFA] transition-colors px-2 -mx-2"
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-[100px] h-[70px] sm:w-[160px] sm:h-[110px] overflow-hidden bg-[#F0F0F0] flex items-center justify-center">
                  {salon.hero_image_url ? (
                    <Image
                      src={salon.hero_image_url}
                      alt={salon.name}
                      width={160}
                      height={110}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[#CCC]">
                      {salon.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold mb-1 truncate">{salon.name}</h2>
                  {salon.description && (
                    <p className="text-sm text-[#666] leading-relaxed line-clamp-2 hidden sm:block">
                      {salon.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <span className="shrink-0 text-lg sm:text-xl font-light text-[#CCC] group-hover:text-[#1A1A1A] transition-colors">›</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] text-white mt-24">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-bold text-base">Fumi</span>
          <span className="text-white/30 text-xs">© 2026 Fumi. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
