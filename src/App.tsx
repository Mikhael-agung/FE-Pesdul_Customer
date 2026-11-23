import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Cart from './pages/Cart';
import CheckoutType from './pages/CheckoutType';
import CheckoutReview from './pages/CheckoutReview';
import Pay from './pages/Pay';
import OrderDetail from './pages/OrderDetail';
import Orders from './pages/Orders';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/type" element={<CheckoutType />} />
          <Route path="/checkout/review" element={<CheckoutReview />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:code" element={<OrderDetail />} />
          <Route path="/orders/:code/pay" element={<Pay />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
