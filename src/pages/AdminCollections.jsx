import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from '../components/AdminNav'

const emptyForm = {
  id: null,
  name: '',
  parent_id: '',   // '' = 大系列;有值 = 子系列
  sort_order: 0,
  active: true,
}

function AdminCollections() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) { console.error(error); alert('讀取系列失敗:' + error.message) }
    setList(data || [])
    setLoading(false)
  }

  // 大系列(冇 parent)
  const parents = list.filter((c) => !c.parent_id)
  // 某大系列嘅子系列
  const childrenOf = (pid) => list.filter((c) => c.parent_id === pid)

  function openCreate() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function openCreateChild(parentId) {
    setForm({ ...emptyForm, parent_id: parentId })
    setShowForm(true)
  }

  function openEdit(c) {
    setForm({
      id: c.id,
      name: c.name || '',
      parent_id: c.parent_id || '',
      sort_order: c.sort_order ?? 0,
      active: c.active ?? true,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return alert('請填寫系列名稱')

    // 防呆:子系列唔可以揀自己做 parent
    if (form.id && form.parent_id === form.id) {
      return alert('唔可以揀自己做上級系列')
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }

    let error
    if (form.id) {
      ({ error } = await supabase.from('collections').update(payload).eq('id', form.id))
    } else {
      ({ error } = await supabase.from('collections').insert(payload))
    }

    setSaving(false)
    if (error) { alert('儲存失敗:' + error.message); return }
    setShowForm(false)
    load()
  }

  async function toggleActive(c) {
    setList((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x))
    const { error } = await supabase.from('collections').update({ active: !c.active }).eq('id', c.id)
    if (error) { alert('更新失敗:' + error.message); load() }
  }

  async function handleDelete(c) {
    const kids = childrenOf(c.id)
    if (kids.length > 0) {
      return alert(`「${c.name}」仲有 ${kids.length} 個子系列,請先刪除或移走子系列。`)
    }
    if (!window.confirm(`確定刪除「${c.name}」?\n注意:用緊呢個系列嘅產品會變成「未分類」。`)) return
    const { error } = await supabase.from('collections').delete().eq('id', c.id)
    if (error) { alert('刪除失敗:' + error.message); return }
    load()
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'

  // 編輯緊邊個,parent 下拉就要排除佢自己(避免自己做自己 parent)
  const parentOptions = parents.filter((p) => p.id !== form.id)

  return (
    <>
      <AdminNav />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">系列管理</h1>
            <p className="text-sm text-gray-400 mt-1">
              大系列(例如英超)可以有子系列(例如阿仙奴);冇子系列嘅大系列可直接放產品。
            </p>
          </div>
          <button onClick={openCreate}
            className="bg-black text-white text-sm px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition whitespace-nowrap">
            + 新增大系列
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 py-12">載入緊…</p>}
        {!loading && parents.length === 0 && (
          <p className="text-center text-gray-400 py-12">未有系列,撳「新增大系列」開始。</p>
        )}

        {/* 系列樹 */}
        <div className="space-y-4">
          {parents.map((p) => {
            const kids = childrenOf(p.id)
            return (
              <div key={p.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* 大系列一行 */}
                <div className="p-4 flex items-center gap-3 bg-gray-50/60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      {!p.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已隱藏</span>}
                      {kids.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          {kids.length} 個子系列
                        </span>
                      )}
                      <span className="text-xs text-gray-300">排序 {p.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openCreateChild(p.id)}
                      className="text-sm text-blue-600 border border-blue-100 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition">
                      + 子系列
                    </button>
                    <button onClick={() => toggleActive(p)}
                      className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition">
                      {p.active ? '隱藏' : '顯示'}
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition">
                      編輯
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="text-sm text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                      刪除
                    </button>
                  </div>
                </div>

                {/* 子系列列 */}
                {kids.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {kids.map((c) => (
                      <div key={c.id} className="px-4 py-3 flex items-center gap-3 pl-8">
                        <span className="text-gray-300">↳</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{c.name}</span>
                            {!c.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已隱藏</span>}
                            <span className="text-xs text-gray-300">排序 {c.sort_order}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => toggleActive(c)}
                            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                            {c.active ? '隱藏' : '顯示'}
                          </button>
                          <button onClick={() => openEdit(c)}
                            className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                            編輯
                          </button>
                          <button onClick={() => handleDelete(c)}
                            className="text-sm text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                            刪除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 新增/編輯 彈窗 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !saving && setShowForm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-5">
                {form.id ? '編輯系列' : (form.parent_id ? '新增子系列' : '新增大系列')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">系列名稱 <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass} placeholder="例如 英超 / 阿仙奴 / 花卉" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">上級系列</label>
                  <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className={inputClass}>
                    <option value="">（冇 — 設為大系列）</option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    揀咗上級 = 呢個係子系列;唔揀 = 大系列。
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">排序(數字越細越前)</label>
                  <input type="number" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className={inputClass} placeholder="0" />
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
                  顯示(前台可見)
                </label>
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={() => setShowForm(false)} disabled={saving}
                  className="flex-1 border border-gray-200 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving}
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

export default AdminCollections