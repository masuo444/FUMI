import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { estimateTranslationCost } from '@/lib/claude'
import { TranslationEstimate } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body } = await request.json()
  const text = (title ?? '') + (body ?? '')
  const cost = estimateTranslationCost(text)

  const { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { data: wallet } = await supabase
    .from('owner_wallets')
    .select('balance')
    .eq('owner_id', owner.id)
    .single()

  const balance = wallet?.balance ?? 0

  const result: TranslationEstimate = {
    estimated_chars: text.length,
    estimated_cost_jpy: cost,
    sufficient_balance: balance >= cost,
    current_balance: balance,
  }

  return NextResponse.json(result)
}
