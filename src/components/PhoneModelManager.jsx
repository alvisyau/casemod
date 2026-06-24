import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function PhoneModelManager() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('phone_models')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) console.error(error)
    setModels(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const maxOrder = models.reduce((m, x) => Math.max(m, x.sort_order || 0), 0)
    const { error } = await supabase
      .from('phone_models')
      .insert({ name, sort_order: maxOrder + 1 })
    setAdding(false)
    if (error) return alert('新增失敗:' + error.message)  // 例:名重複
    setNewName('')
    load()
  }

  async function toggleActive(m) {
    setModels((prev) => prev.map((x) => x.id === m.id ? { ...x, active: !x.active } : x))
    const { error } = await supabase
      .from('phone_models').update({ active: !m.active }).eq('id', m.id)
    if (error) { alert('更新失敗:' + error.message); load() }
  }

  async function handleDelete(m) {
    if (!window.confirm(`刪除型號「${m.name}」?\n已落咗單嘅紀錄唔受影響,但新產品將揀唔到呢個型號。`)) return
    const { error } = await supabase.from('phone_models').delete().eq('id', m.id)
    if (error) return alert('刪除失敗:' + error.message)
    load()
  }

  return (
    <div>
      {/* 新增 */}
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          placeholder="例如 iPhone 16 Pro Max"
        />
        <button onClick={handleAdd} disabled={adding || !newName.trim()}
          className="bg-black text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 whitespace-nowrap">
          {adding ? '新增緊…' : '+ 新增'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-4">載入緊…</p>
      ) : models.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">未有型號,喺上面加第一個。</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <div key={m.id}
              className={`flex items-center gap-2 border rounded-lg pl-3 pr-1.5 py-1.5 text-sm ${
                m.active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}>
              <span>{m.name}</span>
              {!m.active && <span className="text-xs text-gray-400">(隱藏)</span>}
              <button onClick={() => toggleActive(m)}
                title={m.active ? '隱藏' : '顯示'}
                className="text-xs text-gray-400 hover:text-gray-700 px-1">
                {m.active ? '👁' : '🚫'}
              </button>
              <button onClick={() => handleDelete(m)}
                title="刪除"
                className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-500 hover:text-white transition">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PhoneModelManager