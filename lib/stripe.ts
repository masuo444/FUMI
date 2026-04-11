import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function createCheckoutSession(params: {
  ownerId: string
  ownerEmail: string
  amountUsd: number  // in dollars, e.g. 10 for $10
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.ownerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(params.amountUsd * 100), // USD cents
          product_data: {
            name: 'Translation Credits',
            description: `$${params.amountUsd} credit top-up`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      owner_id: params.ownerId,
      type: 'translation_credit',
      amount_usd: String(params.amountUsd),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })
  return session.url!
}
