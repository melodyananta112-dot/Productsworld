import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import DeliveryPage from './pages/DeliveryPage';
import OrdersPage from './pages/OrdersPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from '@/components/ui/sonner';

import { CartProvider } from './context/CartContext';
import QuotaNotice from './components/QuotaNotice';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <QuotaNotice />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
            <Toaster position="top-center" />
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
