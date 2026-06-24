import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'


function Cart() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">購物車</h1>
        <p className="text-gray-400 mt-4">你嘅購物車係空嘅。</p>
        <Link to="/collection"
          className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
          去睇現成系列
        </Link>
      </div>
    )
  }

  // 計總共慳咗(只計有特價嘅商品)
  const totalSaved = items.reduce((sum, it) => {
    if (it.originalPrice) {
      return sum + (it.originalPrice - it.unitPrice) * it.quantity
    }
    return sum
  }, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">購物車</h1>

      <div className="space-y-4">
        {items.map((it) => (
          <div key={`${it.designId}-${it.phoneModel}`}
            className="flex gap-4 items-center border border-gray-100 rounded-xl p-4">
            {/* 縮圖:有真相用真相,否則 fallback 漸層 */}
            <div className="relative w-16 h-28 rounded-lg overflow-hidden bg-gray-50 shrink-0">
              {it.image ? (
                <img src={it.image} alt={it.designName} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className={`w-full h-full bg-gradient-to-br ${it.gradient || 'from-gray-200 to-gray-400'}`} />
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md border-2 border-white/50" />
                </>
              )}
            </div>

            {/* 資料 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{it.collection}</p>
              <h3 className="font-medium text-sm">{it.designName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{it.phoneModel}</p>
              <p className="text-sm mt-1">
                {it.originalPrice ? (
                  <>
                    <span className="text-red-500 font-medium">HK${it.unitPrice}</span>
                    <span className="line-through text-gray-300 text-xs ml-2">HK${it.originalPrice}</span>
                  </>
                ) : (
                  <span className="text-gray-800">HK${it.unitPrice}</span>
                )}
              </p>
            </div>

            {/* 數量 */}
            <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button onClick={() => updateQuantity(it.designId, it.phoneModel, it.quantity - 1)}
                className="px-3 py-1.5 hover:bg-gray-50">−</button>
              <span className="px-3 py-1.5 text-sm min-w-[2.5rem] text-center">{it.quantity}</span>
              <button onClick={() => updateQuantity(it.designId, it.phoneModel, it.quantity + 1)}
                className="px-3 py-1.5 hover:bg-gray-50">+</button>
            </div>

            {/* 刪除 */}
            <button onClick={() => removeItem(it.designId, it.phoneModel)}
              className="text-gray-300 hover:text-red-400 transition shrink-0 p-1" title="移除">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 總額 */}
      <div className="mt-8 border-t pt-6">
        {totalSaved > 0 && (
          <div className="flex justify-between items-center text-sm text-red-500 mb-2">
            <span>特價優惠</span>
            <span>− HK${totalSaved}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-lg">
          <span className="font-medium">總計</span>
          <span className="font-bold">HK${totalAmount}</span>
        </div>
        {totalSaved > 0 && (
          <p className="text-xs text-gray-400 text-right mt-1">已為你慳咗 HK${totalSaved}</p>
        )}
        <Link to="/checkout"
          className="block text-center w-full mt-6 bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition">
          前往結帳
        </Link>
        <Link to="/collection"
          className="block text-center text-sm text-gray-400 hover:text-gray-700 mt-4 transition">
          繼續選購
        </Link>
      </div>
    </div>
  )
}

export default Cart