import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LanguageContext'

const gradients = [
  'from-gray-200 to-gray-400',
  'from-slate-700 to-slate-900',
  'from-gray-100 to-gray-300',
  'from-zinc-800 to-black',
  'from-rose-100 to-rose-300',
  'from-neutral-200 to-neutral-400',
]

function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { t } = useLang()

  const [design, setDesign] = useState(null)
  const [collection, setCollection] = useState(null)
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [model, setModel] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState('')
  const [modelOrder, setModelOrder] = useState([])

  useEffect(() => {
    supabase
      .from('phone_models')
      .select('name')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setModelOrder((data || []).map((m) => m.name)))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setUnavailable(false)

      const { data } = await supabase
        .from('designs').select('*').eq('id', id).single()

      if (cancelled) return

      if (!data || data.active === false) {
        setDesign(data || null)
        if (data && data.active === false) setUnavailable(true)
        setLoading(false)
        return
      }

      setDesign(data)

      const imgs = Array.isArray(data.images) ? data.images : []
      setActiveImg(data.image_url || imgs[0] || '')

      if (data.collection_id) {
        const { data: c } = await supabase
          .from('collections').select('*').eq('id', data.collection_id).single()
        if (cancelled) return
        setCollection(c || null)

        if (c && c.active === false) setUnavailable(true)

        if (c?.parent_id) {
          const { data: p } = await supabase
            .from('collections').select('*').eq('id', c.parent_id).single()
          if (cancelled) return
          setParent(p || null)
          if (p && p.active === false) setUnavailable(true)
        } else {
          setParent(null)
        }
      } else {
        setCollection(null)
        setParent(null)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <p className="text-center text-gray-400 py-32">{t('detail.loading')}</p>

  if (!design || unavailable) return (
    <div className="text-center py-32">
      <p className="text-gray-400">{t('detail.notFound')}</p>
      <Link to="/collection" className="text-sm underline mt-4 inline-block">{t('detail.backToCollection')}</Link>
    </div>
  )

  const gradient = gradients[(design.sort_order ?? 1) - 1] || gradients[0]

  const availableModels = (() => {
    const arr = Array.isArray(design.phone_models) ? [...design.phone_models] : []
    return arr.sort((a, b) => {
      const ia = modelOrder.indexOf(a)
      const ib = modelOrder.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  })()

  const onSale = design.sale_price != null
  const finalPrice = onSale ? design.sale_price : design.price_hkd
  const soldOut = design.in_stock === false || (design.stock != null && design.stock <= 0)
  const lowStock = design.stock != null && design.stock > 0 && design.stock <= 5

  const collectionLabel = collection
    ? (parent ? `${parent.name} · ${collection.name}` : collection.name)
    : null

  const allImages = (() => {
    const imgs = Array.isArray(design.images) ? design.images : []
    const merged = []
    if (design.image_url) merged.push(design.image_url)
    imgs.forEach((u) => { if (!merged.includes(u)) merged.push(u) })
    return merged
  })()

  function handleAdd() {
    if (soldOut) return
    if (added) return
    if (!model) return alert(t('detail.pleaseSelectModel'))
    addItem({
      designId: design.id,
      designName: design.name_zh_hk,
      collection: collectionLabel || t('detail.defaultCollection'),
      phoneModel: model,
      unitPrice: finalPrice,
      originalPrice: onSale ? design.price_hkd : null,
      quantity: qty,
      image: design.image_url || allImages[0] || '',
      gradient,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 麵包屑 */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
        <Link to="/collection" className="hover:text-gray-700 transition">{t('detail.breadcrumb')}</Link>
        {parent && (<><span>/</span><span>{parent.name}</span></>)}
        {collection && (<><span>/</span><span>{collection.name}</span></>)}
        <span>/</span>
        <span className="text-gray-600">{design.name_zh_hk}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mt-6 items-start">
        {/* 左:大圖 + 縮圖 */}
        <div className="mx-auto w-full max-w-xs md:sticky md:top-24">
          <div className="relative aspect-[9/19] rounded-3xl overflow-hidden border border-gray-100 bg-gray-50">
            {activeImg ? (
              <img src={activeImg} alt={design.name_zh_hk} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-xs text-white/70">{t('detail.preview')}</span>
              </div>
            )}
            <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl border-2 border-white/50" />
            {soldOut && (
              <span className="absolute top-4 right-4 text-xs bg-black/70 text-white px-2.5 py-1 rounded-full">
                {t('detail.soldOut')}
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {allImages.map((url) => (
                <button key={url} onClick={() => setActiveImg(url)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                    activeImg === url ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右:資料 + 揀型號 + 數量 + 加入購物車 */}
        <div>
          {collectionLabel && (
            <p className="text-sm text-gray-400 tracking-widest uppercase">{collectionLabel}</p>
          )}
          <h1 className="text-3xl font-bold tracking-tight mt-2">{design.name_zh_hk}</h1>

          <div className="text-2xl mt-3">
            {onSale ? (
              <>
                <span className="text-red-500 font-semibold">HK${design.sale_price}</span>
                <span className="line-through text-gray-300 text-lg ml-2">HK${design.price_hkd}</span>
              </>
            ) : (
              <span className="text-gray-800">HK${design.price_hkd}</span>
            )}
          </div>

          {design.description && (
            <p className="text-gray-500 leading-relaxed mt-5">{design.description}</p>
          )}

          {soldOut && (
            <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {t('detail.soldOutNotice')}
            </div>
          )}

          {!soldOut && lowStock && (
            <p className="mt-4 text-sm text-amber-600">{t('detail.lowStock').replace('{n}', design.stock)}</p>
          )}

          {/* 型號 */}
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">{t('detail.phoneModel')} <span className="text-red-400">*</span></label>
            {availableModels.length === 0 ? (
              <p className="text-sm text-gray-400 border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                {t('detail.noModels')}
              </p>
            ) : (
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={soldOut}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50 disabled:text-gray-300">
                <option value="">{t('detail.selectPlaceholder')}</option>
                {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>

          {/* 數量 */}
          <div className="mt-5">
            <label className="block text-sm font-medium mb-2">{t('detail.quantity')}</label>
            <div className={`inline-flex items-center border border-gray-200 rounded-lg overflow-hidden ${soldOut ? 'opacity-40 pointer-events-none' : ''}`}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg hover:bg-gray-50">−</button>
              <span className="px-5 py-2 text-sm min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}
                className="px-4 py-2 text-lg hover:bg-gray-50">+</button>
            </div>
          </div>

          {/* 加入購物車 */}
          <button onClick={handleAdd} disabled={soldOut || added || availableModels.length === 0}
            className="w-full mt-8 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
            {soldOut ? t('detail.soldOutBtn') : (added ? t('detail.added') : t('detail.addToCart'))}
          </button>

          {added && !soldOut && (
            <button onClick={() => navigate('/cart')}
              className="w-full mt-3 border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              {t('detail.goCheckout')}
            </button>
          )}

          <p className="text-xs text-gray-400 mt-4 text-center">
            {t('detail.leadTime')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CollectionDetail