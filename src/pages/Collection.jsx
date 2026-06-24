import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const gradients = [
  'from-gray-200 to-gray-400',
  'from-slate-700 to-slate-900',
  'from-gray-100 to-gray-300',
  'from-zinc-800 to-black',
  'from-rose-100 to-rose-300',
  'from-neutral-200 to-neutral-400',
]

function Collection() {
  const [collections, setCollections] = useState([])   // 所有系列(含隱藏,判斷用)
  const [designs, setDesigns] = useState([])           // 所有設計(已上架)
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
      // ⭐ collections 全部保留(包括隱藏),判斷產品可見性要用
      setCollections(cols || [])
      // designs 只隱藏「下架」嘅
      setDesigns((dsg || []).filter((d) => d.active !== false))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const findCol = (id) => collections.find((c) => c.id === id)
  const childrenOf = (colId) => collections.filter((c) => c.parent_id === colId)
  const childIds = (colId) => childrenOf(colId).map((c) => c.id)

  // ⭐ 判斷某 collection_id 喺前台係咪可見(自己同父系列都唔可以被隱藏)
  function isColVisible(colId) {
    if (!colId) return true            // 未分類:照顯示
    const c = findCol(colId)
    if (!c) return true                // 搵唔到(資料異常)就照顯示
    if (c.active === false) return false
    if (c.parent_id) {
      const parent = findCol(c.parent_id)
      if (parent && parent.active === false) return false
    }
    return true
  }

  // tab 只顯示 active 嘅
  const topCollections = collections.filter((c) => !c.parent_id && c.active !== false)
  const subCollections =
    activeCol === 'all'
      ? []
      : childrenOf(activeCol).filter((c) => c.active !== false)

  function selectTop(id) {
    setActiveCol(id)
    setActiveChild('all')
  }

  // ⭐ 第一層:隱藏「所屬系列被隱藏」嘅產品
  let visibleDesigns = designs.filter((d) => isColVisible(d.collection_id))

  // 第二層:系列篩選
  if (activeCol !== 'all') {
    if (activeChild !== 'all') {
      visibleDesigns = visibleDesigns.filter((d) => d.collection_id === activeChild)
    } else {
      visibleDesigns = visibleDesigns.filter(
        (d) => d.collection_id === activeCol || childIds(activeCol).includes(d.collection_id)
      )
    }
  }

  // 第三層:搜尋
  const q = query.trim().toLowerCase()
  if (q) {
    visibleDesigns = visibleDesigns.filter((d) =>
      (d.name_zh_hk || '').toLowerCase().includes(q)
    )
  }

  if (loading) return <p className="text-center text-gray-400 py-32">載入緊…</p>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">現成系列</h1>
      <p className="text-gray-500 mt-2">揀一款鍾意嘅設計,即刻落單。</p>

      {/* 搜尋框 */}
      <div className="relative mt-6 max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋設計名稱…"
          className="w-full border border-gray-200 rounded-full pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition"
            title="清除">
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
          全部
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
            全部
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
          {q ? `搵唔到「${query}」相關嘅設計。` : '呢個系列暫時未有設計。'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
          {visibleDesigns.map((d) => {
            const gradient = gradients[(d.sort_order ?? 1) - 1] || gradients[0]
            const onSale = d.sale_price != null
            const cover = d.image_url || (Array.isArray(d.images) ? d.images[0] : '') || ''
            const soldOut = d.in_stock === false || (d.stock != null && d.stock <= 0)

            return (
              <Link key={d.id} to={`/collection/${d.id}`} className="group">
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  {cover ? (
                    <img src={cover} alt={d.name_zh_hk}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <span className="text-xs text-white/70">設計預覽</span>
                    </div>
                  )}

                  {onSale && (
                    <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      特價
                    </span>
                  )}
                  {soldOut && (
                    <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-full">
                      缺貨
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <p className="text-sm font-medium truncate">{d.name_zh_hk}</p>
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