import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'

const WHATSAPP_NUMBER = '85266988317'

function Checkout() {
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('香港')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // 購物車空 → 趕返去
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-400">購物車係空嘅,無法結帳。</p>
        <Link to="/collection" className="text-sm underline mt-4 inline-block">去睇現成系列</Link>
      </div>
    )
  }

  // 總共慳咗(只計有特價嘅商品)
  const totalSaved = items.reduce((sum, it) => {
    if (it.originalPrice) return sum + (it.originalPrice - it.unitPrice) * it.quantity
    return sum
  }, 0)

  async function handleCheckout() {
    if (!name.trim()) return alert('請填寫姓名')
    if (!phone.trim()) return alert('請填寫聯絡電話')
    if (!address.trim()) return alert('請填寫收件地址')

    setSubmitting(true)

    // 自己生成 id,唔使 insert 後再 query
    const orderId = crypto.randomUUID()

    const d = new Date()
    const orderNumber =
      'CM' +
      d.getFullYear().toString().slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      Math.floor(1000 + Math.random() * 9000)

    // 單頭嘅 phone_model 綜合描述(NOT NULL 要填)
    const phoneSummary = items
      .map((it) => `${it.phoneModel}×${it.quantity}`)
      .join(', ')

    // ① 寫入 orders(單頭)
    const { error: orderErr } = await supabase.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      phone_model: phoneSummary,
      case_type: '現成系列',
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim(),
      region: region,
      currency: 'HKD',
      amount: totalAmount,
      payment_method: 'WhatsApp',
      note: note.trim() || null,
    })

    if (orderErr) {
      setSubmitting(false)
      console.error(orderErr)
      return alert('落單失敗(單頭):\n' + orderErr.message)
    }

    // ② 寫入 order_items(逐件)
    const itemsPayload = items.map((it) => ({
      order_id: orderId,
      design_id: it.designId,
      design_name: it.designName,
      collection: it.collection,
      phone_model: it.phoneModel,
      unit_price: it.unitPrice,
      original_price: it.originalPrice ?? null,   // ← 記低原價(冇特價就 null)
      quantity: it.quantity,
    }))

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)

    if (itemsErr) {
      setSubmitting(false)
      console.error(itemsErr)
      return alert('落單失敗(項目):\n' + itemsErr.message)
    }

    // ②.5 扣庫存(只扣有追蹤庫存嘅產品;null 會喺 SQL 跳過)
    for (const it of items) {
      const { error: stockErr } = await supabase.rpc('decrement_stock', {
        p_design_id: it.designId,
        p_qty: it.quantity,
      })
      if (stockErr) console.error('扣庫存失敗', it.designId, stockErr.message)
    }

    // ③ WhatsApp 通知商家
    const lines = items
      .map((it) => {
        const saleTag = it.originalPrice ? `(特價 原價HK$${it.originalPrice})` : ''
        return `• ${it.designName}(${it.collection})/ ${it.phoneModel} ×${it.quantity} = HK$${it.unitPrice * it.quantity}${saleTag}`
      })
      .join('\n')

    const msg =
      `【新訂單 ${orderNumber}】\n` +
      `${lines}\n` +
      `------------------\n` +
      (totalSaved > 0 ? `特價優惠:− HK$${totalSaved}\n` : '') +
      `總計:HK$${totalAmount}\n` +
      `姓名:${name.trim()}\n` +
      `電話:${phone.trim()}\n` +
      `地區:${region}\n` +
      `地址:${address.trim()}` +
      (note.trim() ? `\n備註:${note.trim()}` : '')

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )

    // ④ 清空購物車 + 去完成頁
    clearCart()
    setSubmitting(false)
    navigate('/order-success', { state: { orderNumber } })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/cart" className="text-sm text-gray-400 hover:text-gray-700 transition">
        ← 返回購物車
      </Link>

      <h1 className="text-2xl font-bold mt-6 mb-8">結帳</h1>

      <div className="grid md:grid-cols-5 gap-10">
        {/* 左:收件資料 */}
        <div className="md:col-span-3 space-y-4">
          <h2 className="font-medium text-sm text-gray-500">收件資料</h2>

          <div>
            <label className="block text-sm font-medium mb-2">姓名 <span className="text-red-400">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="收件人姓名" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">聯絡電話 <span className="text-red-400">*</span></label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="例如 9123 4567" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">地區</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
              <option value="香港">香港</option>
              <option value="澳門">澳門</option>
              <option value="台灣">台灣</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">收件地址 <span className="text-red-400">*</span></label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder="詳細收件地址" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">備註(可選)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} placeholder="有咩特別要求可以寫喺度" />
          </div>
        </div>

        {/* 右:訂單摘要 */}
        <div className="md:col-span-2">
          <div className="border border-gray-100 rounded-xl p-5 md:sticky md:top-24">
            <h2 className="font-medium text-sm text-gray-500 mb-4">訂單摘要</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={`${it.designId}-${it.phoneModel}`} className="flex justify-between text-sm">
                  <span className="text-gray-600 min-w-0 pr-2">
                    {it.designName} <span className="text-gray-400">/ {it.phoneModel} ×{it.quantity}</span>
                    {it.originalPrice && (
                      <span className="text-red-400 text-xs ml-1">特價</span>
                    )}
                  </span>
                  <span className="shrink-0">HK${it.unitPrice * it.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2">
              {totalSaved > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>特價優惠</span>
                  <span>− HK${totalSaved}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>總計</span>
                <span>HK${totalAmount}</span>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={submitting}
              className="w-full mt-6 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {submitting ? '提交緊…' : '確認落單'}
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">
              提交後會經 WhatsApp 確認付款
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout