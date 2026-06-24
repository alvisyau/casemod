import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Order from './pages/Order'
import Collection from './pages/Collection'
import CollectionDetail from './pages/CollectionDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import AdminLogin from './pages/AdminLogin'
import AdminOrders from './pages/AdminOrders'
import RequireAuth from './components/RequireAuth'
import AdminProducts from './pages/AdminProducts'
import AdminCollections from './pages/AdminCollections'
import AdminSettings from './pages/AdminSettings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== 前台(包 Layout:有 header / 購物車 / footer) ===== */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:id" element={<CollectionDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order" element={<Order />} />
        </Route>

        {/* ===== 後台(唔包前台 Layout) ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={
          <RequireAuth><AdminOrders /></RequireAuth>
        } />
        <Route path="/admin/products" element={
          <RequireAuth><AdminProducts /></RequireAuth>
        } />
        <Route path="/admin/collections" element={
          <RequireAuth><AdminCollections /></RequireAuth>
        } />
        <Route path="/admin/settings" element={
          <RequireAuth><AdminSettings /></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App