import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage';
import TrackPage from './features/customer/TrackPage';

const LandingPage = lazy(() => import('./features/site/LandingPage'));
const LoyaltyPortal = lazy(() => import('./features/customer/LoyaltyPortal'));
const LegalPage = lazy(() => import('./features/site/LegalPage'));
const AnalyticsGuidePage = lazy(() => import('./features/site/AnalyticsGuidePage'));
const DashboardApp = lazy(() => import('./features/dashboard/DashboardApp'));
const AdminApp = lazy(() => import('./features/admin/AdminApp'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Marketing landing + legal (public) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="/guide/analytics" element={<AnalyticsGuidePage />} />

        {/* App A — customer (public) */}
        <Route path="/r/:slug" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId/car" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId/t/:tableToken" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order/:trackingToken" element={<TrackPage />} />
        <Route path="/loyalty" element={<LoyaltyPortal />} />

        {/* App B — Serva dashboard (JWT) */}
        <Route path="/dashboard/*" element={<DashboardApp />} />

        {/* App C — platform admin (JWT) */}
        <Route path="/admin/*" element={<AdminApp />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
