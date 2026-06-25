import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PhotoEditor from '../components/PhotoEditor'
import PuzzleEditor from '../components/PuzzleEditor'

// ⭐ 澳門預設順豐站(氹仔華南工廈)
const MO_DEFAULT_STATION = '853AA'

// ⭐ 價目預設值(DB 讀到之前頂住)
const DEFAULT_PRICING = {
  single: { 1: 298, 2: 398, 3: 488, 4: 568, 5: 648, 6: 728, 7: 808, 8: 868, 9: 928 },
  multi: { 1: 298, 2: 478, 3: 628 },
}

// ⭐ 運費預設值(DB 讀到之前頂住)
const SHIPPING = {
  香港: { carrier: '順豐速運', fee: 0 },
  內地: { carrier: '順豐速運', fee: 0 },
  澳門: { carrier: '順豐速運', fee: 60 },
  台灣: { carrier: '平郵 / 其他快遞', fee: 80 },
  其他: { carrier: '平郵 / 其他快遞', fee: 150 },
}
const FEE_KEY = { 香港: 'hk_fee', 內地: 'cn_fee', 澳門: 'mo_fee', 台灣: 'tw_fee', 其他: 'other_fee' }
const REGION_ORDER = { 香港島: 0, 九龍: 1, 新界: 2, 離島: 3, 其他: 9 }

const REGION_AREAS = {
  香港島: [
    '中環', '上環', '西環', '西營盤', '堅尼地城', '石塘咀', '金鐘', '半山', '山頂',
    '摩星嶺', '薄扶林', '數碼港',
    '灣仔', '銅鑼灣', '跑馬地', '大坑', '渣甸山', '掃桿埔', '天后', '炮台山',
    '北角', '鰂魚涌', '太古', '西灣河', '筲箕灣', '柴灣', '小西灣',
    '杏花邨', '康山', '愛秩序灣',
    '香港仔', '鴨脷洲', '黃竹坑', '深水灣', '淺水灣', '赤柱', '石澳', '舂坎角',
    '田灣', '華富', '海洋公園', '港島',
  ],
  九龍: [
    '尖沙咀', '尖沙嘴', '尖東', '佐敦', '油麻地', '旺角', '太子', '大角咀', '油尖旺',
    '深水埗', '長沙灣', '荔枝角', '美孚', '石硤尾', '南昌', '又一村', '又一城',
    '大窩坪', '昂船洲',
    '九龍城', '九龍塘', '土瓜灣', '紅磡', '何文田', '馬頭角', '馬頭圍', '啟德',
    '海心', '黃埔', '老龍坑',
    '黃大仙', '鑽石山', '新蒲崗', '樂富', '慈雲山', '橫頭磡', '東頭', '竹園',
    '彩虹', '牛池灣', '牛頭角', '彩雲',
    '觀塘', '九龍灣', '藍田', '油塘', '秀茂坪', '茶果嶺', '佐敦谷', '鯉魚門', '坪石',
    '九龍',
  ],
  新界: [
    '荃灣', '葵涌', '葵芳', '葵興', '青衣', '大窩口', '荔景', '梨木樹', '石圍角',
    '汀九', '深井', '青龍頭',
    '屯門', '元朗', '天水圍', '洪水橋', '流浮山', '錦田', '錦上路', '八鄉', '十八鄉',
    '新田', '落馬洲', '屏山', '廈村', '藍地', '掃管笏', '小欖',
    '上水', '粉嶺', '北區', '沙頭角', '打鼓嶺', '古洞', '坪輋', '聯和墟', '華明',
    '大埔', '太和', '大尾督', '林村', '汀角', '船灣', '康樂園',
    '沙田', '大圍', '火炭', '馬鞍山', '小瀝源', '石門', '烏溪沙', '第一城',
    '車公廟', '九肚',
    '西貢', '將軍澳', '坑口', '調景嶺', '寶琳', '康城', '清水灣', '蠔涌', '北潭涌',
    '日出康城', '新界',
  ],
  離島: [
    '東涌', '大嶼山', '梅窩', '愉景灣', '貝澳', '長沙', '塘福', '大澳', '昂坪',
    '赤鱲角', '赤臘角', '機場', '亞洲國際博覽館',
    '長洲', '坪洲', '南丫島', '榕樹灣', '索罟灣', '馬灣', '喜靈洲', '蒲台島', '離島',
  ],
}

