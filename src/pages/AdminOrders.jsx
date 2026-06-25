import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import AdminNav from '../components/AdminNav'

// ⭐ 私有 bucket:即場生成 signed URL 顯示截圖
function SignedImg({ path, alt, className }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!path) return
    let alive = true
    supabase.storage
      .from('payments')
      .createSignedUrl(path, 60 * 10) // 10 分鐘
      .then(({ data }) => { if (alive && data) setUrl(data.signedUrl) })
    return () => { alive = false }
  }, [path])

  if (!url) return <div className={`${className} bg-gray-100 animate-pulse`} />
  return <img src={url} alt={alt} className={className} />
}

// ⭐ 客製相片:用落單時嘅構圖數據還原(同 PhotoEditor 同一條公式)
function CustomPhotoPreview({ url, transform, displayW = 130 }) {
  const t = transform || {}
  const frameW = t.frameW || 260
  const frameH = t.frameH || 540
  const ratio = displayW / frameW

  if (!url) return <span className="text-gray-400 text-sm">未有相片</span>

  return (
    <div style={{
      width: frameW * ratio, height: frameH * ratio,
      overflow: 'hidden', position: 'relative',
      borderRadius: 14, border: '2px solid #1f2937', background: '#f3f4f6',
    }}>
      <img
        src={url}
        alt="客製相片"
        draggable={false}
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: frameW * ratio, maxWidth: 'none',
          transform: `translate(-50%, -50%) translate(${(t.posX || 0) * ratio}px, ${(t.posY || 0) * ratio}px) scale(${t.scale || 1})`,
        }}
      />
    </div>
  )
}

// ⭐ 拼圖切片:用落單時嘅 PuzzleEditor 公式還原其中一格
function PuzzleSlicePreview({ plate, displayW = 110 }) {
  const url = plate?.custom_photo_url
  const frameW = plate?.frameW || 180
  const frameH = plate?.frameH || 380
  const totalW = plate?.totalW || frameW
  const scale = plate?.scale || 1
  const off = plate?.offset || { dx: 0, dy: 0 }
  const i = plate?.slice?.index ?? 0
  const ratio = displayW / frameW

  if (!url) return <span className="text-gray-400 text-sm">未有相片</span>

  return (
    <div style={{
      width: frameW * ratio, height: frameH * ratio,
      overflow: 'hidden', position: 'relative',
      borderRadius: 14, border: '2px solid #1f2937', background: '#f3f4f6',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: totalW * ratio, height: frameH * ratio,
        transform: `translate(${(-i * frameW + off.dx) * ratio}px, ${(off.dy) * ratio}px)`,
      }}>
        <img
          src={url}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: totalW * ratio, maxWidth: 'none',
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        />
      </div>
    </div>
  )
}

// ⭐ 每格標籤
function plateLabel(p, idx) {
  if (p?.type === 'puzzle_slice') return `殼 ${(p.slice?.index ?? idx) + 1}`
  if (p?.type === 'shell') return `手機殼 ${p.index ?? idx + 1}`
  if (p?.type === 'plate') return `底板 ${p.index ?? idx + 1}`
  return `#${idx + 1}`
}

const STATUSES = ['待付款', '已付款', '製作中', '已寄出']

const statusStyle = {
  待付款: 'bg-amber-50 text-amber-700 border-amber-200',
  已付款: 'bg-blue-50 text-blue-700 border-blue-200',
  製作中: 'bg-purple-50 text-purple-700 border-purple-200',
  已寄出: 'bg-green-50 text-green-700 border-green-200',
}

