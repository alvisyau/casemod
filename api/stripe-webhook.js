import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = { api: { bodyParser: false } }

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const orderNumber = event.data.object.metadata?.order_number
    if (orderNumber) {
      await supabase.from('orders').update({ status: '已付款' }).eq('order_number', orderNumber)
      // 如果你想埋 payments 表寫一筆,可以喺度做
    }
  }

  res.status(200).json({ received: true })
}