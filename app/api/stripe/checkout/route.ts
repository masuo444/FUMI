import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { MIN_CHARGE_AMOUNT_USD } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners').select('*').eq('email', user.email!).single()
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const { amount } = await request.json() // amount in USD dollars
  if (!amount || amount < MIN_CHARGE_AMOUNT_USD) {
    return NextResponse.json({ error: `Minimum top-up is $${MIN_CHARGE_AMOUNT_USD}` }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = await createCheckoutSession({
    ownerId: owner.id,
    ownerEmail: owner.email,
    amountUsd: amount,
    successUrl: `${appUrl}/wallet?charged=1`,
    cancelUrl: `${appUrl}/wallet`,
  })

  return NextResponse.json({ url })
}
