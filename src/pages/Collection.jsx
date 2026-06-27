import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang } from '../context/LanguageContext'
import { pickLang } from '../i18n/pickLang'

const gradients = [
  'from-gray-200 to-gray-400',
  'from-slate-700 to-slate-900',
  'from-gray-100 to-gray-300',
  'from-zinc-800 to-black',
  'from-rose-100 to-rose-300',
  'from-neutral-200 to-neutral-400',
]

function Collection() {
  const { t, lang } = useLang()   // ⭐ 補攞 lang
  const [collections, setCollections] = useState([])
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCol, setActiveCol] = useState('all')
  const [activeChild, setActiveChild] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      const [{ data: cols }, { data: dsg }] = await Promise.all([
        supabase.from('collections').select('*').order('sort_order', { ascending: true }),
        supabase.from('designs').select('*').order('sort_order', { ascending: true }),
      ])

      if (cancelled) return
      setCollections(cols || [])
      setDesigns((dsg || []).filter((d) => d.active !== false))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const findCol = (id) => collections.find((c) => c.id === id)
  const childrenOf = (colId) => collections.filter((c) => c.parent_id === colId)
  const childIds = (colId) => childrenOf(colId).map((c) => c.id)

  function isColVisible(colId) {
    if (!colId) return true
    const c = findCol(colId)
    if (!c) return true
    if (c.active === false) return false
    if (c.parent_id) {
      const parent = findCol(c.parent_id)
      if (parent && parent.active === false) return false
    }
    return true
  }

  const topCollections = collections.filter((c) => !c.parent_id && c.active !== false)
  const subCollections =
    activeCol === 'all'
      ? []
      : childrenOf(activeCol).filter((c) => c.active !== false)

  function selectTop(id) {
    setActiveCol(id)
    setActiveChild('all')
  }

  let visibleDesigns = designs.filter((d) => isColVisible(d.collection_id))

  if (activeCol !== 'all') {
    if (activeChild !== 'all') {
      visibleDesigns = visibleDesigns.filter((d) => d.collection_id === activeChild)
    } else {
      visibleDesigns = visibleDesigns.filter(
        (d) => d.collection_id === activeCol || childIds(activeCol).includes(d.collection_id)
      )
    }
  }

  const q = query.trim().toLowerCase()
  if (q) {
    // ⭐ 三語任一 match(用戶打簡 / 繁 / 英都搵到)
    visibleDesigns = visibleDesigns.filter((d) => {
      const names = [d.name_zh_hk, d.name_zh_cn, d.name_en]
        .filter(Boolean)
        .map((s) => s.toLowerCase())
      return names.some((n) => n.includes(q))
    })
  }

  if (loading) return <p className="text-center text-gray-400 py-32">{t('collection.loading')}</p>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t('collection.title')}</h1>
      <p className="text-gray-500 mt-2">{t('collection.subtitle')}</p>

      {/* 搜尋框 */}
      <div className="relative mt-6 max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('collection.searchPlaceholder')}
          className="w-full border border-gray-200 rounded-full pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition"
            title={t('collection.clear')}>
            ×
          </button>
        )}
      </div>

      {/* 大系列篩選 */}
      <div className="flex gap-2 flex-wrap mt-5">
        <button
          onClick={() => selectTop('all')}
          className={`px-4 py-2 rounded-full text-sm transition ${
            activeCol === 'all' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}>
          {t('collection.all')}
        </button>
        {topCollections.map((c) => (
          <button
            key={c.id}
            onClick={() => selectTop(c.id)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              activeCol === c.id ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* 子系列篩選 */}
      {subCollections.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3 pl-1">
          <button
            onClick={() => setActiveChild('all')}
            className={`px-3 py-1.5 rounded-full text-xs transition border ${
              activeChild === 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            {t('collection.all')}
          </button>
          {subCollections.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChild(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition border ${
                activeChild === c.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* 設計格 */}
      {visibleDesigns.length === 0 ? (
        <p className="text-center text-gray-400 py-20">
          {q ? t('collection.searchEmpty').replace('{q}', query) : t('collection.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
          {visibleDesigns.map((d) => {
            const gradient = gradients[(d.sort_order ?? 1) - 1] || gradients[0]
            const onSale = d.sale_price != null
            const cover = d.image_url || (Array.isArray(d.images) ? d.images[0] : '') || ''
            const soldOut = d.in_stock === false || (d.stock != null && d.stock <= 0)
            const name = pickLang(d, 'name', lang)   // ⭐ 多語名

            return (
              <Link key={d.id} to={`/collection/${d.id}`} className="group">
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  {cover ? (
                    <img src={cover} alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <span className="text-xs text-white/70">{t('detail.preview')}</span>
                    </div>
                  )}

                  {onSale && (
                    <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {t('collection.sale')}
                    </span>
                  )}
                  {soldOut && (
                    <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-full">
                      {t('collection.soldOut')}
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <div className="text-sm mt-0.5">
                    {onSale ? (
                      <>
                        <span className="text-red-500 font-semibold">HK${d.sale_price}</span>
                        <span className="line-through text-gray-300 text-xs ml-1.5">HK${d.price_hkd}</span>
                      </>
                    ) : (
                      <span className="text-gray-700">HK${d.price_hkd}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Collection