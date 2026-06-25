import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PhotoEditor from '../components/PhotoEditor'
import PuzzleEditor from '../components/PuzzleEditor'
import { useLang } from '../context/LanguageContext'

const MO_DEFAULT_STATION = '853AA'

const DEFAULT_PRICING = {
  single: { 1: 298, 2: 398, 3: 488, 4: 568, 5: 648, 6: 728, 7: 808, 8: 868, 9: 928 },
  multi: { 1: 298, 2: 478, 3: 628 },
}

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

const REGION_LABEL_KEY = { 香港: 'hk', 內地: 'cn', 澳門: 'mo', 台灣: 'tw', 其他: 'other' }

function Order() {
  const navigate = useNavigate()
  const { t } = useLang()

  const [step, setStep] = useState(1)
  const [activeIdx, setActiveIdx] = useState(0)

  const [order, setOrder] = useState({
    mode: null,
    phone_model: null,
    plateCount: 1,
    shellCount: 1,
    bMode: 'separate',
    plates: [],
    puzzle: null,
  })

  const [phoneModelList, setPhoneModelList] = useState([])
  const [pricing, setPricing] = useState(DEFAULT_PRICING)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [region, setRegion] = useState('香港')
  const [note, setNote] = useState('')
  const [payMethod, setPayMethod] = useState('FPS')

  const [deliveryType, setDeliveryType] = useState('sf_store')
  const [sfStationCode, setSfStationCode] = useState('')
  const [sfStationName, setSfStationName] = useState('')
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [sfPoints, setSfPoints] = useState([])
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [sfDistrict, setSfDistrict] = useState('')
  const [sfSearch, setSfSearch] = useState('')

  const [settings, setSettings] = useState(null)
  const [shippingFees, setShippingFees] = useState(null)
  const [proofUrl, setProofUrl] = useState('')
  const [proofPreview, setProofPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  const [discountInput, setDiscountInput] = useState('')
  const [appliedCode, setAppliedCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [applying, setApplying] = useState(false)

  const regionLabel = (r) => t('region.' + (REGION_LABEL_KEY[r] || 'other'))
  const carrierLabel = (r) => (['香港', '內地', '澳門'].includes(r) ? t('delivery.carrierSF') : t('delivery.carrierOther'))

  useEffect(() => {
    supabase
      .from('phone_models')
      .select('name')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setPhoneModelList((data || []).map((m) => m.name)))
  }, [])

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

  useEffect(() => {
    supabase
      .from('store_settings').select('value').eq('key', 'payment').single()
      .then(({ data }) => setSettings(data?.value || {}))
  }, [])

  useEffect(() => {
    supabase
      .from('store_settings').select('value').eq('key', 'shipping').single()
      .then(({ data }) => setShippingFees(data?.value || null))
  }, [])

  useEffect(() => {
    setSfDistrict('')
    setSfSearch('')
    setDeliveryType((dt) => (region === '澳門' && dt === 'sf_locker' ? 'sf_store' : dt))
  }, [region])

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

  const isPuzzle = order.mode === 'B' && order.bMode === 'puzzle'
  const itemCount = order.mode === 'A' ? order.plateCount : order.shellCount
  const itemLabel = order.mode === 'A' ? t('order.plateLabel') : t('order.shellLabel')

  const unitPrice =
    order.mode === 'A'
      ? (pricing.single[order.plateCount] || 0)
      : order.mode === 'B'
      ? (pricing.multi[order.shellCount] || 0)
      : 0

  // ⭐ 顯示用(跟語言)
  const modeDescDisplay =
    order.mode === 'A'
      ? t('order.descA').replace('{n}', order.plateCount)
      : order.mode === 'B'
      ? (isPuzzle ? t('order.descBPuzzle') : t('order.descBSep')).replace('{n}', order.shellCount)
      : ''

  // ⭐ 存 DB 用(固定中文,後台一致)
  const modeDescZh =
    order.mode === 'A'
      ? `單殼 + ${order.plateCount} 片底板`
      : order.mode === 'B'
      ? `${order.shellCount} 個殼${isPuzzle ? '(拼圖大圖)' : '(獨立圖)'}`
      : ''

  const shipInfo = SHIPPING[region] || SHIPPING['其他']
  const shippingFee =
    shippingFees && shippingFees[FEE_KEY[region]] != null
      ? shippingFees[FEE_KEY[region]]
      : shipInfo.fee
  const grandTotal = Math.max(0, unitPrice - discountAmount) + shippingFee

  function changeStructure(patch) {
    const next = { ...order, ...patch }
    const structureChanged =
      next.mode !== order.mode ||
      next.plateCount !== order.plateCount ||
      next.shellCount !== order.shellCount ||
      next.bMode !== order.bMode
    if (structureChanged) {
      setOrder({ ...next, plates: [], puzzle: null })
      setActiveIdx(0)
    } else {
      setOrder(next)
    }
  }
  function updatePlate(i, photo) {
    setOrder((o) => {
      const p = [...o.plates]
      p[i] = photo
      return { ...o, plates: p }
    })
  }

  function step2Done() {
    if (order.mode === 'B' && order.bMode === 'puzzle') return !!order.puzzle?.imgSrc
    for (let i = 0; i < itemCount; i++) {
      if (!order.plates[i]?.imgSrc) return false
    }
    return itemCount > 0
  }

  function goToPhotos() {
    if (!order.mode) return alert(t('order.alertMode'))
    if (!order.phone_model) return alert(t('order.alertModel'))
    setStep(2)
    window.scrollTo(0, 0)
  }

  function goToConfirm() {
    if (!name.trim()) return alert(t('checkout.alertName'))
    if (!phone.trim()) return alert(t('checkout.alertPhone'))
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return alert(t('order.alertEmail'))
    if (useSFStore) {
      if (!sfStationCode.trim()) return alert(isLocker ? t('checkout.alertStationLocker') : t('checkout.alertStationStore'))
    } else {
      if (!address.trim()) return alert(t('checkout.alertAddress'))
    }
    if (!proofUrl) return alert(t('order.alertProof'))
    setStep(4)
    window.scrollTo(0, 0)
  }

  async function applyDiscount() {
    const code = discountInput.trim()
    if (!code) return
    setApplying(true)
    setDiscountError('')
    const { data, error } = await supabase.rpc('apply_discount', {
      p_code: code,
      p_subtotal: unitPrice,
      p_phone: phone.trim(),
      p_is_custom: true,
      p_collections: [],
    })
    setApplying(false)
    if (error) {
      setAppliedCode(''); setDiscountAmount(0)
      setDiscountError(error.message || t('discount.invalid'))
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row?.norm_code) { setDiscountError(t('discount.invalid')); return }
    setAppliedCode(row.norm_code)
    setDiscountAmount(Number(row.discount) || 0)
  }

  function clearDiscount() {
    setAppliedCode(''); setDiscountAmount(0)
    setDiscountInput(''); setDiscountError('')
  }

  async function handleUploadProof(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('payments').upload(path, file, { upsert: false })
    if (error) {
      alert(t('checkout.uploadFail') + error.message)
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

  async function handleSubmit() {
    setSubmitting(true)
    try {
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
          const tr = {
            scale: ph.scale ?? 1,
            posX: ph.posX ?? 0,
            posY: ph.posY ?? 0,
            frameW: ph.frameW ?? 260,
            frameH: ph.frameH ?? 540,
          }
          plates.push({ index: i + 1, type, custom_photo_url: url, photo_transform: tr })
          if (i === 0) { coverUrl = url; coverTransform = tr }
        }
      }

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

      const { data, error } = await supabase.rpc('create_custom_order', {
        p_mode:             order.mode,
        p_phone_model:      order.phone_model,
        p_plate_count:      order.mode === 'A' ? order.plateCount : null,
        p_shell_count:      order.mode === 'B' ? order.shellCount : null,
        p_b_mode:           order.bMode,
        p_custom_plates:    plates,
        p_custom_photo_url: coverUrl,
        p_photo_transform:  coverTransform,
        p_product_name:     modeDescZh,
        p_case_type:        `客製化 — ${modeDescZh}`,
        p_customer_name:    name.trim(),
        p_customer_phone:   phone.trim(),
        p_customer_address: finalAddress,
        p_region:           region,
        p_shipping_method:  shippingMethod,
        p_sf_station:       sfStation || null,
        p_payment_method:   payMethod,
        p_proof_url:        proofUrl,
        p_note:             note.trim() || null,
        p_customer_email:   email.trim() || null,
        p_discount_code:    appliedCode || null,
      })

      if (error) throw error
      const orderNumber = Array.isArray(data) ? data[0]?.order_number : data?.order_number
      navigate('/order-success', { state: { orderNumber } })
    } catch (e) {
      console.error(e)
      alert(t('order.orderFail') + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pay = settings || {}
  const steps = [t('order.steps0'), t('order.steps1'), t('order.steps2'), t('order.steps3')]

  // 確認頁:派送方式顯示(跟語言)
  const deliveryDisplay = useSFStore
    ? (isLocker ? t('delivery.sfLocker') : t('delivery.sfStore'))
    : (isHK || region === '內地' || isMO ? t('delivery.home') : t('delivery.other'))

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

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-1">{t('order.chooseMode')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('order.modeNote')}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button onClick={() => changeStructure({ mode: 'A' })}
                className={`p-5 rounded-xl border text-left transition ${
                  order.mode === 'A' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}>
                <p className="font-medium">{t('order.modeA')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('order.modeADesc')}</p>
              </button>
              <button onClick={() => changeStructure({ mode: 'B' })}
                className={`p-5 rounded-xl border text-left transition ${
                  order.mode === 'B' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                }`}>
                <p className="font-medium">{t('order.modeB')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('order.modeBDesc')}</p>
              </button>
            </div>
          </div>

          {/* 型號 */}
          {order.mode && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                {t('order.phoneModel')}
                {order.mode === 'B' && <span className="text-gray-400 font-normal"> {t('order.allSameModel')}</span>}
              </h3>
              {phoneModelList.length === 0 ? (
                <p className="text-sm text-gray-400">{t('order.noModels')}</p>
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
              <h3 className="text-sm font-medium mb-2">{t('order.plateCount')}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} onClick={() => changeStructure({ mode: 'A', plateCount: n })}
                    className={`py-3 rounded-lg border text-sm font-medium transition ${
                      order.plateCount === n ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    {t('order.plateUnit').replace('{n}', n)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 模式 B */}
          {order.mode === 'B' && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">{t('order.shellCount')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => changeStructure({ mode: 'B', shellCount: n, bMode: n === 1 ? 'separate' : order.bMode })}
                      className={`py-3 rounded-lg border text-sm font-medium transition ${
                        order.shellCount === n ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      {t('order.shellUnit').replace('{n}', n)}
                    </button>
                  ))}
                </div>
              </div>

              {order.shellCount >= 2 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('order.layoutMode')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => changeStructure({ mode: 'B', bMode: 'puzzle' })}
                      className={`p-4 rounded-lg border text-left text-sm transition ${
                        order.bMode === 'puzzle' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      <p className="font-medium">{t('order.puzzle')}</p>
                      <p className="text-gray-500 mt-1">{t('order.puzzleDesc').replace('{n}', order.shellCount)}</p>
                    </button>
                    <button onClick={() => changeStructure({ mode: 'B', bMode: 'separate' })}
                      className={`p-4 rounded-lg border text-left text-sm transition ${
                        order.bMode === 'separate' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}>
                      <p className="font-medium">{t('order.separate')}</p>
                      <p className="text-gray-500 mt-1">{t('order.separateDesc')}</p>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 價錢提示 */}
          {order.mode && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-600">{modeDescDisplay}</span>
              <span className="font-bold">HK${unitPrice}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={!order.mode || !order.phone_model} onClick={goToPhotos}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
              {t('order.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-1">{t('order.uploadTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{order.phone_model} ／ {modeDescDisplay}</p>

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
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">{t('order.back')}</button>
            <button disabled={!step2Done()} onClick={() => { setStep(3); window.scrollTo(0, 0) }}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">{t('order.next')}</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold mb-1">{t('order.fillInfo')}</h2>
          <p className="text-sm text-gray-500 mb-2">{order.phone_model} ／ {modeDescDisplay}</p>

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.name')} <span className="text-red-400">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder={t('form.namePh')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('form.phone')} <span className="text-red-400">*</span></label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder={t('form.phonePh')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} placeholder={t('form.emailPh')} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.region')}</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
              <option value="香港">{t('region.hk')}</option>
              <option value="內地">{t('region.cn')}</option>
              <option value="澳門">{t('region.mo')}</option>
              <option value="台灣">{t('region.tw')}</option>
              <option value="其他">{t('region.other')}</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
            <span className="text-gray-600">{t('checkout.logistics').replace('{c}', carrierLabel(region))}</span>
            <span className={shippingFee > 0 ? 'text-gray-800 font-medium' : 'text-green-600 font-medium'}>
              {shippingFee > 0 ? t('checkout.shippingFee').replace('{n}', shippingFee) : t('checkout.freeShipping')}
            </span>
          </div>

          {(isHK || isMO) && (
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.deliveryMethod')}</label>
              <div className={`grid ${isHK ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                {(isHK
                  ? [['sf_store', t('delivery.sfStore')], ['sf_locker', t('delivery.sfLocker')], ['home', t('delivery.home')]]
                  : [['sf_store', t('delivery.sfStore')], ['home', t('delivery.home')]]
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
                  <label className="block text-sm font-medium mb-2">{t('sf.district')}</label>
                  <select value={sfDistrict} onChange={(e) => setSfDistrict(e.target.value)} className={inputClass}>
                    <option value="">{t('sf.allDistricts')}</option>
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
                  {isLocker ? t('sf.pickLocker') : t('sf.pick')}
                  {loadingPoints && <span className="text-xs text-gray-400 ml-2">{t('sf.loading')}</span>}
                </label>
                <select value={sfStationCode} onChange={onPickStation} className={inputClass}>
                  <option value="">
                    {loadingPoints ? t('sf.loading') : filteredPoints.length === 0 ? t('sf.noResult') : t('sf.select')}
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
                  <p className="text-xs text-gray-400 mt-1">{t('sf.tooMany')}</p>
                )}
              </div>

              {selectedPoint && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm space-y-1">
                  {selectedPoint.name && selectedPoint.name !== selectedPoint.code && (
                    <p className="font-medium">{selectedPoint.name}</p>
                  )}
                  {selectedPoint.address && <p className="text-gray-600">{selectedPoint.address}</p>}
                  <p className="text-gray-400 text-xs">
                    {selectedPoint.district ? `${selectedPoint.district} · ` : ''}{t('sf.code')}:{selectedPoint.code}
                  </p>
                  {selectedPoint.hours && (
                    <p className="text-gray-500 text-xs pt-1 border-t mt-1">🕒 {selectedPoint.hours}</p>
                  )}
                </div>
              )}

              {isHK && (
                <div>
                  <label className="block text-sm font-medium mb-2">{isLocker ? t('sf.searchLocker') : t('sf.search')}</label>
                  <input value={sfSearch} onChange={(e) => setSfSearch(e.target.value)} className={inputClass}
                    placeholder={t('sf.searchPh')} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">{isLocker ? t('sf.manualLocker') : t('sf.manual')}</label>
                <input value={sfStationCode}
                  onChange={(e) => { setSfStationCode(e.target.value); setSelectedPoint(null); setSfStationName('') }}
                  className={inputClass} placeholder={t('sf.manualPh')} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.address')} <span className="text-red-400">*</span></label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder={t('form.addressPh')} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t('form.note')}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} placeholder={t('form.notePh')} />
          </div>

          {/* 折扣碼 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('discount.label')}</label>
            {appliedCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <span className="text-green-700">
                  {t('discount.applied')} <span className="font-semibold">{appliedCode}</span>
                  ({t('discount.discountOf').replace('{n}', discountAmount)})
                </span>
                <button type="button" onClick={clearDiscount}
                  className="text-gray-400 hover:text-red-500 transition text-xs">{t('discount.remove')}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={discountInput}
                  onChange={(e) => { setDiscountInput(e.target.value); setDiscountError('') }}
                  className={inputClass} placeholder={t('discount.inputPh')} />
                <button type="button" onClick={applyDiscount} disabled={applying || !discountInput.trim()}
                  className="px-5 rounded-lg bg-black text-white text-sm font-medium disabled:bg-gray-300 whitespace-nowrap">
                  {applying ? t('discount.checking') : t('discount.apply')}
                </button>
              </div>
            )}
            {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium mb-2">{t('pay.method')}</label>
            <div className="grid grid-cols-2 gap-3">
              {['FPS', 'PayMe'].map((m) => (
                <button key={m} type="button" onClick={() => setPayMethod(m)}
                  className={`py-3 rounded-lg border text-sm font-medium transition ${
                    payMethod === m ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                  }`}>
                  {m === 'FPS' ? t('pay.fps') : t('pay.payme')}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <p className="text-sm text-gray-500 mb-1">
              {t('pay.payWith').replace('{m}', payMethod === 'FPS' ? t('pay.fps') : t('pay.payme'))}
            </p>
            <p className="text-2xl font-bold mb-4">HK${grandTotal}</p>
            {payMethod === 'FPS' ? (
              <div className="space-y-2 text-sm">
                {pay.fps_phone && <p>{t('pay.fpsId')}:<span className="font-medium">{pay.fps_phone}</span></p>}
                {pay.fps_name && <p>{t('pay.payee')}:<span className="font-medium">{pay.fps_name}</span></p>}
                {pay.fps_qr_url && <img src={pay.fps_qr_url} alt="FPS QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />}
                {!pay.fps_phone && !pay.fps_qr_url && (
                  <p className="text-amber-600">{t('pay.noFps')}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {pay.payme_link && (
                  <a href={pay.payme_link} target="_blank" rel="noreferrer" className="inline-block text-blue-600 underline break-all">{pay.payme_link}</a>
                )}
                {pay.payme_qr_url && <img src={pay.payme_qr_url} alt="PayMe QR" className="w-48 h-48 object-contain border rounded-lg mt-2" />}
                {!pay.payme_link && !pay.payme_qr_url && (
                  <p className="text-amber-600">{t('pay.noPayme')}</p>
                )}
              </div>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium mb-2">{t('pay.uploadProof')} <span className="text-red-400">*</span></p>
            <p className="text-xs text-gray-400 mb-3">{t('pay.uploadHint')}</p>
            {proofUrl ? (
              <div className="relative inline-block">
                <img src={proofPreview} alt="proof" className="w-40 rounded-lg border" />
                <button onClick={() => { setProofUrl(''); setProofPreview('') }}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-red-500 hover:text-white transition">
                  ×
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleUploadProof}
                className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer" />
            )}
            {uploading && <p className="text-xs text-gray-400 mt-2">{t('pay.uploading')}</p>}
          </div>

          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">{t('order.back')}</button>
            <button onClick={goToConfirm}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium">{t('order.nextConfirm')}</button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold">{t('order.confirmTitle')}</h2>

          <div className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <p className="font-medium">{modeDescDisplay}</p>
                <p className="text-gray-500">{t('order.model')}:{order.phone_model}</p>
              </div>
              <span className="font-medium">HK${unitPrice}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isPuzzle ? (
                order.puzzle?.imgSrc && (
                  <img src={order.puzzle.imgSrc} alt="puzzle" className="h-20 object-cover rounded-lg border" />
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

          <div className="border border-gray-100 rounded-xl p-5 text-sm space-y-1">
            <p><span className="text-gray-500">{t('order.recipient')}:</span> {name}</p>
            <p><span className="text-gray-500">{t('order.phone')}:</span> {phone}</p>
            <p><span className="text-gray-500">{t('order.region')}:</span> {regionLabel(region)}</p>
            <p>
              <span className="text-gray-500">{t('order.delivery')}:</span>{' '}
              {useSFStore
                ? `${deliveryDisplay} — ${sfStationName || ''}${sfStationCode ? ` (${sfStationCode})` : ''}`
                : `${deliveryDisplay} — ${address}`}
            </p>
            <p><span className="text-gray-500">{t('order.payment')}:</span> {payMethod === 'FPS' ? t('pay.fps') : t('pay.payme')}</p>
            {note && <p><span className="text-gray-500">{t('order.note')}:</span> {note}</p>}
          </div>

          <div className="border border-gray-100 rounded-xl p-5 text-sm space-y-2">
            <div className="flex justify-between text-gray-600"><span>{t('order.product')}</span><span>HK${unitPrice}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>{t('order.shippingItem')}({carrierLabel(region)})</span>
              <span>{shippingFee > 0 ? `HK$${shippingFee}` : <span className="text-green-600">{t('checkout.free')}</span>}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t('order.discountItem')}({appliedCode})</span>
                <span>− HK${discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold pt-1 border-t"><span>{t('order.total')}</span><span>HK${grandTotal}</span></div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} disabled={submitting}
              className="px-6 py-2 rounded-lg border border-gray-300 font-medium disabled:opacity-50">{t('order.back')}</button>
            <button onClick={handleSubmit} disabled={submitting || uploading}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {submitting ? t('order.submitting') : t('order.confirmOrder')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order