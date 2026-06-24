import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'

const WHATSAPP_NUMBER = '85266988317'

// ⭐ 運費「預設值」(DB 讀到之前頂住),carrier 名固定
const SHIPPING = {
  香港: { carrier: '順豐速運', fee: 0 },
  內地: { carrier: '順豐速運', fee: 0 },
  澳門: { carrier: '平郵 / 其他快遞', fee: 60 },
  台灣: { carrier: '平郵 / 其他快遞', fee: 80 },
  其他: { carrier: '平郵 / 其他快遞', fee: 150 },
}

// ⭐ 地區 → DB 運費 key 對照
const FEE_KEY = {
  香港: 'hk_fee',
  內地: 'cn_fee',
  澳門: 'mo_fee',
  台灣: 'tw_fee',
  其他: 'other_fee',
}

// ⭐ 三大區固定次序
const REGION_ORDER = { 香港島: 0, 九龍: 1, 新界: 2, 離島: 3, 其他: 9 }

// ⭐ 各大區嘅地名關鍵字(順豐點多數用呢類細區名)
const REGION_AREAS = {
  香港島: [
    // 中西區
    '中環', '上環', '西環', '西營盤', '堅尼地城', '石塘咀', '金鐘', '半山', '山頂',
    '摩星嶺', '薄扶林', '數碼港',
    // 灣仔區
    '灣仔', '銅鑼灣', '跑馬地', '大坑', '渣甸山', '掃桿埔', '天后', '炮台山',
    // 東區
    '北角', '鰂魚涌', '鰂魚涌', '太古', '西灣河', '筲箕灣', '柴灣', '小西灣',
    '杏花邨', '康山', '愛秩序灣',
    // 南區
    '香港仔', '鴨脷洲', '黃竹坑', '深水灣', '淺水灣', '赤柱', '石澳', '舂坎角',
    '田灣', '華富', '海洋公園',
    '港島',
  ],
  九龍: [
    // 油尖旺
    '尖沙咀', '尖沙嘴', '尖東', '佐敦', '油麻地', '旺角', '太子', '大角咀', '油尖旺',
    // 深水埗
    '深水埗', '長沙灣', '荔枝角', '美孚', '石硤尾', '南昌', '又一村', '又一城',
    '大窩坪', '昂船洲',
    // 九龍城
    '九龍城', '九龍塘', '土瓜灣', '紅磡', '何文田', '馬頭角', '馬頭圍', '啟德',
    '海心', '黃埔', '老龍坑',
    // 黃大仙
    '黃大仙', '鑽石山', '新蒲崗', '樂富', '慈雲山', '橫頭磡', '東頭', '竹園',
    '彩虹', '牛池灣', '牛頭角', '彩雲',
    // 觀塘
    '觀塘', '九龍灣', '藍田', '油塘', '秀茂坪', '茶果嶺', '九龍灣', '佐敦谷',
    '鯉魚門', '坪石',
    '九龍',
  ],
  新界: [
    // 荃灣 / 葵青
    '荃灣', '葵涌', '葵芳', '葵興', '青衣', '大窩口', '荔景', '梨木樹', '石圍角',
    '汀九', '深井', '青龍頭',
    // 屯門 / 元朗
    '屯門', '元朗', '天水圍', '洪水橋', '流浮山', '錦田', '錦上路', '八鄉', '十八鄉',
    '新田', '落馬洲', '屏山', '廈村', '藍地', '掃管笏', '小欖',
    // 北區
    '上水', '粉嶺', '北區', '沙頭角', '打鼓嶺', '古洞', '坪輋', '聯和墟', '華明',
    // 大埔
    '大埔', '太和', '大尾督', '林村', '汀角', '船灣', '康樂園',
    // 沙田
    '沙田', '大圍', '火炭', '馬鞍山', '小瀝源', '石門', '烏溪沙', '第一城',
    '車公廟', '九肚',
    // 西貢 / 將軍澳
    '西貢', '將軍澳', '坑口', '調景嶺', '寶琳', '康城', '清水灣', '蠔涌', '北潭涌',
    '日出康城',
    '新界',
  ],
  離島: [
    // 大嶼山 / 離島
    '東涌', '大嶼山', '梅窩', '愉景灣', '貝澳', '長沙', '塘福', '大澳', '昂坪',
    '赤鱲角', '赤臘角', '機場', '亞洲國際博覽館',
    '長洲', '坪洲', '南丫島', '榕樹灣', '索罟灣', '馬灣', '喜靈洲', '蒲台島',
    '離島',
  ],
}

