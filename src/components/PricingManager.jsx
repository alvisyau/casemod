import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// 預設價目(讀唔到 DB 時頂住)
const DEFAULT_PRICING = {
  single: { 1: 298, 2: 398, 3: 488, 4: 568, 5: 648, 6: 728, 7: 808, 8: 868, 9: 928 },
  multi: { 1: 298, 2: 478, 3: 628 },
}

const SINGLE_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const MULTI_KEYS = [1, 2, 3]

function PricingManager() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'pricing')
        .single()
      if (data?.value) {
        setPricing({
          single: { ...DEFAULT_PRICING.single, ...(data.value.single || {}) },
          multi: { ...DEFAULT_PRICING.multi, ...(data.value.multi || {}) },
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function updatePrice(group, key, val) {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
    setPricing((p) => ({ ...p, [group]: { ...p[group], [key]: num } }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('store_settings')
      .upsert(
        { key: 'pricing', value: pricing, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    setSaving(false)
    if (error) return alert('儲存失敗:' + error.message)
    setSaved(true)
  }

  const cellInput =
    'w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  if (loading) return <p className="text-sm text-gray-400 py-4">載入緊…</p>

  return (
    <div className="space-y-6">
      {/* 模式 A:單殼多片 */}
      <div>
        <h3 className="text-sm font-medium mb-1">模式 A:單殼多片(1 個殼 + N 片底板)</h3>
        <p className="text-xs text-gray-400 mb-3">客人揀幾多片底板,就用對應價錢。</p>
        <div className="space-y-2">
          {SINGLE_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-32 shrink-0">1 殼 + {k} 片</span>
              <span className="text-sm text-gray-400">HK$</span>
              <input
                type="number"
                min="0"
                value={pricing.single[k]}
                onChange={(e) => updatePrice('single', k, e.target.value)}
                className={cellInput}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 模式 B:多殼 */}
      <div>
        <h3 className="text-sm font-medium mb-1">模式 B:多殼(每殼 1 片,同型號)</h3>
        <p className="text-xs text-gray-400 mb-3">情侶 / 家人款,1–3 個殼。</p>
        <div className="space-y-2">
          {MULTI_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-32 shrink-0">{k} 殼 + {k} 款</span>
              <span className="text-sm text-gray-400">HK$</span>
              <input
                type="number"
                min="0"
                value={pricing.multi[k]}
                onChange={(e) => updatePrice('multi', k, e.target.value)}
                className={cellInput}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50">
          {saving ? '儲存緊…' : '儲存價目'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ 已儲存</span>}
      </div>
    </div>
  )
}

export default PricingManager