import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from '../components/AdminNav'

const EMPTY = {
  code: '',
  type: 'percent',          // percent | fixed
  value: '',
  max_discount: '',         // 只 percent 用
  min_spend: '',
  scope: 'all',             // all | ready | custom | collection
  scope_collection: '',
  max_uses: '',
  max_uses_per_person: '',
  start_at: '',
  end_at: '',
  active: true,
  note: '',
}

const SCOPE_LABEL = {
  all: '全部',
  ready: '現成商品',
  custom: '客製訂單',
  collection: '指定系列',
}

// 將 DB row → 表單格式(timestamptz → datetime-local 字串)
function rowToForm(r) {
  const toLocal = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return {
    code: r.code || '',
    type: r.type || 'percent',
    value: r.value ?? '',
    max_discount: r.max_discount ?? '',
    min_spend: r.min_spend ?? '',
    scope: r.scope || 'all',
    scope_collection: r.scope_collection || '',
    max_uses: r.max_uses ?? '',
    max_uses_per_person: r.max_uses_per_person ?? '',
    start_at: toLocal(r.start_at),
    end_at: toLocal(r.end_at),
    active: r.active ?? true,
    note: r.note || '',
  }
}

function AdminDiscounts() {
  const [list, setList] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)  // null = 新增模式
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // 系列清單(畀「指定系列」用)
    supabase
      .from('collections')
      .select('id, name')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setCollections(data || []))
  }, [])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    setErr('')
  }

  function startNew() {
    setEditingId(null)
    setForm(EMPTY)
    setErr('')
  }

  function startEdit(r) {
    setEditingId(r.id)
    setForm(rowToForm(r))
    setErr('')
    window.scrollTo(0, 0)
  }

  // 表單 → DB payload
  function buildPayload() {
    const num = (v) => (v === '' || v == null ? null : Number(v))
    const intNum = (v) => (v === '' || v == null ? null : parseInt(v, 10))
    const ts = (v) => (v ? new Date(v).toISOString() : null)

    return {
      code: form.code.trim().toUpperCase(),
      type: form.type,                            // dropdown 保證係 percent/fixed
      value: num(form.value),
      max_discount: form.type === 'percent' ? num(form.max_discount) : null,
      min_spend: num(form.min_spend),
      scope: form.scope,
      scope_collection: form.scope === 'collection' ? (form.scope_collection || null) : null,
      max_uses: intNum(form.max_uses),
      max_uses_per_person: intNum(form.max_uses_per_person),
      start_at: ts(form.start_at),
      end_at: ts(form.end_at),
      active: form.active,
      note: form.note.trim() || null,
    }
  }

  async function handleSave() {
    // 前端基本驗證
    if (!form.code.trim()) return setErr('請輸入優惠碼')
    if (form.value === '' || Number(form.value) <= 0) return setErr('折扣值要大過 0')
    if (form.type === 'percent' && Number(form.value) > 100) return setErr('百分比唔可以大過 100')
    if (form.scope === 'collection' && !form.scope_collection) return setErr('請揀適用系列')

    setSaving(true)
    setErr('')
    const payload = buildPayload()

    let error
    if (editingId) {
      ({ error } = await supabase.from('discount_codes').update(payload).eq('id', editingId))
    } else {
      ({ error } = await supabase.from('discount_codes').insert(payload))
    }
    setSaving(false)

    if (error) {
      // 撞 code 重複(unique)會喺度 catch
      if (error.code === '23505') return setErr('呢個優惠碼已經存在')
      return setErr(error.message)
    }
    startNew()
    load()
  }

  async function toggleActive(r) {
    await supabase.from('discount_codes').update({ active: !r.active }).eq('id', r.id)
    load()
  }

  async function remove(r) {
    if (!window.confirm(`確定刪除「${r.code}」?此操作無法復原。`)) return
    const { error } = await supabase.from('discount_codes').delete().eq('id', r.id)
    if (error) return alert('刪除失敗:' + error.message)
    if (editingId === r.id) startNew()
    load()
  }

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">優惠碼管理</h1>
        <p className="text-sm text-gray-400 mb-8">新增 / 編輯折扣碼。金額一律由後端計算,客人改唔到價。</p>

        {/* 表單 */}
        <section className="border border-gray-100 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">{editingId ? '編輯優惠碼' : '新增優惠碼'}</h2>
            {editingId && (
              <button onClick={startNew} className="text-sm text-gray-400 hover:text-black transition">
                + 改為新增
              </button>
            )}
          </div>

          {err && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {err}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* 優惠碼 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">優惠碼 <span className="text-red-400">*</span></label>
              <input value={form.code} onChange={(e) => set('code', e.target.value)}
                className={inputClass} placeholder="例如 SUMMER10(自動轉大寫)" />
            </div>

            {/* 類型 */}
            <div>
              <label className="block text-sm font-medium mb-2">折扣類型</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                <option value="percent">百分比 %</option>
                <option value="fixed">固定金額 HK$</option>
              </select>
            </div>

            {/* 折扣值 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                折扣值 <span className="text-red-400">*</span>
                <span className="text-gray-400 font-normal"> ({form.type === 'percent' ? '%' : 'HK$'})</span>
              </label>
              <input type="number" min="0" value={form.value} onChange={(e) => set('value', e.target.value)}
                className={inputClass} placeholder={form.type === 'percent' ? '例如 10' : '例如 50'} />
            </div>

            {/* 最高折扣(只 percent) */}
            {form.type === 'percent' && (
              <div>
                <label className="block text-sm font-medium mb-2">最高折扣金額(可選)</label>
                <input type="number" min="0" value={form.max_discount} onChange={(e) => set('max_discount', e.target.value)}
                  className={inputClass} placeholder="例如 100,留空 = 不設上限" />
              </div>
            )}

            {/* 最低消費 */}
            <div>
              <label className="block text-sm font-medium mb-2">最低消費(可選)</label>
              <input type="number" min="0" value={form.min_spend} onChange={(e) => set('min_spend', e.target.value)}
                className={inputClass} placeholder="例如 300,留空 = 無限制" />
            </div>

          {/* 適用範圍 */}
            <div>
              <label className="block text-sm font-medium mb-2">適用範圍</label>
              <select value={form.scope} onChange={(e) => set('scope', e.target.value)} className={inputClass}>
                <option value="all">全部</option>
                <option value="ready">只限現成商品</option>
                <option value="custom">只限客製訂單</option>
              </select>
            </div>

            {/* 指定系列 */}
            {form.scope === 'collection' && (
              <div>
                <label className="block text-sm font-medium mb-2">適用系列 <span className="text-red-400">*</span></label>
                <select value={form.scope_collection} onChange={(e) => set('scope_collection', e.target.value)} className={inputClass}>
                  <option value="">請選擇…</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 全店上限 */}
            <div>
              <label className="block text-sm font-medium mb-2">總使用次數上限(可選)</label>
              <input type="number" min="0" value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)}
                className={inputClass} placeholder="留空 = 無限" />
            </div>

            {/* 每人上限 */}
            <div>
              <label className="block text-sm font-medium mb-2">每人使用次數上限(可選)</label>
              <input type="number" min="0" value={form.max_uses_per_person} onChange={(e) => set('max_uses_per_person', e.target.value)}
                className={inputClass} placeholder="例如 1,留空 = 無限" />
            </div>

            {/* 開始 */}
            <div>
              <label className="block text-sm font-medium mb-2">生效時間(可選)</label>
              <input type="datetime-local" value={form.start_at} onChange={(e) => set('start_at', e.target.value)}
                className={inputClass} />
            </div>

            {/* 結束 */}
            <div>
              <label className="block text-sm font-medium mb-2">過期時間(可選)</label>
              <input type="datetime-local" value={form.end_at} onChange={(e) => set('end_at', e.target.value)}
                className={inputClass} />
            </div>

            {/* 備註 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">備註(可選,只內部睇)</label>
              <input value={form.note} onChange={(e) => set('note', e.target.value)}
                className={inputClass} placeholder="例如:夏季推廣" />
            </div>

            {/* 啟用 */}
            <div className="sm:col-span-2 flex items-center gap-2">
              <input id="active" type="checkbox" checked={form.active}
                onChange={(e) => set('active', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm">啟用(關咗就唔會生效)</label>
            </div>
          </div>

          <div className="mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {saving ? '儲存緊…' : editingId ? '更新優惠碼' : '新增優惠碼'}
            </button>
          </div>
        </section>

        {/* 列表 */}
        <section>
          <h2 className="font-medium mb-4">所有優惠碼</h2>
          {loading ? (
            <p className="text-sm text-gray-400">載入緊…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-400">未有優惠碼。</p>
          ) : (
            <div className="space-y-3">
              {list.map((r) => {
                const expired = r.end_at && new Date(r.end_at) < new Date()
                return (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.code}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {r.type === 'percent' ? `${r.value}%` : `HK$${r.value}`}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {SCOPE_LABEL[r.scope] || r.scope}
                          {r.scope === 'collection' && r.scope_collection ? `:${r.scope_collection}` : ''}
                        </span>
                        {!r.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">已停用</span>}
                        {expired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">已過期</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        已用 {r.used_count || 0}
                        {r.max_uses != null ? ` / ${r.max_uses}` : ''} 次
                        {r.max_uses_per_person != null ? ` · 每人 ${r.max_uses_per_person} 次` : ''}
                        {r.min_spend != null ? ` · 最低 HK$${r.min_spend}` : ''}
                        {r.max_discount != null ? ` · 上限 HK$${r.max_discount}` : ''}
                      </p>
                      {r.note && <p className="text-xs text-gray-400 mt-0.5">📝 {r.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleActive(r)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition">
                        {r.active ? '停用' : '啟用'}
                      </button>
                      <button onClick={() => startEdit(r)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition">
                        編輯
                      </button>
                      <button onClick={() => remove(r)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition">
                        刪除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default AdminDiscounts