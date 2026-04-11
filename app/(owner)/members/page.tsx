import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { owner as O, tx } from '@/lib/i18n'
import { MembersClient } from '@/components/owner/MembersClient'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ salon?: string }>
}) {
  const { salon: defaultSalonId } = await searchParams
  const [{ owner, service }, lang] = await Promise.all([requireOwner(), getLang()])

  const { getAccessibleSalonIds } = await import('@/lib/salon-access')
  const accessibleIds = await getAccessibleSalonIds(service, owner.id)

  let salons: { id: string; name: string }[] = []
  if (accessibleIds.length > 0) {
    const { data } = await service
      .from('salons')
      .select('id, name')
      .in('id', accessibleIds)
      .order('created_at')
    salons = data ?? []
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{tx(O.members.title, lang)}</h1>
      <MembersClient salons={salons ?? []} defaultSalonId={defaultSalonId} />
    </div>
  )
}