function regionOf(d = '') {
  for (const region of ['香港島', '九龍', '新界', '離島']) {
    if (REGION_AREAS[region].some((kw) => d.includes(kw))) return region
  }
  return '其他'
}

function Order() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [activeIdx, setActiveIdx] = useState(0)

  // ⭐ 客製化資料
  const [order, setOrder] = useState({
    mode: null,          // 'A' | 'B'
    phone_model: null,
    plateCount: 1,       // 模式 A:1–9
    shellCount: 1,       // 模式 B:1–3
    bMode: 'separate',   // 模式 B:'puzzle' | 'separate'
    plates: [],          // 模式 A / B-separate:每格一個 photo
    puzzle: null,        // 模式 B-puzzle
  })

  // ⭐ 後台資料
  const [phoneModelList, setPhoneModelList] = useState([])
  const [pricing, setPricing] = useState(DEFAULT_PRICING)

  // 收件資料
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('香港')
  const [note, setNote] = useState('')
  const [payMethod, setPayMethod] = useState('FPS')

  // 送貨
  const [deliveryType, setDeliveryType] = useState('sf_store')
  const [sfStationCode, setSfStationCode] = useState('')
  const [sfStationName, setSfStationName] = useState('')
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [sfPoints, setSfPoints] = useState([])
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [sfDistrict, setSfDistrict] = useState('')
  const [sfSearch, setSfSearch] = useState('')

  // 設定 / 付款
  const [settings, setSettings] = useState(null)
  const [shippingFees, setShippingFees] = useState(null)
  const [proofUrl, setProofUrl] = useState('')
  const [proofPreview, setProofPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // ⭐ 讀手機型號(後台 active)
  useEffect(() => {
    supabase
      .from('phone_models')
      .select('name')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setPhoneModelList((data || []).map((m) => m.name)))
  }, [])

  // ⭐ 讀價目
  useEffect(() => {
    supabase
      .from('store_settings').select('value').eq('key', 'pricing').single()
      .then(({ data }) => {
        if (data?.value) {
          setPricing({
            single: { ...DEFAULT_PRICING.single, ...(data.value.single || {}) },
            multi: { ...DEFAULT_PRICING.multi, ...(data.value.multi || {}) },
          })
        }
      })
  }, [])

  // 讀收款設定
  useEffect(() => {
    supabase
      .from('store_settings').select('value').eq('key', 'payment').single()
      .then(({ data }) => setSettings(data?.value || {}))
  }, [])

  // 讀運費設定
  useEffect(() => {
    supabase
      .from('store_settings').select('value').eq('key', 'shipping').single()
      .then(({ data }) => setShippingFees(data?.value || null))
  }, [])

  // 切換地區:清空篩選 + 校正派送方式(澳門無自助櫃)
  useEffect(() => {
    setSfDistrict('')
    setSfSearch('')
    setDeliveryType((dt) => (region === '澳門' && dt === 'sf_locker' ? 'sf_store' : dt))
  }, [region])

  // 讀順豐點(分批攞晒)
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
        if (data.length < pageSize) break
        from += pageSize
      }
      setSfPoints(all)
      setLoadingPoints(false)
    }

    loadPoints()
    setSfStationCode(''); setSfStationName(''); setSelectedPoint(null)
    setSfDistrict(''); setSfSearch('')
  }, [deliveryType])

  function pointLabel(s) {
    if (s?.name && s.name !== s.code) return s.name
    return s?.address || ''
  }
  function pickPoint(st) {
    if (!st) { setSelectedPoint(null); setSfStationCode(''); setSfStationName(''); return }
    setSelectedPoint(st); setSfStationCode(st.code); setSfStationName(pointLabel(st))
  }

  const isHK = region === '香港'
  const isMO = region === '澳門'
  const isLocker = deliveryType === 'sf_locker'
  const useSFStore =
    (isHK && (deliveryType === 'sf_store' || deliveryType === 'sf_locker')) ||
    (isMO && deliveryType === 'sf_store')

  // 自動揀點(澳門優先 853AA)
  useEffect(() => {
    if (deliveryType === 'home' || loadingPoints) return
    const mo = region === '澳門'
    const rp = sfPoints.filter((s) => {
      const macau = (s.district || '').includes('澳門')
      return mo ? macau : !macau
    })
    const base = sfDistrict ? rp.filter((s) => s.district === sfDistrict) : rp
    if (mo) pickPoint(base.find((s) => s.code === MO_DEFAULT_STATION) || base[0] || null)
    else pickPoint(base[0] || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfDistrict, deliveryType, region, loadingPoints, sfPoints])

  const regionPoints = sfPoints.filter((s) => {
    const macau = (s.district || '').includes('澳門')
    return isMO ? macau : !macau
  })
  const districts = [...new Set(regionPoints.map((s) => s.district).filter(Boolean))].sort((a, b) => {
    const ra = REGION_ORDER[regionOf(a)] ?? 99
    const rb = REGION_ORDER[regionOf(b)] ?? 99
    if (ra !== rb) return ra - rb
    return a.localeCompare(b, 'zh-Hant')
  })
  const groupedDistricts = districts.reduce((acc, d) => {
    const r = regionOf(d)
    ;(acc[r] = acc[r] || []).push(d)
    return acc
  }, {})
  const filteredPoints = regionPoints.filter((s) => {
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
  function onPickStation(e) {
    const st = regionPoints.find((s) => s.code === e.target.value)
    pickPoint(st || null)
  }

  // ⭐ 客製化衍生值
  const isPuzzle = order.mode === 'B' && order.bMode === 'puzzle'
  const itemCount = order.mode === 'A' ? order.plateCount : order.shellCount
  const itemLabel = order.mode === 'A' ? '底板' : '手機殼'

  const unitPrice =
    order.mode === 'A'
      ? (pricing.single[order.plateCount] || 0)
      : order.mode === 'B'
      ? (pricing.multi[order.shellCount] || 0)
      : 0

  const modeDesc =
    order.mode === 'A'
      ? `單殼 + ${order.plateCount} 片底板`
      : order.mode === 'B'
      ? `${order.shellCount} 個殼${isPuzzle ? '(拼圖大圖)' : '(獨立圖)'}`
      : ''

  // 價錢
  const shipInfo = SHIPPING[region] || SHIPPING['其他']
  const shippingFee =
    shippingFees && shippingFees[FEE_KEY[region]] != null
      ? shippingFees[FEE_KEY[region]]
      : shipInfo.fee
  const grandTotal = unitPrice + shippingFee

  // ⭐ 結構性改動時清空已上載相片
  function resetPhotos(patch) {
    setOrder((o) => ({ ...o, ...patch, plates: [], puzzle: null }))
    setActiveIdx(0)
  }
  function updatePlate(i, photo) {
    setOrder((o) => {
      const p = [...o.plates]
      p[i] = photo
      return { ...o, plates: p }
    })
  }

  // ⭐ step 2 構圖完成?
  function step2Done() {
    if (order.mode === 'B' && order.bMode === 'puzzle') return !!order.puzzle?.imgSrc
    for (let i = 0; i < itemCount; i++) {
      if (!order.plates[i]?.imgSrc) return false
    }
    return itemCount > 0
  }

  // step 1 → 2 驗證
  function goToPhotos() {
    if (!order.mode) return alert('請揀客製方式')
    if (!order.phone_model) return alert('請揀手機型號')
    setStep(2)
    window.scrollTo(0, 0)
  }

  // step 3 → 4 前驗證
  function goToConfirm() {
    if (!name.trim()) return alert('請填寫姓名')
    if (!phone.trim()) return alert('請填寫聯絡電話')
    if (useSFStore) {
      if (!sfStationCode.trim()) return alert(`請揀${isLocker ? '順豐自助櫃' : '順豐站'}或輸入代碼`)
    } else {
      if (!address.trim()) return alert('請填寫收件地址')
    }
    if (!proofUrl) return alert('請先上載付款截圖')
    setStep(4)
    window.scrollTo(0, 0)
  }

  // 上載付款截圖
  async function handleUploadProof(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('payments').upload(path, file, { upsert: false })
    if (error) {
      alert('截圖上載失敗:' + error.message)
      setUploading(false); e.target.value = ''; return
    }
    setProofUrl(path)
    setProofPreview(URL.createObjectURL(file))
    setUploading(false); e.target.value = ''
  }

  async function uploadCustomPhoto(photo) {
    let blob = photo?.file
    if (!(blob instanceof File || blob instanceof Blob)) {
      if (!photo?.imgSrc) throw new Error('搵唔到相片')
      const res = await fetch(photo.imgSrc)
      blob = await res.blob()
    }
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const path = `custom/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('customer-uploads')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('customer-uploads').getPublicUrl(path)
    return data.publicUrl
  }

  // 送出訂單
  async function handleSubmit() {
    setSubmitting(true)
    try {
      // 1️⃣ 上載客製相片,整理 custom_plates
      let plates = []
      let coverUrl = null
      let coverTransform = null

      if (order.mode === 'B' && order.bMode === 'puzzle') {
        const pz = order.puzzle
        const url = await uploadCustomPhoto({ file: pz.file, imgSrc: pz.imgSrc })
        coverUrl = url
        plates = Array.from({ length: order.shellCount }).map((_, i) => ({
          index: i + 1,
          type: 'puzzle_slice',
          custom_photo_url: url,
          slice: { index: i, total: order.shellCount },
          offset: pz.offsets?.[i] || { dx: 0, dy: 0 },
          scale: pz.scale,
          frameW: pz.frameW,
          frameH: pz.frameH,
          totalW: pz.totalW,
        }))
        coverTransform = {
          puzzle: true,
          count: order.shellCount,
          scale: pz.scale,
          totalW: pz.totalW,
          frameW: pz.frameW,
          frameH: pz.frameH,
        }
      } else {
        const type = order.mode === 'A' ? 'plate' : 'shell'
        for (let i = 0; i < itemCount; i++) {
          const ph = order.plates[i]
          const url = await uploadCustomPhoto(ph)
          const t = {
            scale: ph.scale ?? 1,
            posX: ph.posX ?? 0,
            posY: ph.posY ?? 0,
            frameW: ph.frameW ?? 260,
            frameH: ph.frameH ?? 540,
          }
          plates.push({ index: i + 1, type, custom_photo_url: url, photo_transform: t })
          if (i === 0) { coverUrl = url; coverTransform = t }
        }
      }

      // 2️⃣ 送貨描述
      const sfStation = useSFStore
        ? (sfStationName ? `${sfStationName} (${sfStationCode.trim()})` : sfStationCode.trim())
        : null
      const pickupLabel = isLocker ? '順豐自助櫃' : '順豐站自取'
      let shippingMethod
      if (isHK) shippingMethod = useSFStore ? pickupLabel : '順豐送貨上門'
      else if (isMO) shippingMethod = useSFStore ? '順豐站自取' : '順豐送貨上門'
      else if (region === '內地') shippingMethod = '順豐送貨上門'
      else shippingMethod = '平郵 / 其他快遞'
      const finalAddress = useSFStore
        ? `${isLocker ? '自助櫃' : '順豐站'}:${sfStation}`
        : address.trim()

      const orderNumber = 'C' + Date.now().toString().slice(-9)

      // 3️⃣ 寫入 orders
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number:     orderNumber,
          phone_model:      order.phone_model,
          case_type:        `客製化 — ${modeDesc}`,
          customer_name:    name.trim(),
          customer_phone:   phone.trim(),
          customer_address: finalAddress,
          currency:         'HKD',
          amount:           grandTotal,
          payment_method:   payMethod,

          region,
          shipping_method:  shippingMethod,
          shipping_fee:     shippingFee ?? 0,
          sf_station:       sfStation || null,

          // 客製化
          is_custom:        true,
          custom_mode:      order.mode,
          shell_count:      order.mode === 'B' ? order.shellCount : null,
          plate_count:      order.mode === 'A' ? order.plateCount : null,
          custom_plates:    plates,
          custom_photo_url: coverUrl,
          photo_transform:  coverTransform,
          product_id:       null,
          product_name:     modeDesc,

          note: [note.trim(), proofUrl ? `付款證明:${proofUrl}` : '']
                  .filter(Boolean).join('\n') || null,
        })
        .select('order_number')
        .single()

      if (error) throw error
      navigate('/order-success', { state: { orderNumber: data?.order_number || orderNumber } })
    } catch (e) {
      console.error(e)
      alert('落單失敗:\n' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pay = settings || {}
  const steps = ['揀客製方式', '上載相片', '填資料', '確認落單']

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 進度條 */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${active ? 'bg-black text-white' : done ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`mt-1 text-xs text-center ${active ? 'text-black font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1:揀客製方式 + 型號 + 數量 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">選擇客製方式</h2>
            <p className="text-sm text-gray-500 mb-4">兩種模式唔可以撈埋一齊。如需混合,請分開落兩張單。</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button onClick={() => resetPhotos({ mode: 'A' })}
                className={`p-5 rounded-xl border text-left transition ${
                  order.mode === 'A' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}>
                <p className="font-medium">單殼多片</p>
                <p className="text-sm text-gray-500 mt-1">一個殼 + 多片底板,日日換款。</p>
              </button>
              <button onClick={() => resetPhotos({ mode: 'B' })}
                className={`p-5 rounded-xl border text-left transition ${
                  order.mode === 'B' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}>
                <p className="font-medium">多殼(情侶 / 家人)</p>
                <p className="text-sm text-gray-500 mt-1">2–3 個殼拼成大圖,或各自獨立圖。</p>
              </button>
            </div>
          </div>

          {/* 型號 */}
          {order.mode && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                手機型號
                {order.mode === 'B' && <span className="text-gray-400 font-normal"> (全部殼用同一型號)</span>}
              </h3>
              {phoneModelList.length === 0 ? (
                <p className="text-sm text-gray-400">未有型號,請聯絡商家。</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {phoneModelList.map((model) => {
                    const selected = order.phone_model === model
                    return (
                      <button key={model} onClick={() => setOrder((o) => ({ ...o, phone_model: model }))}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition
                        ${selected ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                        {model}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 模式 A:片數 */}
          {order.mode === 'A' && (
            <div>
              <h3 className="text-sm font-medium mb-2">底板片數(1–9 片)</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} onClick={() => resetPhotos({ mode: 'A', plateCount: n })}
                    className={`py-3 rounded-lg border text-sm font-medium transition ${
                      order.plateCount === n ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    {n} 片
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 模式 B:殼數 + 子模式 */}
          {order.mode === 'B' && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">手機殼數量(1–3 個)</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => resetPhotos({ mode: 'B', shellCount: n, bMode: n === 1 ? 'separate' : order.bMode })}
                      className={`py-3 rounded-lg border text-sm font-medium transition ${
                        order.shellCount === n ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      {n} 個
                    </button>
                  ))}
                </div>
              </div>

              {order.shellCount >= 2 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">構圖方式</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => resetPhotos({ mode: 'B', bMode: 'puzzle' })}
                      className={`p-4 rounded-lg border text-left text-sm transition ${
                        order.bMode === 'puzzle' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      <p className="font-medium">拼圖大圖</p>
                      <p className="text-gray-500 mt-1">上載一張大圖,自動切成 {order.shellCount} 份。</p>
                    </button>
                    <button onClick={() => resetPhotos({ mode: 'B', bMode: 'separate' })}
                      className={`p-4 rounded-lg border text-left text-sm transition ${
                        order.bMode === 'separate' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      <p className="font-medium">各自獨立圖</p>
                      <p className="text-gray-500 mt-1">每個殼分別上載一張相。</p>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 價錢提示 */}
          {order.mode && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">{modeDesc}</span>
              <span className="font-bold">HK${unitPrice}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={!order.mode || !order.phone_model} onClick={goToPhotos}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2:上載相片 + 構圖 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-1">上載相片並調整構圖</h2>
          <p className="text-sm text-gray-500 mb-4">{order.phone_model} ／ {modeDesc}</p>

          {isPuzzle ? (
            <PuzzleEditor
              count={order.shellCount}
              value={order.puzzle}
              onChange={(pz) => setOrder((o) => ({ ...o, puzzle: pz }))}
            />
          ) : (
            <>
              {itemCount > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {Array.from({ length: itemCount }).map((_, i) => {
                    const filled = !!order.plates[i]?.imgSrc
                    return (
                      <button key={i} onClick={() => setActiveIdx(i)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          activeIdx === i ? 'border-black bg-black text-white'
                          : filled ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
                        }`}>
                        {itemLabel} {i + 1} {filled && '✓'}
                      </button>
                    )
                  })}
                </div>
              )}
              <PhotoEditor
                key={activeIdx}
                value={order.plates[activeIdx]}
                onChange={(photo) => updatePlate(activeIdx, photo)}
              />
            </>
          )}

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">返回</button>
            <button disabled={!step2Done()} onClick={() => { setStep(3); window.scrollTo(0, 0) }}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">下一步</button>
          </div>
        </div>
      )}

      {/* Step 3:填資料 + 付款 */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold mb-1">填寫收件資料及付款</h2>
          <p className="text-sm text-gray-500 mb-2">{order.phone_model} ／ {modeDesc}</p>

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
              <option value="內地">中國內地</option>
              <option value="澳門">澳門</option>
              <option value="台灣">台灣</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
            <span className="text-gray-600">物流:{shipInfo.carrier}</span>
            <span className={shippingFee > 0 ? 'text-gray-800 font-medium' : 'text-green-600 font-medium'}>
              {shippingFee > 0 ? `運費 HK$${shippingFee}` : '免運費'}
            </span>
          </div>

          {(isHK || isMO) && (
            <div>
              <label className="block text-sm font-medium mb-2">派送方式</label>
              <div className={`grid ${isHK ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                {(isHK
                  ? [['sf_store', '順豐站自取'], ['sf_locker', '順豐自助櫃'], ['home', '順豐送貨上門']]
                  : [['sf_store', '順豐站自取'], ['home', '順豐送貨上門']]
                ).map(([val, label]) => (
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

          {useSFStore ? (
            <div className="space-y-3">
              {isHK && (
                <div>
                  <label className="block text-sm font-medium mb-2">地區</label>
                  <select value={sfDistrict} onChange={(e) => setSfDistrict(e.target.value)} className={inputClass}>
                    <option value="">全部地區</option>
                    {['香港島', '九龍', '新界', '離島', '其他'].map((r) =>
                      groupedDistricts[r] ? (
                        <optgroup key={r} label={r}>
                          {groupedDistricts[r].map((dd) => (
                            <option key={dd} value={dd}>{dd}</option>
                          ))}
                        </optgroup>
                      ) : null
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  揀{isLocker ? '順豐自助櫃' : '順豐站'}
                  {loadingPoints && <span className="text-xs text-gray-400 ml-2">載入緊…</span>}
                </label>
                <select value={sfStationCode} onChange={onPickStation} className={inputClass}>
                  <option value="">
                    {loadingPoints ? '載入緊…' : filteredPoints.length === 0 ? '冇符合嘅結果' : '請選擇…'}
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
                  <p className="text-xs text-gray-400 mt-1">結果太多,請揀地區或輸入關鍵字縮窄範圍。</p>
                )}
              </div>

              {selectedPoint && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm space-y-1">
                  {selectedPoint.name && selectedPoint.name !== selectedPoint.code && (
                    <p className="font-medium">{selectedPoint.name}</p>
                  )}
                  {selectedPoint.address && <p className="text-gray-600">{selectedPoint.address}</p>}
                  <p className="text-gray-400 text-xs">
                    {selectedPoint.district ? `${selectedPoint.district} · ` : ''}代碼:{selectedPoint.code}
                  </p>
                  {selectedPoint.hours && (
                    <p className="text-gray-500 text-xs pt-1 border-t mt-1">🕒 {selectedPoint.hours}</p>
                  )}
                </div>
              )}

              {isHK && (
                <div>
                  <label className="block text-sm font-medium mb-2">搜尋{isLocker ? '自助櫃' : '順豐站'}</label>
                  <input value={sfSearch} onChange={(e) => setSfSearch(e.target.value)} className={inputClass}
                    placeholder="輸入名稱 / 代碼 / 地址關鍵字" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">或自行輸入{isLocker ? '自助櫃' : '順豐站'}代碼</label>
                <input value={sfStationCode}
                  onChange={(e) => { setSfStationCode(e.target.value); setSelectedPoint(null); setSfStationName('') }}
                  className={inputClass} placeholder="可手動輸入代碼" />
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

          <div className="border border-gray-100 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">
              請以 <span className="font-medium text-black">{payMethod === 'FPS' ? '轉數快 FPS' : 'PayMe'}</span> 付款
            </p>
            <p className="text-2xl font-bold mb-4">HK${grandTotal}</p>
            {payMethod === 'FPS' ? (
              <div className="space-y-2 text-sm">
                {pay.fps_phone && <p>FPS 電話 / ID:<span className="font-medium">{pay.fps_phone}</span></p>}
                {pay.fps_name && <p>收款人:<span className="font-medium">{pay.fps_name}</span></p>}
                {pay.fps_qr_url && <img src={pay.fps_qr_url} alt="FPS QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />}
                {!pay.fps_phone && !pay.fps_qr_url && (
                  <p className="text-amber-600">商家未設定 FPS 收款資料,請用 WhatsApp 聯絡。</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {pay.payme_link && (
                  <a href={pay.payme_link} target="_blank" rel="noreferrer" className="inline-block text-blue-600 underline break-all">{pay.payme_link}</a>
                )}
                {pay.payme_qr_url && <img src={pay.payme_qr_url} alt="PayMe QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />}
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

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">返回</button>
            <button onClick={goToConfirm}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium">下一步:確認</button>
          </div>
        </div>
      )}

      {/* Step 4:確認落單 */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold">確認訂單</h2>

          {/* 客製預覽 */}
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <p className="font-medium">{modeDesc}</p>
                <p className="text-gray-500">型號:{order.phone_model}</p>
              </div>
              <span className="font-medium">HK${unitPrice}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isPuzzle ? (
                order.puzzle?.imgSrc && (
                  <img src={order.puzzle.imgSrc} alt="拼圖大圖" className="h-20 object-cover rounded-lg border" />
                )
              ) : (
                Array.from({ length: itemCount }).map((_, i) => (
                  order.plates[i]?.imgSrc && (
                    <img key={i} src={order.plates[i].imgSrc} alt={`${itemLabel}${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border" />
                  )
                ))
              )}
            </div>
          </div>

          {/* 收件資料 */}
          <div className="border border-gray-100 rounded-xl p-5 text-sm space-y-1">
            <p><span className="text-gray-500">收件人:</span> {name}</p>
            <p><span className="text-gray-500">電話:</span> {phone}</p>
            <p><span className="text-gray-500">地區:</span> {region}</p>
            <p>
              <span className="text-gray-500">派送:</span>{' '}
              {useSFStore
                ? `${isLocker ? '順豐自助櫃' : '順豐站自取'} — ${sfStationName || ''}${sfStationCode ? ` (${sfStationCode})` : ''}`
                : (isHK || region === '內地' || isMO ? '順豐送貨上門' : '平郵 / 其他快遞') + ` — ${address}`}
            </p>
            <p><span className="text-gray-500">付款:</span> {payMethod === 'FPS' ? '轉數快 FPS' : 'PayMe'}</p>
            {note && <p><span className="text-gray-500">備註:</span> {note}</p>}
          </div>

          {/* 金額 */}
          <div className="border border-gray-100 rounded-xl p-5 text-sm space-y-2">
            <div className="flex justify-between text-gray-600"><span>商品</span><span>HK${unitPrice}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>運費({shipInfo.carrier})</span>
              <span>{shippingFee > 0 ? `HK$${shippingFee}` : <span className="text-green-600">免費</span>}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t"><span>總計</span><span>HK${grandTotal}</span></div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} disabled={submitting}
              className="px-6 py-2 rounded-lg border border-gray-300 font-medium disabled:opacity-50">返回</button>
            <button onClick={handleSubmit} disabled={submitting || uploading}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {submitting ? '提交緊…' : '確認落單'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order