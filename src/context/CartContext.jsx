import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  // 初始化:由 localStorage 讀返
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // items 一變就寫返入 localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  // 加入購物車。同款同型號就加數量,否則新增一行
  function addItem(newItem) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.designId === newItem.designId && it.phoneModel === newItem.phoneModel
      )
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + newItem.quantity }
        return copy
      }
      return [...prev, newItem]
    })
  }

  // 改數量(用 designId + phoneModel 做 key)
  function updateQuantity(designId, phoneModel, quantity) {
    if (quantity < 1) return
    setItems((prev) =>
      prev.map((it) =>
        it.designId === designId && it.phoneModel === phoneModel
          ? { ...it, quantity }
          : it
      )
    )
  }

  function removeItem(designId, phoneModel) {
    setItems((prev) =>
      prev.filter((it) => !(it.designId === designId && it.phoneModel === phoneModel))
    )
  }

  function clearCart() {
    setItems([])
  }

  // 衍生數值
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0)
  const totalAmount = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalCount, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

// 方便其他 component 用
export function useCart() {
  return useContext(CartContext)
}