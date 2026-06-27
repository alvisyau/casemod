// src/components/PolicyModal.jsx
import { useEffect } from 'react'

function renderBlock(b, i) {
  switch (b.type) {
    case 'p':
      return <p key={i} className="text-sm leading-relaxed text-gray-600">{b.text}</p>
    case 'h':
      return <h4 key={i} className="text-base font-semibold text-gray-900 pt-2">{b.text}</h4>
    case 'note':
      return <p key={i} className="text-xs text-gray-400">{b.text}</p>
    case 'ul':
      return (
        <ul key={i} className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-gray-600">
          {b.items.map((it, j) => <li key={j}>{it}</li>)}
        </ul>
      )
    case 'qa':
      return (
        <div key={i} className="space-y-5">
          {b.items.map((it, j) => (
            <div key={j}>
              <p className="font-medium text-gray-900 mb-1">Q：{it.q}</p>
              <p className="text-sm leading-relaxed text-gray-600">A：{it.a}</p>
            </div>
          ))}
        </div>
      )
    case 'table':
      return (
        <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>{b.headers.map((h, j) => <th key={j} className="px-4 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {b.rows.map((row, j) => (
                <tr key={j}>{row.map((c, k) => <td key={k} className="px-4 py-2 text-gray-600">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

function PolicyModal({ policy, onClose }) {
  useEffect(() => {
    if (!policy) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [policy, onClose])

  if (!policy) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{policy.title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {policy.blocks.map(renderBlock)}
        </div>
      </div>
    </div>
  )
}

export default PolicyModal