// ⭐ 判斷某個地名屬邊個大區(用關鍵字 substring 配對)
function regionOf(d = '') {
  for (const region of ['香港島', '九龍', '新界', '離島']) {
    if (REGION_AREAS[region].some((kw) => d.includes(kw))) return region
  }
  return '其他'
}

function Checkout() {
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCart()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('香港')
  const [note, setNote] = useState('')
  const [payMethod, setPayMethod] = useState('FPS')

  // ⭐ 送貨相關
  const [deliveryType, setDeliveryType] = useState('sf_store') // 香港用:sf_store / sf_locker / home
  const [sfStationCode, setSfStationCode] = useState('')
  const [sfStationName, setSfStationName] = useState('')
  const [selectedPoint, setSelectedPoint] = useState(null)  // ⭐ 揀中嘅點(全部資料)

  // ⭐ 順豐點清單(由 DB 讀)
  const [sfPoints, setSfPoints] = useState([])
  const [loadingPoints, setLoadingPoints] = useState(false)

  // ⭐ 篩選用
  const [sfDistrict, setSfDistrict] = useState('')   // 已揀地區
  const [sfSearch, setSfSearch] = useState('')        // 搜尋字

  const [settings, setSettings] = useState(null)
  const [shippingFees, setShippingFees] = useState(null)   // ⭐ DB 運費
  const [proofUrl, setProofUrl] = useState('')
  const [proofPreview, setProofPreview] = useState('')   // ⭐ 本機預覽用
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // 簡稱有意義就用簡稱;否則用地址
  function pointLabel(s) {
    if (s?.name && s.name !== s.code) return s.name
    return s?.address || ''
  }

  // 統一「揀某一點」
  function pickPoint(st) {
    if (!st) { setSelectedPoint(null); setSfStationCode(''); setSfStationName(''); return }
    setSelectedPoint(st)
    setSfStationCode(st.code)
    setSfStationName(pointLabel(st))
  }

  // 讀收款設定
  useEffect(() => {
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'payment')
      .single()
      .then(({ data }) => setSettings(data?.value || {}))
  }, [])

  // ⭐ 讀運費設定
  useEffect(() => {
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping')
      .single()
      .then(({ data }) => setShippingFees(data?.value || null))
  }, [])

  // ⭐ 讀順豐點清單(按派送方式,分批攞晒,無上限)
  useEffect(() => {
    if (deliveryType === 'home') { setSfPoints([]); return }

    const sfType = deliveryType === 'sf_locker' ? 'locker' : 'station'

    async function loadPoints() {
      setLoadingPoints(true)
      const pageSize = 1000
      let from = 0
      let all = []

      while (true) {
        const { data, error } = await supabase
          .from('sf_locations')
          .select('code, name, district, address, hours')
          .eq('type', sfType)
          .order('district', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) { console.error('讀取順豐點失敗:', error.message); break }
        if (!data || data.length === 0) break

        all = all.concat(data)
        if (data.length < pageSize) break       // last page
        from += pageSize
      }

      setSfPoints(all)
      setLoadingPoints(false)
    }

    loadPoints()
    setSfStationCode('')
    setSfStationName('')
    setSelectedPoint(null)
    setSfDistrict('')   // ⭐ 切換派送方式時清空篩選
    setSfSearch('')
  }, [deliveryType])

  // ⭐ 揀地區 / 切換派送方式 → 自動揀該區第一個點
  useEffect(() => {
    if (deliveryType === 'home' || loadingPoints) return
    const list = sfDistrict
      ? sfPoints.filter((s) => s.district === sfDistrict)
      : sfPoints
    pickPoint(list[0] || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfDistrict, deliveryType, loadingPoints, sfPoints])

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

  // ⭐ 運費 / 物流(優先用 DB,讀唔到先用預設)
  const shipInfo = SHIPPING[region] || SHIPPING['其他']
  const shippingFee =
    shippingFees && shippingFees[FEE_KEY[region]] != null
      ? shippingFees[FEE_KEY[region]]
      : shipInfo.fee
  const grandTotal = totalAmount + shippingFee

  // 香港揀順豐點時的派送描述
  const isHK = region === '香港'
  const isLocker = deliveryType === 'sf_locker'
  const useSFStore = isHK && (deliveryType === 'sf_store' || deliveryType === 'sf_locker')

  // ⭐ 所有地區:先去重,再按 香港→九龍→新界 排,同區內按中文排
  const districts = [...new Set(sfPoints.map((s) => s.district).filter(Boolean))].sort((a, b) => {
    const ra = REGION_ORDER[regionOf(a)] ?? 99
    const rb = REGION_ORDER[regionOf(b)] ?? 99
    if (ra !== rb) return ra - rb
    return a.localeCompare(b, 'zh-Hant')
  })

  // ⭐ 按大區分組(畀 <optgroup> 用)
  const groupedDistricts = districts.reduce((acc, d) => {
    const r = regionOf(d)
    ;(acc[r] = acc[r] || []).push(d)
    return acc
  }, {})

  // ⭐ 篩選後嘅點(地區 + 關鍵字)
  const filteredPoints = sfPoints.filter((s) => {
    if (sfDistrict && s.district !== sfDistrict) return false
    if (sfSearch.trim()) {
      const kw = sfSearch.trim().toLowerCase()
      const hit =
        (s.name || '').toLowerCase().includes(kw) ||
        (s.code || '').toLowerCase().includes(kw) ||
        (s.address || '').toLowerCase().includes(kw)
      if (!hit) return false
    }
    return true
  })

  // ⭐ 由選單揀點
  function onPickStation(e) {
    const st = sfPoints.find((s) => s.code === e.target.value)
    pickPoint(st || null)
  }

  function goToPayment() {
    if (!name.trim()) return alert('請填寫姓名')
    if (!phone.trim()) return alert('請填寫聯絡電話')
    if (useSFStore) {
      if (!sfStationCode.trim()) return alert(`請揀${isLocker ? '順豐自助櫃' : '順豐站'}或輸入代碼`)
    } else {
      if (!address.trim()) return alert('請填寫收件地址')
    }
    setStep(2)
    window.scrollTo(0, 0)
  }

// 上載付款截圖
  async function handleUploadProof(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('payments')
      .upload(path, file, { upsert: false })

    if (error) {
      alert('截圖上載失敗:' + error.message)
      setUploading(false)
      e.target.value = ''
      return
    }

    // ⭐ 只存 path,唔好存 public URL
    setProofUrl(path)
    setProofPreview(URL.createObjectURL(file))   // ⭐ 本機預覽
    setUploading(false)
    e.target.value = ''
  }

  async function handleSubmit() {
    if (!proofUrl) return alert('請先上載付款截圖')

    setSubmitting(true)

    // ⭐ 整理送貨描述(純文字,唔涉及價錢)
    const sfStation = useSFStore
      ? (sfStationName ? `${sfStationName} (${sfStationCode.trim()})` : sfStationCode.trim())
      : null

    const pickupLabel = isLocker ? '順豐自助櫃' : '順豐站自取'
    const shippingMethod = isHK
      ? (useSFStore ? pickupLabel : '順豐送貨上門')
      : region === '內地'
      ? '順豐送貨上門'
      : '平郵 / 其他快遞'

    const finalAddress = useSFStore
      ? `${isLocker ? '自助櫃' : '順豐站'}:${sfStation}`
      : address.trim()

    // ⭐ 一次 RPC:server 端計價 + atomic 扣庫存 + 一齊寫入
    const { data, error } = await supabase.rpc('create_order', {
      p_items: items.map((it) => ({
        design_id: it.designId,
        phone_model: it.phoneModel,
        quantity: it.quantity,
      })),
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_region: region,
      p_shipping_method: shippingMethod,
      p_customer_address: finalAddress,
      p_sf_station: sfStation,
      p_payment_method: payMethod,
      p_proof_url: proofUrl,
      p_note: note.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      console.error(error)
      return alert('落單失敗:\n' + error.message)   // 例:庫存不足 / 產品已下架
    }

    setDone(true)
    clearCart()
    navigate('/order-success', { state: { orderNumber: data.order_number } })
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

              {/* 地區 */}
              <div>
                <label className="block text-sm font-medium mb-2">地區</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
                  <option value="香港">香港</option>
                  <option value="內地">中國內地</option>
                  <option value="澳門">澳門</option>
                  <option value="台灣">台灣</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* 物流提示 */}
              <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                <span className="text-gray-600">物流:{shipInfo.carrier}</span>
                <span className={shippingFee > 0 ? 'text-gray-800 font-medium' : 'text-green-600 font-medium'}>
                  {shippingFee > 0 ? `運費 HK$${shippingFee}` : '免運費'}
                </span>
              </div>

              {/* 香港:派送方式 */}
              {isHK && (
                <div>
                  <label className="block text-sm font-medium mb-2">派送方式</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['sf_store', '順豐站自取'], ['sf_locker', '順豐自助櫃'], ['home', '順豐送貨上門']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setDeliveryType(val)}
                        className={`py-3 rounded-lg border text-sm font-medium transition ${
                          deliveryType === val ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 香港 + 順豐站/自助櫃:篩選 + 揀點 */}
              {useSFStore ? (
                <div className="space-y-3">
                  {/* 1️⃣ 地區篩選(按 香港/九龍/新界 分組) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">地區</label>
                    <select
                      value={sfDistrict}
                      onChange={(e) => setSfDistrict(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">全部地區</option>
                      {['香港島', '九龍', '新界', '離島', '其他'].map((r) =>
                        groupedDistricts[r] ? (
                          <optgroup key={r} label={r === '香港' ? '香港島' : r}>
                            {groupedDistricts[r].map((dd) => (
                              <option key={dd} value={dd}>{dd}</option>
                            ))}
                          </optgroup>
                        ) : null
                      )}
                    </select>
                  </div>

                  {/* 2️⃣ 揀點(只顯示 代碼 + 地址) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      揀{isLocker ? '順豐自助櫃' : '順豐站'}
                      {loadingPoints && <span className="text-xs text-gray-400 ml-2">載入緊…</span>}
                    </label>
                    <select value={sfStationCode} onChange={onPickStation} className={inputClass}>
                      <option value="">
                        {loadingPoints
                          ? '載入緊…'
                          : filteredPoints.length === 0
                          ? '冇符合嘅結果'
                          : '請選擇…'}
                      </option>
                      {filteredPoints.slice(0, 300).map((s) => {
                        const addr = s.address || (s.name !== s.code ? s.name : '')
                        const shortAddr = addr.length > 32 ? addr.slice(0, 32) + '…' : addr
                        return (
                          <option key={s.code} value={s.code}>
                            {s.code}{shortAddr ? ` — ${shortAddr}` : ''}
                          </option>
                        )
                      })}
                    </select>
                    {filteredPoints.length > 300 && (
                      <p className="text-xs text-gray-400 mt-1">
                        結果太多,請揀地區或喺下面輸入關鍵字縮窄範圍。
                      </p>
                    )}
                  </div>

                  {/* 3️⃣ 已揀:顯示地址 + 營業/開放時間 */}
                  {selectedPoint && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm space-y-1">
                      {selectedPoint.name && selectedPoint.name !== selectedPoint.code && (
                        <p className="font-medium">{selectedPoint.name}</p>
                      )}
                      {selectedPoint.address && (
                        <p className="text-gray-600">{selectedPoint.address}</p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {selectedPoint.district ? `${selectedPoint.district} · ` : ''}代碼:{selectedPoint.code}
                      </p>
                      {selectedPoint.hours && (
                        <p className="text-gray-500 text-xs pt-1 border-t mt-1">
                          🕒 {selectedPoint.hours}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4️⃣ 搜尋 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      搜尋{isLocker ? '自助櫃' : '順豐站'}
                    </label>
                    <input
                      value={sfSearch}
                      onChange={(e) => setSfSearch(e.target.value)}
                      className={inputClass}
                      placeholder="輸入名稱 / 代碼 / 地址關鍵字"
                    />
                  </div>

                  {/* 5️⃣ 手動輸入代碼(選填) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      或自行輸入{isLocker ? '自助櫃' : '順豐站'}代碼
                    </label>
                    <input
                      value={sfStationCode}
                      onChange={(e) => {
                        setSfStationCode(e.target.value)
                        setSelectedPoint(null)
                        setSfStationName('')
                      }}
                      className={inputClass}
                      placeholder="可手動輸入代碼" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">收件地址 <span className="text-red-400">*</span></label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder="詳細收件地址" />
                </div>
              )}

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

              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">請以 <span className="font-medium text-black">{payMethod === 'FPS' ? '轉數快 FPS' : 'PayMe'}</span> 付款</p>
                <p className="text-2xl font-bold mb-4">HK${grandTotal}</p>

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

              <div className="border border-gray-100 rounded-xl p-5">
                <p className="text-sm font-medium mb-2">上載付款截圖 <span className="text-red-400">*</span></p>
                <p className="text-xs text-gray-400 mb-3">過數後請截圖上載,我哋核對後會開始製作。</p>

                {proofUrl ? (
                  <div className="relative inline-block">
                    <img src={proofPreview} alt="付款截圖" className="w-40 rounded-lg border" />
                    <button onClick={() => { setProofUrl(''); setProofPreview('') }}
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
              <div className="flex justify-between text-sm text-gray-600">
                <span>商品小計</span>
                <span>HK${totalAmount}</span>
              </div>
              {totalSaved > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>特價優惠</span>
                  <span>− HK${totalSaved}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">運費({shipInfo.carrier})</span>
                <span>
                  {shippingFee > 0
                    ? `HK$${shippingFee}`
                    : <span className="text-green-600">免費</span>}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1">
                <span>總計</span>
                <span>HK${grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout