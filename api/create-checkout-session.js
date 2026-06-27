import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { orderNumber, amount, description, email, origin } = req.body
    if (!orderNumber || !amount) return res.status(400).json({ error: '缺少參數' })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: 'hkd',
          product_data: { name: description || `訂單 ${orderNumber}` },
          unit_amount: Math.round(Number(amount) * 100), // HKD → 仙
        },
        quantity: 1,
      }],
      metadata: { order_number: orderNumber },          // ⭐ Webhook 靠呢個搵返單
      success_url: `${origin}/order-success?order=${orderNumber}`,
      cancel_url: `${origin}/checkout`,
    })

    res.status(200).json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}