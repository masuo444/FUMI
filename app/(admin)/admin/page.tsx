import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminPage() {
  const { service } = await requireAdmin()

  // 全オーナー + サロン + 統計を一括取得
  const { data: owners } = await service
    .from('owners')
    .select('id, name, email, created_at')
    .order('created_at')

  const { data: salons } = await service
    .from('salons')
    .select('id, owner_id, name, description, created_at')
    .order('created_at')

  const { data: memberCounts } = await service
    .from('members')
    .select('salon_id')
    .eq('status', 'active')

  const { data: postCounts } = await service
    .from('posts')
    .select('salon_id, status')

  const { data: wallets } = await service
    .from('owner_wallets')
    .select('owner_id, balance')

  // index
  const memberCountBySalon: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    memberCountBySalon[m.salon_id] = (memberCountBySalon[m.salon_id] ?? 0) + 1
  }
  const postCountBySalon: Record<string, number> = {}
  const publishedCountBySalon: Record<string, number> = {}
  for (const p of postCounts ?? []) {
    postCountBySalon[p.salon_id] = (postCountBySalon[p.salon_id] ?? 0) + 1
    if (p.status === 'published') {
      publishedCountBySalon[p.salon_id] = (publishedCountBySalon[p.salon_id] ?? 0) + 1
    }
  }
  const balanceByOwner: Record<string, number> = {}
  for (const w of wallets ?? []) balanceByOwner[w.owner_id] = w.balance

  const salonsByOwner: Record<string, typeof salons> = {}
  for (const s of salons ?? []) {
    if (!salonsByOwner[s.owner_id]) salonsByOwner[s.owner_id] = []
    salonsByOwner[s.owner_id]!.push(s)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">全オーナー管理</h1>

      <div className="flex flex-col gap-8">
        {(owners ?? []).map((owner) => (
          <section key={owner.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Owner header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{owner.name}</p>
                <p className="text-sm text-gray-500">{owner.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">翻訳残高</p>
                <p className="font-semibold text-gray-900">
                  ¥{(balanceByOwner[owner.id] ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Salons */}
            <div className="divide-y divide-gray-100">
              {(salonsByOwner[owner.id] ?? []).length === 0 && (
                <p className="px-6 py-4 text-sm text-gray-400">サロンなし</p>
              )}
              {(salonsByOwner[owner.id] ?? []).map((salon) => (
                <div key={salon.id} className="px-6 py-4 flex items-center gap-6">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{salon.name}</p>
                    {salon.description && (
                      <p className="text-sm text-gray-400 truncate max-w-sm">{salon.description}</p>
                    )}
                  </div>

                  <div className="flex gap-6 text-center text-sm">
                    <div>
                      <p className="text-gray-400">会員</p>
                      <p className="font-semibold">{memberCountBySalon[salon.id] ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">記事（公開）</p>
                      <p className="font-semibold">
                        {publishedCountBySalon[salon.id] ?? 0}
                        <span className="text-gray-400 font-normal">/{postCountBySalon[salon.id] ?? 0}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/salon/${salon.id}`}
                      target="_blank"
                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      ユーザー画面
                    </Link>
                    <Link
                      href={`/admin/salons/${salon.id}`}
                      className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      管理
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
