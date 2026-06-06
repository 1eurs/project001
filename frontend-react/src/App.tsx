import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './features/site/LandingPage';
import Landing from './features/Landing';
import MenuPage from './features/customer/MenuPage';
import CartPage from './features/customer/CartPage';
import TrackPage from './features/customer/TrackPage';
import DashboardApp from './features/dashboard/DashboardApp';
import AdminApp from './features/admin/AdminApp';

// Design-selection tools (internal) — split into their own chunks so they never
// ship to café/customer traffic on the main bundle.
const DashboardGallery = lazy(() => import('./features/dashboard-designs/Gallery'));
const LandingGallery = lazy(() => import('./features/landing-designs/LandingGallery'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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

      {/* Dashboard design gallery — pick a concept at /designs (?d=1..6) */}
      <Route path="/designs" element={<Suspense fallback={null}><DashboardGallery /></Suspense>} />

      {/* Landing-page design gallery — pick a concept at /landings (?d=1..5&lang=ar|en) */}
      <Route path="/landings" element={<Suspense fallback={null}><LandingGallery /></Suspense>} />

      {/* App C — platform admin (JWT) */}
      <Route path="/admin/*" element={<AdminApp />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
