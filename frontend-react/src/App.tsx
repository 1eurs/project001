import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage';
import TrackPage from './features/customer/TrackPage';

// Customer routes stay in the entry chunk — a QR scan is the latency-critical path.
// The marketing site, owner dashboard, and admin console load on demand so customers
// never download them.
const DefaultLandingPage = lazy(() => import('./features/site/DefaultLandingPage'));
const SignupPage = lazy(() => import('./features/site/SignupPage'));
const LegalPage = lazy(() => import('./features/site/LegalPage'));
const Landing = lazy(() => import('./features/Landing'));
const DashboardApp = lazy(() => import('./features/dashboard/DashboardApp'));
const AdminApp = lazy(() => import('./features/admin/AdminApp'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<DefaultLandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/refund" element={<LegalPage doc="refund" />} />
        <Route path="/apps" element={<Landing />} />

        {/* App A — customer (public) */}
        <Route path="/r/:slug" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId/car" element={<MenuPage />} />
        <Route path="/r/:slug/b/:branchId/t/:tableToken" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order/:trackingToken" element={<TrackPage />} />

        {/* App B — Serva dashboard (JWT) */}
        <Route path="/dashboard/*" element={<DashboardApp />} />

        {/* App C — platform admin (JWT) */}
        <Route path="/admin/*" element={<AdminApp />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
