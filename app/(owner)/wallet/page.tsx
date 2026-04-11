import { requireOwner } from '@/lib/auth'
import { getLang } from '@/lib/lang'
import { owner as O, tx } from '@/lib/i18n'
import { WalletClient } from '@/components/owner/WalletClient'
import { Alert } from '@/components/ui/Alert'

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ charged?: string }>
}) {
  const { charged } = await searchParams
  const [{ owner, supabase }, lang] = await Promise.all([requireOwner(), getLang()])

  const [{ data: wallet }, { data: transactions }] = await Promise.all([
    supabase.from('owner_wallets').select('*').eq('owner_id', owner.id).single(),
    supabase
      .from('wallet_transactions')
      .select('*')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{tx(O.wallet.title, lang)}</h1>
      {charged === '1' && (
        <Alert variant="success" className="mb-6">{tx(O.wallet.charged, lang)}</Alert>
      )}
      <WalletClient
        balance={wallet?.balance ?? 0}
        transactions={transactions ?? []}
      />
    </div>
  )
}
