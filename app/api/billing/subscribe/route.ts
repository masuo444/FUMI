import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: owner } = await supabase
    .from('owners')
    .select('id, email, stripe_customer_id')
    .eq('email', user.email!)
    .single()
  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Stripe Customer を作成 or 再利用
  let customerId = owner.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: owner.email, metadata: { owner_id: owner.id } })
    customerId = customer.id
    await supabase.from('owners').update({ stripe_customer_id: customerId }).eq('id', owner.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          unit_amount: 1000,
          product_data: {
            name: 'Fumi Pro',
            description: 'Unlimited members · Stripe integration · Multi-language delivery',
          },
        },
        quantity: 1,
      },
    ],
    metadata: { owner_id: owner.id, type: 'pro_subscription' },
    success_url: `${appUrl}/billing?upgraded=1`,
    cancel_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
