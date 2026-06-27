// api/stripe-webhook.js
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ⭐ webhook 簽名驗證一定要用 raw body,唔可以畀人 parse 咗
export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

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

  // 只處理付款成功
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderNumber = session.metadata?.order_number
    const orderId = session.metadata?.order_id

    if (orderNumber) {
      // ⭐ 唯一改訂單狀態嘅地方。.eq('status','待付款') 令重複 webhook 都安全(idempotent)
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: '已付款' })
        .eq('order_number', orderNumber)
        .eq('status', '待付款')
      if (error) console.error('更新訂單失敗:', error.message)

      // (可選)寫一筆付款記錄,方便後台核對
      if (orderId) {
        await supabaseAdmin.from('payments').insert({
          order_id: orderId,
          payment_method: 'Stripe',
          status: 'verified',
          verified_at: new Date().toISOString(),
          // stripe_session_id: session.id,  // 若你 payments 表有呢欄,加上去做去重更穩
        }).then(({ error: pe }) => { if (pe) console.error('寫付款記錄:', pe.message) })
      }
    }
  }

  // 一定要快回 200,否則 Stripe 會不停重試
  return res.status(200).json({ received: true })
}