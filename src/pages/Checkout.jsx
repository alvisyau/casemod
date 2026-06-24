import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'

const WHATSAPP_NUMBER = '85266988317'

function Checkout() {
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCart()

  const [step, setStep] = useState(1)            // 1 填資料 / 2 付款
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('香港')
  const [note, setNote] = useState('')
  const [payMethod, setPayMethod] = useState('FPS')   // FPS / PayMe

  const [settings, setSettings] = useState(null)      // 收款設定
  const [proofUrl, setProofUrl] = useState('')        // 已上傳截圖
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)             // 防止清車後閃「空車」

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // 讀收款設定
  useEffect(() => {
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'payment')
      .single()
      .then(({ data }) => setSettings(data?.value || {}))
  }, [])

  // 購物車空 → 趕返去(提交成功 done 後唔再攔)
  if (items.length === 0 && !done) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-400">購物車係空嘅,無法結帳。</p>
        <Link to="/collection" className="text-sm underline mt-4 inline-block">去睇現成系列</Link>
      </div>
    )
  }

  const totalSaved = items.reduce((sum, it) => {
    if (it.originalPrice) return sum + (it.originalPrice - it.unitPrice) * it.quantity
    return sum
  }, 0)

  // Step 1 → Step 2(只做驗證,唔寫 DB)
  function goToPayment() {
    if (!name.trim()) return alert('請填寫姓名')
    if (!phone.trim()) return alert('請填寫聯絡電話')
    if (!address.trim()) return alert('請填寫收件地址')
    setStep(2)
    window.scrollTo(0, 0)
  }

  // 上傳付款截圖
  async function handleUploadProof(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('payments')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (upErr) {
      setUploading(false)
      alert('截圖上載失敗:' + upErr.message)
      return
    }
    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setProofUrl(data.publicUrl)
    setUploading(false)
    e.target.value = ''
  }

  // 最終提交:一次過寫 orders + order_items + payments + 扣庫存
  async function handleSubmit() {
    if (!proofUrl) return alert('請先上載付款截圖')

    setSubmitting(true)

    const orderId = crypto.randomUUID()
    const d = new Date()
    const orderNumber =
      'CM' +
      d.getFullYear().toString().slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      Math.floor(1000 + Math.random() * 9000)

    const phoneSummary = items.map((it) => `${it.phoneModel}×${it.quantity}`).join(', ')

    // ① orders(單頭)— status 待付款,等 admin 確認收款
    const { error: orderErr } = await supabase.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      phone_model: phoneSummary,
      case_type: '現成系列',
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim(),
      region,
      currency: 'HKD',
      amount: totalAmount,
      payment_method: payMethod,
      status: '待付款',
      note: note.trim() || null,
    })
    if (orderErr) {
      setSubmitting(false)
      console.error(orderErr)
      return alert('落單失敗(單頭):\n' + orderErr.message)
    }

    // ② order_items(逐件)
    const itemsPayload = items.map((it) => ({
      order_id: orderId,
      design_id: it.designId,
      design_name: it.designName,
      collection: it.collection,
      phone_model: it.phoneModel,
      unit_price: it.unitPrice,
      original_price: it.originalPrice ?? null,
      quantity: it.quantity,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)
    if (itemsErr) {
      setSubmitting(false)
      console.error(itemsErr)
      return alert('落單失敗(項目):\n' + itemsErr.message)
    }

    // ③ payments(付款記錄 + 截圖)
    const { error: payErr } = await supabase.from('payments').insert({
      order_id: orderId,
      method: payMethod,
      amount: totalAmount,
      proof_url: proofUrl,
      status: 'submitted',
    })
    if (payErr) {
      setSubmitting(false)
      console.error(payErr)
      return alert('付款記錄寫入失敗:\n' + payErr.message)
    }

    // ④ 扣庫存
    for (const it of items) {
      const { error: stockErr } = await supabase.rpc('decrement_stock', {
        p_design_id: it.designId,
        p_qty: it.quantity,
      })
      if (stockErr) console.error('扣庫存失敗', it.designId, stockErr.message)
    }

    
    // ⑥ 完成
    setDone(true)
    clearCart()
    setSubmitting(false)
    navigate('/order-success', { state: { orderNumber } })
  }

  const pay = settings || {}

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {step === 1 ? (
        <Link to="/cart" className="text-sm text-gray-400 hover:text-gray-700 transition">
          ← 返回購物車
        </Link>
      ) : (
        <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-700 transition">
          ← 返回收件資料
        </button>
      )}

      <h1 className="text-2xl font-bold mt-6 mb-2">結帳</h1>

      {/* 步驟指示 */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <span className={step === 1 ? 'font-medium text-black' : 'text-gray-400'}>① 收件資料</span>
        <span className="text-gray-300">→</span>
        <span className={step === 2 ? 'font-medium text-black' : 'text-gray-400'}>② 付款</span>
      </div>

      <div className="grid md:grid-cols-5 gap-10">
        {/* 左邊主內容 */}
        <div className="md:col-span-3 space-y-4">
          {step === 1 && (
            <>
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

              <div className="pt-2">
                <label className="block text-sm font-medium mb-2">付款方式</label>
                <div className="grid grid-cols-2 gap-3">
                  {['FPS', 'PayMe'].map((m) => (
                    <button key={m} type="button" onClick={() => setPayMethod(m)}
                      className={`py-3 rounded-lg border text-sm font-medium transition ${
                        payMethod === m ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      {m === 'FPS' ? '轉數快 FPS' : 'PayMe'}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={goToPayment}
                className="w-full mt-4 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition">
                下一步:付款
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-medium text-sm text-gray-500">付款</h2>

              {/* 收款資料 */}
              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">請以 <span className="font-medium text-black">{payMethod === 'FPS' ? '轉數快 FPS' : 'PayMe'}</span> 付款</p>
                <p className="text-2xl font-bold mb-4">HK${totalAmount}</p>

                {payMethod === 'FPS' ? (
                  <div className="space-y-2 text-sm">
                    {pay.fps_phone && <p>FPS 電話 / ID:<span className="font-medium">{pay.fps_phone}</span></p>}
                    {pay.fps_name && <p>收款人:<span className="font-medium">{pay.fps_name}</span></p>}
                    {pay.fps_qr_url && (
                      <img src={pay.fps_qr_url} alt="FPS QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />
                    )}
                    {!pay.fps_phone && !pay.fps_qr_url && (
                      <p className="text-amber-600">商家未設定 FPS 收款資料,請用 WhatsApp 聯絡。</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {pay.payme_link && (
                      <a href={pay.payme_link} target="_blank" rel="noreferrer"
                        className="inline-block text-blue-600 underline break-all">{pay.payme_link}</a>
                    )}
                    {pay.payme_qr_url && (
                      <img src={pay.payme_qr_url} alt="PayMe QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />
                    )}
                    {!pay.payme_link && !pay.payme_qr_url && (
                      <p className="text-amber-600">商家未設定 PayMe 收款資料,請用 WhatsApp 聯絡。</p>
                    )}
                  </div>
                )}
              </div>

              {/* 上傳截圖 */}
              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-sm font-medium mb-2">上載付款截圖 <span className="text-red-400">*</span></p>
                <p className="text-xs text-gray-400 mb-3">過數後請截圖上載,我哋核對後會開始製作。</p>

                {proofUrl ? (
                  <div className="relative inline-block">
                    <img src={proofUrl} alt="付款截圖" className="w-40 rounded-lg border" />
                    <button onClick={() => setProofUrl('')}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-red-500 hover:text-white transition">
                      ×
                    </button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" onChange={handleUploadProof}
                    className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer" />
                )}
                {uploading && <p className="text-xs text-gray-400 mt-2">上載緊…</p>}
              </div>

              <button onClick={handleSubmit} disabled={submitting || uploading || !proofUrl}
                className="w-full mt-2 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? '提交緊…' : '我已付款,確認落單'}
              </button>
            </>
          )}
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
                    {it.originalPrice && <span className="text-red-400 text-xs ml-1">特價</span>}
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout