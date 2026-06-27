// api/stripe-webhook.js
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook 簽名驗證失敗:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderNumber = session.metadata?.order_number
    const orderId = session.metadata?.order_id

    if (orderNumber) {
      // ⭐ orders 表確認有 status 欄位,值 待付款 → 已付款
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: '已付款' })
        .eq('order_number', orderNumber)
        .eq('status', '待付款')
      if (error) console.error('更新訂單失敗:', error.message)

      // ⭐ payments 欄位:method(唔係 payment_method)、reference_no、status、verified_at
      if (orderId) {
        const { error: pe } = await supabaseAdmin.from('payments').insert({
          order_id: orderId,
          method: 'Stripe',
          amount: (session.amount_total || 0) / 100,
          reference_no: session.payment_intent || session.id,
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        if (pe) console.error('寫付款記錄:', pe.message)
      }
    }
  }

  return res.status(200).json({ received: true })
}