import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext'
import { LanguageProvider } from './context/LanguageContext'   // ⭐ import

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>          {/* ⭐ 包喺最外層 */}
      <CartProvider>
        <App />
      </CartProvider>
    </LanguageProvider>
  </StrictMode>
)