function csvCell(val) {
  const s = val == null ? '' : String(val)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCSV(filename, rows) {
  const content = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dateStamp() {
  const d = new Date()
  return (
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  )
}

function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [itemsByOrder, setItemsByOrder] = useState({})
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('全部')
  const [exporting, setExporting] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)
  const [zoomImg, setZoomImg] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, payments!payments_order_id_fkey(*)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      alert('讀取訂單失敗:' + error.message)
    }
    setOrders(data || [])
    setLoading(false)
  }

  async function toggleOpen(orderId) {
    if (openId === orderId) {
      setOpenId(null)
      return
    }
    setOpenId(orderId)
    if (!itemsByOrder[orderId]) {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
      setItemsByOrder((prev) => ({ ...prev, [orderId]: data || [] }))
    }
  }

  async function changeStatus(orderId, newStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    if (error) {
      alert('更新狀態失敗:' + error.message)
      loadOrders()
    }
  }

  async function confirmReceipt(orderId, payId) {
    setConfirmingId(orderId)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: '已付款' } : o))
    )
    const { error } = await supabase
      .from('orders')
      .update({ status: '已付款' })
      .eq('id', orderId)

    if (payId) {
      await supabase
        .from('payments')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', payId)
    }

    setConfirmingId(null)
    if (error) {
      alert('確認收款失敗:' + error.message)
      loadOrders()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const shown =
    filter === '全部' ? orders : orders.filter((o) => o.status === filter)

  function orderSaved(orderId) {
    const its = itemsByOrder[orderId]
    if (!its) return 0
    return its.reduce((sum, it) => {
      if (it.original_price != null) {
        return sum + (it.original_price - it.unit_price) * it.quantity
      }
      return sum
    }, 0)
  }

  function exportOrders() {
    if (shown.length === 0) return alert('冇訂單可匯出')

    const header = [
      '訂單編號', '狀態', '客人姓名', '聯絡電話', '地區', '收件地址',
      '送貨方式', '順豐站', '運費(HKD)', '金額(HKD)', '付款方式', '備註', '落單時間',
    ]
    const rows = shown.map((o) => [
      o.order_number,
      o.status || '',
      o.customer_name,
      o.customer_phone,
      o.region || '',
      o.customer_address,
      o.shipping_method || '',
      o.sf_station || '',
      o.shipping_fee ?? '',
      o.amount,
      o.payment_method || '',
      o.note || '',
      o.created_at ? new Date(o.created_at).toLocaleString('zh-HK') : '',
    ])

    downloadCSV(`訂單_${filter}_${dateStamp()}.csv`, [header, ...rows])
  }

  async function exportItems() {
    if (shown.length === 0) return alert('冇訂單可匯出')

    setExporting(true)
    try {
      const ids = shown.map((o) => o.id)
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids)

      if (error) {
        alert('匯出失敗:' + error.message)
        return
      }

      const orderMap = {}
      shown.forEach((o) => { orderMap[o.id] = o })

      const header = [
        '訂單編號', '狀態', '客人姓名', '聯絡電話',
        '產品名稱', '系列', '手機型號', '數量',
        '單價(HKD)', '原價(HKD)', '小計(HKD)', '落單時間',
      ]

      const rows = (items || []).map((it) => {
        const o = orderMap[it.order_id] || {}
        return [
          o.order_number || '',
          o.status || '',
          o.customer_name || '',
          o.customer_phone || '',
          it.design_name,
          it.collection || '',
          it.phone_model,
          it.quantity,
          it.unit_price,
          it.original_price ?? '',
          it.unit_price * it.quantity,
          o.created_at ? new Date(o.created_at).toLocaleString('zh-HK') : '',
        ]
      })

      if (rows.length === 0) {
        alert('呢批訂單冇明細資料')
        return
      }

      downloadCSV(`訂單明細_${filter}_${dateStamp()}.csv`, [header, ...rows])
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">訂單管理</h1>
            <p className="text-sm text-gray-400 mt-1">共 {orders.length} 張訂單</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportOrders}
              className="text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition">
              匯出訂單
            </button>
            <button onClick={exportItems} disabled={exporting}
              className="text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition disabled:opacity-50">
              {exporting ? '匯出緊…' : '匯出明細'}
            </button>
            <button onClick={handleLogout}
              className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition">
              登出
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {['全部', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                filter === s
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-6">
          匯出會跟住目前篩選(而家:{filter},共 {shown.length} 張)
        </p>

        {loading && <p className="text-center text-gray-400 py-12">載入緊…</p>}

        {!loading && shown.length === 0 && (
          <p className="text-center text-gray-400 py-12">未有訂單。</p>
        )}

        <div className="space-y-3">
          {shown.map((o) => {
            const proof = o.payments?.[0]?.proof_url
            const payId = o.payments?.[0]?.id
            const plates = Array.isArray(o.custom_plates) ? o.custom_plates : []
            const isPuzzleOrder = plates.some((p) => p?.type === 'puzzle_slice')
            const puzzleBigImg = isPuzzleOrder ? plates[0]?.custom_photo_url : null
            return (
            <div key={o.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="p-4 flex flex-wrap items-center gap-4">
                <button onClick={() => toggleOpen(o.id)}
                  className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{o.order_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle[o.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {o.status || '—'}
                    </span>
                    {o.is_custom && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                        客製
                      </span>
                    )}
                    {o.status === '待付款' && proof && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        待核對
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {o.customer_name} · {o.customer_phone} · HK${o.amount}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {o.created_at ? new Date(o.created_at).toLocaleString('zh-HK') : ''}
                  </p>
                </button>

                <select value={o.status || ''} onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <button onClick={() => toggleOpen(o.id)}
                  className="text-sm text-gray-400 hover:text-gray-700">
                  {openId === o.id ? '收起 ▲' : '明細 ▼'}
                </button>
              </div>

              {openId === o.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 text-sm">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">收件資料</p>
                      <p>{o.customer_name}</p>
                      <p className="text-gray-600">{o.customer_phone}</p>
                      <p className="text-gray-600">{o.region} · {o.customer_address}</p>
                      {/* ⭐ 送貨資料 */}
                      {o.shipping_method && (
                        <p className="text-gray-600 mt-1">送貨:{o.shipping_method}</p>
                      )}
                      {o.sf_station && (
                        <p className="text-gray-600">順豐站:{o.sf_station}</p>
                      )}
                      {o.note && <p className="text-gray-500 mt-1">備註:{o.note}</p>}
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">付款資料</p>
                      <p className="text-gray-600">方式:{o.payment_method || '—'}</p>
                      {proof ? (
                        <div className="mt-2">
                          <button onClick={() => setZoomImg(proof)}
                            className="block">
                            <SignedImg path={proof} alt="付款截圖"
                              className="w-32 h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition" />
                          </button>
                          <p className="text-xs text-gray-400 mt-1">撳圖放大</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 mt-1">未有上傳截圖</p>
                      )}

                      {o.status === '待付款' && (
                        <button onClick={() => confirmReceipt(o.id, payId)}
                          disabled={confirmingId === o.id}
                          className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
                          {confirmingId === o.id ? '確認緊…' : '✓ 確認收款'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ⭐ 客製構圖 */}
                  {o.is_custom && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <p className="text-gray-400 text-xs">
                          客製構圖 — {o.product_name || o.case_type}(型號 {o.phone_model})
                          {o.custom_mode === 'A' && o.plate_count ? ` · ${o.plate_count} 片底板` : ''}
                          {o.custom_mode === 'B' && o.shell_count
                            ? ` · ${o.shell_count} 個殼${isPuzzleOrder ? '(拼圖)' : '(獨立圖)'}`
                            : ''}
                        </p>
                        {puzzleBigImg && (
                          <a href={puzzleBigImg} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 underline">
                            下載拼圖大圖
                          </a>
                        )}
                      </div>

                      {plates.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {plates.map((p, idx) => {
                            const isPz = p?.type === 'puzzle_slice'
                            return (
                              <div key={idx} className="flex flex-col items-center">
                                {isPz
                                  ? <PuzzleSlicePreview plate={p} />
                                  : <CustomPhotoPreview url={p.custom_photo_url} transform={p.photo_transform} />}
                                <span className="text-xs text-gray-600 mt-1">{plateLabel(p, idx)}</span>
                                {!isPz && p.custom_photo_url && (
                                  <a href={p.custom_photo_url} target="_blank" rel="noreferrer"
                                    className="text-xs text-blue-600 underline">原圖</a>
                                )}
                                {p.photo_transform && (
                                  <span className="text-[10px] text-gray-400">
                                    {(p.photo_transform.scale || 1).toFixed(2)}× ·
                                    {Math.round(p.photo_transform.posX || 0)},{Math.round(p.photo_transform.posY || 0)}
                                  </span>
                                )}
                                {isPz && (
                                  <span className="text-[10px] text-gray-400">
                                    {(p.scale || 1).toFixed(2)}× ·
                                    {Math.round(p.offset?.dx || 0)},{Math.round(p.offset?.dy || 0)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : o.custom_photo_url ? (
                        // 舊單 fallback:單張封面
                        <div className="flex items-start gap-4">
                          <CustomPhotoPreview url={o.custom_photo_url} transform={o.photo_transform} />
                          <div className="text-sm space-y-1">
                            <a href={o.custom_photo_url} target="_blank" rel="noreferrer"
                              className="inline-block text-blue-600 underline">下載原圖</a>
                            {o.photo_transform && (
                              <p className="text-xs text-gray-400">
                                縮放 {(o.photo_transform.scale || 1).toFixed(2)}× ·
                                位移 {Math.round(o.photo_transform.posX || 0)},{Math.round(o.photo_transform.posY || 0)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400">未有客製相片資料</p>
                      )}
                    </div>
                  )}

                  <p className="text-gray-400 text-xs mb-2">訂單項目</p>
                  <div className="space-y-1">
                    {(itemsByOrder[o.id] || []).map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span className="text-gray-700">
                          {it.design_name}
                          <span className="text-gray-400"> / {it.phone_model} ×{it.quantity}</span>
                          {it.original_price != null && (
                            <span className="text-xs text-red-500 ml-1">
                              特價 HK${it.unit_price}
                              <span className="line-through text-gray-300 ml-1">HK${it.original_price}</span>
                            </span>
                          )}
                        </span>
                        <span>HK${it.unit_price * it.quantity}</span>
                      </div>
                    ))}
                    {!itemsByOrder[o.id] && <p className="text-gray-400">載入緊…</p>}
                    {itemsByOrder[o.id] && itemsByOrder[o.id].length === 0 && o.is_custom && (
                      <p className="text-gray-400">客製單:詳情見上方構圖。</p>
                    )}
                  </div>

                  {/* ⭐ 總額區:特價優惠 + 運費 + 總計 */}
                  <div className="border-t border-gray-200 mt-3 pt-2 space-y-1">
                    {orderSaved(o.id) > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>特價優惠</span>
                        <span>− HK${orderSaved(o.id)}</span>
                      </div>
                    )}
                    {o.shipping_fee != null && (
                      <div className="flex justify-between text-gray-500">
                        <span>運費{o.shipping_method ? `(${o.shipping_method})` : ''}</span>
                        <span>{o.shipping_fee > 0 ? `HK$${o.shipping_fee}` : '免費'}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>總計</span>
                      <span>HK${o.amount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {zoomImg && (
        <div onClick={() => setZoomImg(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out">
          <SignedImg path={zoomImg} alt="付款截圖"
            className="max-w-full max-h-full object-contain rounded-lg" />
          <button onClick={() => setZoomImg(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 text-gray-700 text-xl hover:bg-white">
            ×
          </button>
        </div>
      )}
    </>
  )
}

export default AdminOrders