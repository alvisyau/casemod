import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { phoneModels } from '../data/phones'
import PhotoEditor from '../components/PhotoEditor'

function Order() {
  const [step, setStep] = useState(1)
  const [products, setProducts] = useState([])
  const [order, setOrder] = useState({
    phone_model: null,
    product: null,
    photo: null,
  })

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => setProducts(data || []))
  }, [])

  const steps = ['揀機型', '揀款式', '上載相片', '填資料', '確認落單']

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10">
        {steps.map((label, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={label} className="flex-1 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${active ? 'bg-black text-white' : done ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`mt-1 text-xs ${active ? 'text-black font-medium' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold mb-4">選擇你的手機型號</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {phoneModels.map((model) => {
              const selected = order.phone_model === model
              return (
                <button key={model} onClick={() => setOrder({ ...order, phone_model: model })}
                  className={`p-4 rounded-lg border text-sm font-medium text-left transition
                  ${selected ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                  {model}
                </button>
              )
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <button disabled={!order.phone_model} onClick={() => setStep(2)}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
              下一步
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-1">選擇手機殼款式</h2>
          <p className="text-sm text-gray-500 mb-4">型號：{order.phone_model}</p>
          <div className="space-y-3">
            {products.map((p) => {
              const selected = order.product?.id === p.id
              return (
                <button key={p.id} onClick={() => setOrder({ ...order, product: p })}
                  className={`w-full p-4 rounded-lg border flex items-center justify-between transition
                  ${selected ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
                  <span className="font-medium">{p.name_zh_hk}</span>
                  <span className="text-gray-700">HK${p.price_hkd}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">返回</button>
            <button disabled={!order.product} onClick={() => setStep(3)}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">下一步</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold mb-1">上載相片並調整構圖</h2>
          <p className="text-sm text-gray-500 mb-4">{order.phone_model} ／ {order.product?.name_zh_hk}</p>
          <PhotoEditor value={order.photo} onChange={(photo) => setOrder({ ...order, photo })} />
          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-gray-300 font-medium">返回</button>
            <button disabled={!order.photo?.imgSrc} onClick={() => setStep(4)}
              className="px-6 py-2 rounded-lg bg-black text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">下一步</button>
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="text-center py-12 text-gray-400">
          <p>（Phase 1-C 填資料，下一步整）</p>
          <p className="mt-2 text-sm">{order.phone_model} ／ {order.product?.name_zh_hk} ／ 相片已選</p>
          <button onClick={() => setStep(3)} className="mt-4 px-6 py-2 rounded-lg border border-gray-300 font-medium">返回</button>
        </div>
      )}
    </div>
  )
}

export default Order