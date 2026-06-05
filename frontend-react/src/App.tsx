import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/site/LandingPage';
import Landing from './features/Landing';
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage';
import TrackPage from './features/customer/TrackPage';
import DashboardApp from './features/dashboard/DashboardApp';
import AdminApp from './features/admin/AdminApp';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/apps" element={<Landing />} />

      {/* App A — customer (public) */}
      <Route path="/r/:slug" element={<MenuPage />} />
      <Route path="/r/:slug/b/:branchId" element={<MenuPage />} />
      <Route path="/r/:slug/b/:branchId/t/:tableToken" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/order/:trackingToken" element={<TrackPage />} />

      {/* App B — cafe dashboard (JWT) */}
      <Route path="/dashboard/*" element={<DashboardApp />} />

      {/* App C — platform admin (JWT) */}
      <Route path="/admin/*" element={<AdminApp />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
