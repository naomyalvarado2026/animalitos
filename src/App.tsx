import { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Layouts & UI
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy-loaded Public pages
const HomePage = lazy(() => import('@/components/public/HomePage').then(m => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('@/components/public/AboutPage').then(m => ({ default: m.AboutPage })));
const HistoryPage = lazy(() => import('@/components/public/HistoryPage').then(m => ({ default: m.HistoryPage })));
const TransparencyPage = lazy(() => import('@/components/public/TransparencyPage').then(m => ({ default: m.TransparencyPage })));
const IncomePage = lazy(() => import('@/components/public/IncomePage').then(m => ({ default: m.IncomePage })));
const DonationsIncomePage = lazy(() => import('@/components/public/DonationsIncomePage').then(m => ({ default: m.DonationsIncomePage })));
const EventsIncomePage = lazy(() => import('@/components/public/EventsIncomePage').then(m => ({ default: m.EventsIncomePage })));
const ExpensesPage = lazy(() => import('@/components/public/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const DonatePage = lazy(() => import('@/components/public/DonatePage').then(m => ({ default: m.DonatePage })));
const TopDonorsPage = lazy(() => import('@/components/public/TopDonorsPage').then(m => ({ default: m.TopDonorsPage })));
const ContactPage = lazy(() => import('@/components/public/ContactPage').then(m => ({ default: m.ContactPage })));
const SupportPage = lazy(() => import('@/components/public/SupportPage').then(m => ({ default: m.SupportPage })));
const AdoptionGalleryPage = lazy(() => import('@/components/public/AdoptionGalleryPage').then(m => ({ default: m.AdoptionGalleryPage })));
const SuccessStoriesPage = lazy(() => import('@/components/public/SuccessStoriesPage').then(m => ({ default: m.SuccessStoriesPage })));
const VolunteerPage = lazy(() => import('@/components/public/VolunteerPage').then(m => ({ default: m.VolunteerPage })));
const FaqPage = lazy(() => import('@/components/public/FaqPage').then(m => ({ default: m.FaqPage })));
const StorePage = lazy(() => import('@/components/public/StorePage').then(m => ({ default: m.StorePage })));
const AdoptionProcessPage = lazy(() => import('@/components/public/AdoptionProcessPage').then(m => ({ default: m.AdoptionProcessPage })));
const SanctuaryPage = lazy(() => import('@/components/public/SanctuaryPage').then(m => ({ default: m.SanctuaryPage })));
const MemoryPage = lazy(() => import('@/components/public/MemoryPage').then(m => ({ default: m.MemoryPage })));
const ResourcesPage = lazy(() => import('@/components/public/ResourcesPage').then(m => ({ default: m.ResourcesPage })));
const NotFoundPage = lazy(() => import('@/components/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Lazy-loaded Admin pages
const AdminLoginPage = lazy(() => import('@/components/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import('@/components/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const FinanceManagement = lazy(() => import('@/components/admin/FinanceManagement').then(m => ({ default: m.FinanceManagement })));
const AnimalManagement = lazy(() => import('@/components/admin/AnimalManagement').then(m => ({ default: m.AnimalManagement })));
const ActivityManagement = lazy(() => import('@/components/admin/ActivityManagement').then(m => ({ default: m.ActivityManagement })));
const ApplicationsManagement = lazy(() => import('@/components/admin/ApplicationsManagement').then(m => ({ default: m.ApplicationsManagement })));
const ContentManagement = lazy(() => import('@/components/admin/ContentManagement').then(m => ({ default: m.ContentManagement })));
const DonorManagement = lazy(() => import('@/components/admin/DonorManagement').then(m => ({ default: m.DonorManagement })));
const SettingsManagement = lazy(() => import('@/components/admin/SettingsManagement').then(m => ({ default: m.SettingsManagement })));
const OrdersManagement = lazy(() => import('@/components/admin/OrdersManagement').then(m => ({ default: m.OrdersManagement })));
const AdminReportsPage = lazy(() => import('@/components/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const ProductManagement = lazy(() => import('@/components/admin/ProductManagement').then(m => ({ default: m.ProductManagement })));
const SuccessStoryManagement = lazy(() => import('@/components/admin/SuccessStoryManagement').then(m => ({ default: m.SuccessStoryManagement })));
const EditorialManagement = lazy(() => import('@/components/admin/EditorialManagement').then(m => ({ default: m.EditorialManagement })));
const StructureManagement = lazy(() => import('@/components/admin/StructureManagement').then(m => ({ default: m.StructureManagement })));
const MemoryManagement = lazy(() => import('@/components/admin/MemoryManagement').then(m => ({ default: m.MemoryManagement })));
const TeamManagement = lazy(() => import('@/components/admin/TeamManagement').then(m => ({ default: m.TeamManagement })));
const DonationImpactManagement = lazy(() => import('@/components/admin/DonationImpactManagement').then(m => ({ default: m.DonationImpactManagement })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

export default function App() {
  const [qc] = useState(() => queryClient);

  useEffect(() => {
    const handleStoreUpdate = () => {
      qc.invalidateQueries();
    };
    window.addEventListener('animalitos_store_updated', handleStoreUpdate);
    return () => window.removeEventListener('animalitos_store_updated', handleStoreUpdate);
  }, [qc]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CurrencyProvider>
              <HashRouter>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    {/* ── Public routes ── */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/adopta" element={<AdoptionGalleryPage />} />
                      <Route path="/adopta/:slug" element={<AdoptionGalleryPage />} />
                      <Route path="/como-funciona" element={<AdoptionProcessPage />} />
                      <Route path="/santuario" element={<SanctuaryPage />} />
                      <Route path="/en-memoria" element={<MemoryPage />} />
                      <Route path="/recursos" element={<ResourcesPage />} />
                      <Route path="/tienda" element={<StorePage />} />
                      <Route path="/nosotros" element={<AboutPage />} />
                      <Route path="/nosotros/historia" element={<HistoryPage />} />
                      <Route path="/historias-de-exito" element={<SuccessStoriesPage />} />
                      <Route path="/voluntariado" element={<VolunteerPage />} />
                      <Route path="/faq" element={<FaqPage />} />
                      <Route path="/transparencia" element={<TransparencyPage />} />
                      <Route path="/transparencia/ingresos" element={<IncomePage />} />
                      <Route path="/transparencia/ingresos/donaciones" element={<DonationsIncomePage />} />
                      <Route path="/transparencia/ingresos/eventos" element={<EventsIncomePage />} />
                      <Route path="/transparencia/egresos" element={<ExpensesPage />} />
                      <Route path="/donaciones" element={<DonatePage />} />
                      <Route path="/donaciones/donadores-principales" element={<TopDonorsPage />} />
                      <Route path="/contacto" element={<ContactPage />} />
                      <Route path="/contacto/quiero-apoyar" element={<SupportPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>

                    {/* ── Admin login (no layout) ── */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* ── Protected admin routes ── */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/animales" element={<AnimalManagement />} />
                        <Route path="/admin/solicitudes" element={<ApplicationsManagement />} />
                        <Route path="/admin/actividades" element={<ActivityManagement />} />
                        <Route path="/admin/finanzas" element={<FinanceManagement />} />
                        <Route path="/admin/donadores" element={<DonorManagement />} />
                        <Route path="/admin/contenido" element={<ContentManagement />} />
                        <Route path="/admin/usuarios" element={<UserManagement />} />
                        <Route path="/admin/configuracion" element={<SettingsManagement />} />
                        <Route path="/admin/pedidos" element={<OrdersManagement />} />
                        <Route path="/admin/reportes" element={<AdminReportsPage />} />
                        <Route path="/admin/productos" element={<ProductManagement />} />
                        <Route path="/admin/historias" element={<SuccessStoryManagement />} />
                        <Route path="/admin/editorial" element={<EditorialManagement />} />
                        <Route path="/admin/estructura" element={<StructureManagement />} />
                        <Route path="/admin/memoria" element={<MemoryManagement />} />
                        <Route path="/admin/equipo" element={<TeamManagement />} />
                        <Route path="/admin/impacto-donaciones" element={<DonationImpactManagement />} />
                      </Route>
                    </Route>

                  </Routes>
                </Suspense>
              </HashRouter>

              <Toaster
                position="top-right"
                richColors
                theme="system"
                toastOptions={{
                  style: {
                    borderRadius: '12px',
                    fontFamily: 'Inter, sans-serif',
                  },
                }}
              />
            </CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
