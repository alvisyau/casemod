import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from '../components/AdminNav'
import ErrorBoundary from '../components/ErrorBoundary'
import SFImport from '../components/SFImport'
import PhoneModelManager from '../components/PhoneModelManager'


// 運費預設值(讀唔到 DB 時頂住)
const DEFAULT_SHIPPING = {
  hk_fee: 0,
  cn_fee: 0,
  mo_fee: 60,
  tw_fee: 80,
  other_fee: 150,
}

function AdminSettings() {
  const [form, setForm] = useState({
    fps_phone: '',
    fps_name: '',
    fps_qr_url: '',
    payme_link: '',
    payme_qr_url: '',
  })
  // ⭐ 運費 state(獨立)
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')   // 'fps' | 'payme' | ''
  const [saved, setSaved] = useState(false)

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // 載入現有設定(payment + shipping)
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .in('key', ['payment', 'shipping'])

      if (data) {
        const payRow = data.find((r) => r.key === 'payment')
        const shipRow = data.find((r) => r.key === 'shipping')
        if (payRow?.value) setForm((f) => ({ ...f, ...payRow.value }))
        if (shipRow?.value) setShipping((s) => ({ ...s, ...shipRow.value }))
      }
      setLoading(false)
    }
    load()
  }, [])

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    setSaved(false)
  }

  // ⭐ 更新運費(空白 = 0,只收非負整數)
  function updateShipping(key, val) {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
    setShipping((s) => ({ ...s, [key]: num }))
    setSaved(false)
  }

  // 上傳 QR 圖
  async function handleUploadQR(e, which) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(which)
    const ext = file.name.split('.').pop()
    const fileName = `qr-${which}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('store-assets')                              // ⭐ 改呢度
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (upErr) {
      setUploading('')
      alert('QR 上載失敗:' + upErr.message)
      return
    }
    const { data } = supabase.storage.from('store-assets').getPublicUrl(fileName)  // ⭐ 改呢度
    update(which === 'fps' ? 'fps_qr_url' : 'payme_qr_url', data.publicUrl)
    setUploading('')
    e.target.value = ''
  }

  // 儲存(payment + shipping 一齊 upsert)
  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('store_settings')
      .upsert(
        [
          { key: 'payment', value: form, updated_at: now },
          { key: 'shipping', value: shipping, updated_at: now },
        ],
        { onConflict: 'key' }
      )
    setSaving(false)
    if (error) {
      console.error(error)
      return alert('儲存失敗:' + error.message)
    }
    setSaved(true)
  }

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center text-gray-400">載入緊…</div>
      </>
    )
  }

  // 運費欄位設定(方便 render)
  const shippingFields = [
    { key: 'hk_fee', label: '香港', hint: '0 = 免運費' },
    { key: 'cn_fee', label: '中國內地', hint: '0 = 免運費' },
    { key: 'mo_fee', label: '澳門', hint: '平郵 / 其他快遞' },
    { key: 'tw_fee', label: '台灣', hint: '平郵 / 其他快遞' },
    { key: 'other_fee', label: '其他地區', hint: '平郵 / 其他快遞' },
  ]

  return (
    <>
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">商店設定</h1>
        <p className="text-sm text-gray-400 mb-8">呢度設定嘅資料會喺客人結帳付款頁顯示。</p>

        {/* FPS */}
        <section className="border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">轉數快 FPS</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">FPS 電話 / ID</label>
              <input value={form.fps_phone} onChange={(e) => update('fps_phone', e.target.value)}
                className={inputClass} placeholder="例如 9123 4567 或 FPS ID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">收款人名稱</label>
              <input value={form.fps_name} onChange={(e) => update('fps_name', e.target.value)}
                className={inputClass} placeholder="例如 CHAN TAI MAN" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">FPS QR Code</label>
              {form.fps_qr_url ? (
                <div className="relative inline-block">
                  <img src={form.fps_qr_url} alt="FPS QR" className="w-40 h-40 object-contain border rounded-lg" />
                  <button onClick={() => update('fps_qr_url', '')}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-red-500 hover:text-white transition">×</button>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleUploadQR(e, 'fps')}
                  className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer" />
              )}
              {uploading === 'fps' && <p className="text-xs text-gray-400 mt-2">上載緊…</p>}
            </div>
          </div>
        </section>

        {/* PayMe */}
        <section className="border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-4">PayMe</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">PayMe 連結(PayMe Link)</label>
              <input value={form.payme_link} onChange={(e) => update('payme_link', e.target.value)}
                className={inputClass} placeholder="https://payme.hsbc/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PayMe QR Code</label>
              {form.payme_qr_url ? (
                <div className="relative inline-block">
                  <img src={form.payme_qr_url} alt="PayMe QR" className="w-40 h-40 object-contain border rounded-lg" />
                  <button onClick={() => update('payme_qr_url', '')}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-red-500 hover:text-white transition">×</button>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleUploadQR(e, 'payme')}
                  className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer" />
              )}
              {uploading === 'payme' && <p className="text-xs text-gray-400 mt-2">上載緊…</p>}
            </div>
          </div>
        </section>

        {/* ⭐ 運費設定 */}
        <section className="border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-1">運費設定</h2>
          <p className="text-xs text-gray-400 mb-4">
            單位 HK$。填 <span className="font-medium">0</span> 即代表免運費(香港 / 內地一般免運)。
          </p>
          <div className="space-y-4">
            {shippingFields.map((f) => (
              <div key={f.key} className="flex items-center gap-4">
                <div className="w-24 shrink-0">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.hint}</p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-gray-400">HK$</span>
                  <input
                    type="number"
                    min="0"
                    value={shipping[f.key]}
                    onChange={(e) => updateShipping(f.key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⭐ 順豐自取點匯入 */}
        <section className="border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-1">順豐自取點</h2>
          <p className="text-xs text-gray-400 mb-4">
            上載順豐站 / 自助櫃 CSV,系統會自動分辨並寫入資料庫。
          </p>
          <ErrorBoundary>
            <SFImport onDone={(res) => console.log(res.msg)} />
          </ErrorBoundary>
        </section>

        {/* ⭐ 手機型號管理 */}
        <section className="border border-gray-100 rounded-xl p-6 mb-6">
          <h2 className="font-medium mb-1">手機型號</h2>
          <p className="text-xs text-gray-400 mb-4">
            喺度管理全店嘅手機型號清單。新增產品時可揀邊幾款型號適用。
          </p>
          <PhoneModelManager />
        </section>

        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving || uploading}
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
            {saving ? '儲存緊…' : '儲存設定'}
          </button>
          {saved && <span className="text-sm text-green-600">✓ 已儲存</span>}
        </div>
      </div>
    </>
  )
}

export default AdminSettings