// api/create-checkout-session.js
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ⭐ Service Role：可繞過 RLS。呢條 key 千祈唔好放落前端 / 唔好用 VITE_ 開頭
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderNumber, origin } = req.body || {}
    if (!orderNumber) return res.status(400).json({ error: '缺少 orderNumber' })

    // ⭐ 由 DB 讀返張單 — 完全唔信前端傳嘅 amount / description / email
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, amount, status, customer_email')
      .eq('order_number', orderNumber)
      .single()

    if (error || !order) return res.status(404).json({ error: '搵唔到訂單' })

    // 防止已付款 / 已處理嘅單再開 session
    if (order.status !== '待付款') {
      return res.status(400).json({ error: '此訂單狀態唔可以付款' })
    }

    const amount = Number(order.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: '訂單金額不正確' })
    }

    const safeOrigin = origin || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'hkd',
          product_data: { name: `CaseMod 訂單 ${order.order_number}` },
          unit_amount: Math.round(amount * 100),   // HKD → cents,用 DB 金額
        },
        quantity: 1,
      }],
      customer_email: order.customer_email || undefined,
      // ⭐ webhook 靠呢個 metadata 認返係邊張單
      metadata: { order_number: order.order_number, order_id: order.id },
      success_url: `${safeOrigin}/order-success?order=${order.order_number}`,
      cancel_url: `${safeOrigin}/checkout`,
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    console.error('create-checkout-session error:', e)
    return res.status(500).json({ error: e.message })
  }
}