import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

function OrderSuccess() {
  const { state } = useLocation()
  const { t } = useLang()
  const orderNumber = state?.orderNumber

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold mt-6">{t('orderSuccess.title')}</h1>
      {orderNumber && (
        <p className="text-gray-500 mt-3">
          {t('orderSuccess.orderNumber')}:<span className="font-medium text-gray-800">{orderNumber}</span>
        </p>
      )}
      <p className="text-gray-500 mt-4 leading-relaxed">
        {t('orderSuccess.message')}
      </p>

      <div className="mt-8 flex gap-3 justify-center">
        <Link to="/collection"
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
          {t('orderSuccess.continueShopping')}
        </Link>
        <Link to="/"
          className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
          {t('orderSuccess.backHome')}
        </Link>
      </div>
    </div>
  )
}

export default OrderSuccess