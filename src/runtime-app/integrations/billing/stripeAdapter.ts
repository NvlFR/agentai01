import Stripe from 'stripe'

export type StripeClient = {
  checkout: {
    sessions: {
      create: (input: {
        mode: 'payment'
        success_url: string
        cancel_url: string
        customer_email: string
        line_items: Array<{
          price_data: {
            currency: string
            product_data: { name: string }
            unit_amount: number
          }
          quantity: number
        }>
      }) => Promise<{ id: string }>
    }
  }
}

export function createStripeAdapter(apiKey: string | undefined, client?: StripeClient): {
  enabled: boolean
  createCheckoutSession: (customerEmail: string) => Promise<string>
} {
  const sdk = client ?? (apiKey ? new Stripe(apiKey) : undefined)

  return {
    enabled: sdk !== undefined,
    async createCheckoutSession(customerEmail) {
      if (!sdk) {
        throw new Error('Stripe integration is not configured')
      }

      const session = await sdk.checkout.sessions.create({
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_email: customerEmail,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Runtime operator seat' },
            unit_amount: 1000,
          },
          quantity: 1,
        }],
      })

      return session.id
    },
  }
}
