import { useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

// ── 解析一行 CSV(處理引號) ──────────────────────────
function parseCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cur += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

// ── 將 CSV 文字 → rows ───────────────────────────────
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '')            // 去 BOM
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return { headers: [], rows: [] }

  // ⭐ 偵測分隔符:第一行有 Tab 就用 Tab,否則用逗號
  const delim = lines[0].includes('\t') ? '\t' : ','

  const split = (line) => {
    if (delim === '\t') return line.split('\t')
    // 逗號:處理引號包住嘅情況
    const out = []; let cur = ''; let q = false
    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { out.push(cur); cur = '' }
      else cur += ch
    }
    out.push(cur)
    return out
  }

  const headers = split(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cells = split(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (cells[i] || '').trim() })
    return obj
  })
  return { headers, rows }
}

// ── 智能讀檔:UTF-8 失敗自動轉 Big5(繁中 Excel 預設) ──
async function readFileSmart(file) {
  const buf = await file.arrayBuffer()
  try {
    // 嚴格模式:遇到非法 byte 會 throw
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('big5').decode(buf)
  }
}

// ── 智能對欄位:支援中英文 header ─────────────────────
function normalizeRow(row) {
  const pick = (...keys) => {
    for (const k of keys) {
      if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]).trim()
    }
    return ''
  }

  const code = pick('點碼', '網點代碼', '服務點編號', 'code')
  const address = pick('地址', '自助櫃詳細地址', 'address')
  const district = pick('地區', 'district')
  const name = pick('網點簡稱', '服務點名稱', 'name') || code  // 自助櫃冇名 → 用代碼

  // ⭐ 自動分類:代碼以 H 開頭、或地址含「自助櫃」→ locker;否則 station
  const isLocker = /^H/i.test(code) || /自助櫃/.test(address)
  const type = isLocker ? 'locker' : 'station'

  // 營業時間:兩種格式都拼埋
  const hours = [
    pick('星期一至五') && '一至五 ' + pick('星期一至五'),
    pick('星期六') && '六 ' + pick('星期六'),
    pick('星期日/假期', '星期日／假期') && '日/假 ' + pick('星期日/假期', '星期日／假期'),
    pick('開放時間 （星期一至六）') && '一至六 ' + pick('開放時間 （星期一至六）'),
    pick('開放時間 （星期日／公眾假期）') && '日/假 ' + pick('開放時間 （星期日／公眾假期）'),
  ].filter(Boolean).join(' / ')

  return { code, name, address, district, type, hours }
}

export default function SFImport({ onDone }) {
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)   // { ok, msg }

  const stats = rows.reduce(
    (acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc },
    {}
  )

  const handleFile = useCallback(async (file) => {
    if (!file) return
    setParsing(true)
    setResult(null)
    try {
      const text = await readFileSmart(file)        // ⭐ 自動 UTF-8 / Big5
      const { headers, rows: raw } = parseCSV(text)

      // 偵錯:Console 睇 header(萬一仲係 0 筆,貼返我)
      console.log('SFImport headers:', headers)
      console.log('SFImport 原始筆數:', raw.length)

      const norm = raw
        .map(normalizeRow)
        .filter((r) => r.code) // 一定要有 code
      setRows(norm)
      setFileName(file.name)

      if (norm.length === 0) {
        setResult({ ok: false, msg: '解析到 0 筆,請檢查欄位名稱(開 F12 Console 睇 headers)。' })
      }
    } catch (err) {
      setResult({ ok: false, msg: '解析失敗:' + err.message })
    }
    setParsing(false)
  }, [])

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    setResult(null)

    // 去重(同 code 只保留最後一個)
    const map = new Map()
    rows.forEach((r) => map.set(r.code, r))
    const unique = Array.from(map.values())

    // ⭐ 完全同步:先刪走「今次 CSV 包含嘅 type」嘅舊資料
    const types = [...new Set(unique.map((r) => r.type))]   // 例如 ['locker'] 或 ['station'] 或兩者都有
    for (const t of types) {
      const { error: delErr } = await supabase
        .from('sf_locations')
        .delete()
        .eq('type', t)
      if (delErr) {
        setImporting(false)
        setResult({ ok: false, msg: `清除舊資料失敗(${t}):` + delErr.message })
        return
      }
    }

    // 分批 upsert(每 500 筆)
    let inserted = 0
    const chunkSize = 500
    for (let i = 0; i < unique.length; i += chunkSize) {
      const chunk = unique.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('sf_locations')
        .upsert(chunk, { onConflict: 'code' })
      if (error) {
        setImporting(false)
        setResult({ ok: false, msg: '寫入失敗:' + error.message })
        return
      }
      inserted += chunk.length
    }

    // ⭐ 寫完即刻讀返筆數核對(防止 RLS 靜靜哋擋)
    const { count, error: cntErr } = await supabase
      .from('sf_locations')
      .select('code', { count: 'exact', head: true })

    setImporting(false)

    if (cntErr) {
      setResult({ ok: false, msg: '核對失敗:' + cntErr.message })
      return
    }

    const msg = `已完全同步 ${inserted} 筆(類型:${types.join(', ')}),資料庫現有 ${count} 筆。`
    setResult({ ok: true, msg })
    onDone?.({ ok: true, msg, count })
  }

  return (
    <div>
      {/* 上載 */}
      <label className="block">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-black file:text-white hover:file:bg-gray-800 file:cursor-pointer"
        />
      </label>

      {parsing && <p className="text-xs text-gray-400 mt-2">解析緊…</p>}

      {/* 預覽 */}
      {rows.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{fileName}</span>:共 {rows.length} 筆
            {' '}(順豐站 {stats.station || 0}、自助櫃 {stats.locker || 0})
          </div>

          <div className="border border-gray-100 rounded-lg overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2">code</th>
                  <th className="text-left px-3 py-2">type</th>
                  <th className="text-left px-3 py-2">district</th>
                  <th className="text-left px-3 py-2">name</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2">{r.code}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.district}</td>
                    <td className="px-3 py-2 truncate max-w-[120px]">{r.name || r.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <div className="px-3 py-2 text-gray-400 bg-gray-50 border-t border-gray-100">
                …仲有 {rows.length - 5} 筆
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-3 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {importing ? '匯入緊…' : `確認匯入 ${rows.length} 筆`}
          </button>
        </div>
      )}

      {/* 結果 */}
      {result && (
        <p className={`text-sm mt-3 ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
          {result.ok ? '✓ ' : '✗ '}{result.msg}
        </p>
      )}
    </div>
  )
}