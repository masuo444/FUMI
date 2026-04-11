import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { owner as O, tx } from '@/lib/i18n'
import { SalonSettingsClient } from '@/components/owner/SalonSettingsClient'
import { getAccessibleSalonIds } from '@/lib/salon-access'

export default async function SettingsPage() {
  const [{ owner, service, user }, lang] = await Promise.all([requireOwner(), getLang()])

  const accessibleIds = await getAccessibleSalonIds(service, owner.id)

  let allSalons: any[] = []
  if (accessibleIds.length > 0) {
    const { data } = await service
      .from('salons')
      .select('*')
      .in('id', accessibleIds)
      .order('created_at')
    allSalons = data ?? []
  }

  // 主オーナーのサロン（設定変更・管理者管理が可能）
  const { data: ownedSalons } = await service
    .from('salons')
    .select('id')
    .eq('owner_id', owner.id)
  const ownedIds = new Set((ownedSalons ?? []).map((s: any) => s.id as string))

  // 各サロンの管理者情報（主オーナーのサロンのみ取得）
  const adminDataMap: Record<string, {
    isPrimaryOwner: boolean
    admins: { email: string; name: string; role: 'primary' | 'co-admin' }[]
    pendingInvites: string[]
  }> = {}

  for (const salon of allSalons) {
    if (ownedIds.has(salon.id)) {
      const [adminsResult, invitesResult] = await Promise.all([
        service
          .from('salon_admins')
          .select('owner_id, owners(email, name)')
          .eq('salon_id', salon.id),
        service
          .from('salon_admin_invites')
          .select('email')
          .eq('salon_id', salon.id),
      ])
      adminDataMap[salon.id] = {
        isPrimaryOwner: true,
        admins: [
          { email: user.email!, name: user.email!.split('@')[0], role: 'primary' },
          ...(adminsResult.data ?? []).map((a: any) => ({
            email: a.owners?.email ?? '',
            name: a.owners?.name ?? '',
            role: 'co-admin' as const,
          })),
        ],
        pendingInvites: (invitesResult.data ?? []).map((i: any) => i.email as string),
      }
    } else {
      adminDataMap[salon.id] = {
        isPrimaryOwner: false,
        admins: [],
        pendingInvites: [],
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{tx(O.settings.title, lang)}</h1>
      <p className="text-sm text-gray-500 mb-8">{tx(O.settings.sub, lang)}</p>
      <SalonSettingsClient
        initialSalons={allSalons}
        adminDataMap={adminDataMap}
        currentUserEmail={user.email!}
      />
    </div>
  )
}
