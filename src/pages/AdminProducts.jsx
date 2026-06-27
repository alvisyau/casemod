import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from '../components/AdminNav'

const emptyForm = {
  id: null,
  name_zh_hk: '',
  name_zh_cn: '',
  name_en: '',
  parent_id: '',
  child_id: '',
  description: '',
  description_zh_cn: '',
  description_en: '',
  price_hkd: '',
  sale_price: '',
  stock: '',
  in_stock: true,
  active: true,
  sort_order: 0,
  image_url: '',
  images: [],
  phone_models: [],
}

function AdminProducts() {
  const [list, setList] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allModels, setAllModels] = useState([])

  useEffect(() => { load(); loadCollections(); loadModels() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) { console.error(error); alert('讀取產品失敗:' + error.message) }
    setList(data || [])
    setLoading(false)
  }

  // 載入系列(畀揀選用)
  async function loadCollections() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) { console.error(error); return }
    setCollections(data || [])
  }

  // 載入全局手機型號(只攞 active)
  async function loadModels() {
    const { data, error } = await supabase
      .from('phone_models')
      .select('name, active')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    if (error) { console.error(error); return }
    setAllModels((data || []).map((m) => m.name))
  }

  const parents = collections.filter((c) => !c.parent_id)
  const childrenOf = (pid) => collections.filter((c) => c.parent_id === pid)
  const childrenOfSelected = form.parent_id ? childrenOf(form.parent_id) : []

  function openCreate() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(p) {
    let parent_id = ''
    let child_id = ''
    const cid = p.collection_id
    if (cid) {
      const c = collections.find((x) => x.id === cid)
      if (c) {
        if (c.parent_id) { parent_id = c.parent_id; child_id = c.id }
        else { parent_id = c.id; child_id = '' }
      }
    }

    setForm({
      id: p.id,
      name_zh_hk: p.name_zh_hk || '',
      name_zh_cn: p.name_zh_cn || '',        // ⭐
      name_en: p.name_en || '',              // ⭐
      parent_id,
      child_id,
      description: p.description || '',
      description_zh_cn: p.description_zh_cn || '',   // ⭐
      description_en: p.description_en || '',         // ⭐
      price_hkd: p.price_hkd ?? '',
      sale_price: p.sale_price ?? '',
      stock: p.stock ?? '',
      in_stock: p.in_stock ?? true,
      active: p.active ?? true,
      sort_order: p.sort_order ?? 0,
      image_url: p.image_url || '',
      images: Array.isArray(p.images) ? p.images : [],
      phone_models: Array.isArray(p.phone_models) ? p.phone_models : [],
    })
    setShowForm(true)
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)

    const newUrls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('designs')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })
      if (upErr) {
        setUploading(false)
        alert('上載失敗:' + upErr.message)
        return
      }
      const { data } = supabase.storage.from('designs').getPublicUrl(fileName)
      newUrls.push(data.publicUrl)
    }

    setForm((f) => {
      const images = [...f.images, ...newUrls]
      return {
        ...f,
        images,
        image_url: f.image_url || images[0] || '',
      }
    })
    setUploading(false)
    e.target.value = ''
  }

  function setCover(url) {
    setForm((f) => ({ ...f, image_url: url }))
  }

  // 揀 / 取消某型號
  function toggleModel(name) {
    setForm((f) => {
      const has = f.phone_models.includes(name)
      return {
        ...f,
        phone_models: has
          ? f.phone_models.filter((m) => m !== name)
          : [...f.phone_models, name],
      }
    })
  }

  function removeImage(url) {
    setForm((f) => {
      const images = f.images.filter((u) => u !== url)
      const image_url = f.image_url === url ? (images[0] || '') : f.image_url
      return { ...f, images, image_url }
    })
  }

  async function handleSave() {
    if (!form.name_zh_hk.trim()) return alert('請填寫產品名稱')
    if (form.price_hkd === '' || isNaN(Number(form.price_hkd))) return alert('請填寫正確價錢')

    setSaving(true)

    const finalCollectionId = form.child_id || form.parent_id || null
    const selectedCol = collections.find((c) => c.id === finalCollectionId)
    const collectionName = selectedCol ? selectedCol.name : null

    const payload = {
      name_zh_hk: form.name_zh_hk.trim(),
      name_zh_cn: form.name_zh_cn.trim() || null,        // ⭐
      name_en: form.name_en.trim() || null,              // ⭐
      collection_id: finalCollectionId,
      collection: collectionName,
      description: form.description.trim() || null,
      description_zh_cn: form.description_zh_cn.trim() || null,   // ⭐
      description_en: form.description_en.trim() || null,        // ⭐
      price_hkd: Number(form.price_hkd),
      sale_price: form.sale_price === '' ? null : Number(form.sale_price),
      stock: form.stock === '' ? null : Number(form.stock),
      in_stock: form.in_stock,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
      image_url: form.image_url || null,
      images: form.images,
      phone_models: form.phone_models,
    }

    let error
    if (form.id) {
      ({ error } = await supabase.from('designs').update(payload).eq('id', form.id))
    } else {
      ({ error } = await supabase.from('designs').insert(payload))
    }

    setSaving(false)
    if (error) { alert('儲存失敗:' + error.message); return }

    setShowForm(false)
    load()
  }

  async function toggleActive(p) {
    setList((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))
    const { error } = await supabase.from('designs').update({ active: !p.active }).eq('id', p.id)
    if (error) { alert('更新失敗:' + error.message); load() }
  }

  async function handleDelete(p) {
    if (!window.confirm(`確定刪除「${p.name_zh_hk}」?此動作無法復原。`)) return
    const { error } = await supabase.from('designs').delete().eq('id', p.id)
    if (error) { alert('刪除失敗:' + error.message); return }
    load()
  }

  function colLabel(p) {
    if (!p.collection_id) return p.collection || null
    const c = collections.find((x) => x.id === p.collection_id)
    if (!c) return p.collection || null
    if (c.parent_id) {
      const parent = collections.find((x) => x.id === c.parent_id)
      return parent ? `${parent.name} › ${c.name}` : c.name
    }
    return c.name
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  return (
    <>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">產品管理</h1>
            <p className="text-sm text-gray-400 mt-1">共 {list.length} 件產品</p>
          </div>
          <button onClick={openCreate}
            className="bg-black text-white text-sm px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition">
            + 新增產品
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 py-12">載入緊…</p>}
        {!loading && list.length === 0 && (
          <p className="text-center text-gray-400 py-12">未有產品,撳「新增產品」開始。</p>
        )}

        {/* 產品列表 */}
        <div className="space-y-3">
          {list.map((p) => {
            const label = colLabel(p)
            return (
              <div key={p.id} className="border border-gray-100 rounded-xl p-3 flex items-center gap-4">
                {/* 縮圖(封面) */}
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name_zh_hk} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">無圖</div>}
                  {Array.isArray(p.images) && p.images.length > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 text-white px-1 rounded">
                      {p.images.length}
                    </span>
                  )}
                </div>

                {/* 資料 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{p.name_zh_hk}</span>
                    {!p.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已下架</span>}
                    {(p.in_stock === false || (p.stock != null && p.stock <= 0)) &&
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">缺貨</span>}
                    {p.stock != null && p.stock > 0 && p.stock <= 5 &&
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">僅剩 {p.stock}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {label
                      ? <span className="text-gray-400">{label} · </span>
                      : <span className="text-gray-300">未分類 · </span>}
                    {p.sale_price != null
                      ? <><span className="text-red-500 font-medium">HK${p.sale_price}</span> <span className="line-through text-gray-300">HK${p.price_hkd}</span></>
                      : <>HK${p.price_hkd}</>}
                    <span className="text-gray-300"> · 排序 {p.sort_order}</span>
                    {p.stock != null && <span className="text-gray-300"> · 庫存 {p.stock}</span>}
                  </p>
                </div>

                {/* 動作 */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(p)}
                    className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                    {p.active ? '下架' : '上架'}
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                    編輯
                  </button>
                  <button onClick={() => handleDelete(p)}
                    className="text-sm text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                    刪除
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 新增/編輯 彈窗 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !saving && setShowForm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-5">{form.id ? '編輯產品' : '新增產品'}</h2>

              <div className="space-y-4">
                {/* 相簿 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    產品相 <span className="text-gray-400 font-normal">(可揀多張,撳相設為封面)</span>
                  </label>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {form.images.map((url) => {
                        const isCover = url === form.image_url
                        return (
                          <div key={url} className="relative group">
                            <button type="button" onClick={() => setCover(url)}
                              className={`block w-full aspect-square rounded-lg overflow-hidden border-2 ${isCover ? 'border-black' : 'border-transparent'}`}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                            {isCover && (
                              <span className="absolute top-1 left-1 text-[10px] bg-black text-white px-1.5 py-0.5 rounded">封面</span>
                            )}
                            <button type="button" onClick={() => removeImage(url)}
                              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/90 text-gray-600 text-xs shadow hover:bg-red-500 hover:text-white transition">
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <input type="file" accept="image/*" multiple onChange={handleUpload}
                    className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer" />
                  {uploading && <p className="text-xs text-gray-400 mt-1">上載緊…</p>}
                </div>

                {/* 產品名稱(三語) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    產品名稱 <span className="text-red-400">*</span>
                  </label>
                  <input value={form.name_zh_hk} onChange={(e) => setForm({ ...form, name_zh_hk: e.target.value })}
                    className={inputClass} placeholder="繁體中文(必填)" />
                  <input value={form.name_zh_cn} onChange={(e) => setForm({ ...form, name_zh_cn: e.target.value })}
                    className={`${inputClass} mt-2`} placeholder="简体中文(留空 = 用繁中)" />
                  <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    className={`${inputClass} mt-2`} placeholder="English (blank = use 繁中)" />
                </div>

                {/* 系列:兩層揀選 */}
                <div>
                  <label className="block text-sm font-medium mb-2">所屬系列</label>

                  {parents.length === 0 ? (
                    <p className="text-sm text-gray-400 border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                      未有系列,請先去「系列」頁開系列。
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {/* 大系列 */}
                      <select value={form.parent_id}
                        onChange={(e) => setForm({ ...form, parent_id: e.target.value, child_id: '' })}
                        className={inputClass}>
                        <option value="">（未分類）</option>
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      {/* 子系列 */}
                      <select value={form.child_id}
                        onChange={(e) => setForm({ ...form, child_id: e.target.value })}
                        disabled={childrenOfSelected.length === 0}
                        className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-300`}>
                        <option value="">
                          {childrenOfSelected.length === 0 ? '（無子系列）' : '（整個大系列）'}
                        </option>
                        {childrenOfSelected.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    左揀大系列,右揀子系列。冇子系列就只揀左邊。
                  </p>
                </div>

                {/* 詳細介紹(三語) */}
                <div>
                  <label className="block text-sm font-medium mb-2">詳細介紹</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} className={inputClass} placeholder="繁體中文 — 產品描述、物料、特點…" />
                  <textarea value={form.description_zh_cn} onChange={(e) => setForm({ ...form, description_zh_cn: e.target.value })}
                    rows={3} className={`${inputClass} mt-2`} placeholder="简体中文(留空 = 用繁中)" />
                  <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    rows={3} className={`${inputClass} mt-2`} placeholder="English (blank = use 繁中)" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">原價 (HK$) <span className="text-red-400">*</span></label>
                    <input type="number" value={form.price_hkd} onChange={(e) => setForm({ ...form, price_hkd: e.target.value })}
                      className={inputClass} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">特價 (HK$)</label>
                    <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                      className={inputClass} placeholder="留空=無特價" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    庫存數量 <span className="text-gray-400 font-normal">(留空 = 不追蹤庫存)</span>
                  </label>
                  <input type="number" value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className={inputClass} placeholder="例如 50;留空即無限" />
                </div>

                {/* 適用手機型號 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    適用手機型號 <span className="text-gray-400 font-normal">(揀邊幾款,客人就只可揀呢啲)</span>
                  </label>
                  {allModels.length === 0 ? (
                    <p className="text-sm text-gray-400 border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                      未有型號,請先去設定頁「手機型號」加入。
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allModels.map((name) => {
                        const on = form.phone_models.includes(name)
                        return (
                          <button key={name} type="button" onClick={() => toggleModel(name)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                              on ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'
                            }`}>
                            {name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {allModels.length > 0 && form.phone_models.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠ 未揀任何型號,客人將無法選擇 / 加入購物車。</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">排序(數字越細越前)</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className={inputClass} placeholder="0" />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.in_stock}
                      onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="w-4 h-4" />
                    有貨
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                    上架(前台顯示)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={() => setShowForm(false)} disabled={saving}
                  className="flex-1 border border-gray-200 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving || uploading}
                  className="flex-1 bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50">
                  {saving ? '儲存緊…' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminProducts