import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { EmergencyBanner } from './EmergencyBanner';

export function PublicLayout() {
  const { pathname } = useLocation();
  const seo = pathname === '/adopta'
    ? { title: 'Adopta un perro | AdoptaME', description: 'Conoce perros rescatados y encuentra el compañero que encaja contigo.' }
    : pathname === '/tienda'
      ? { title: 'Tienda solidaria | AdoptaME', description: 'Compra productos con propósito y ayuda a financiar el rescate de perros.' }
      : pathname === '/donaciones'
        ? { title: 'Dona y salva una vida | AdoptaME', description: 'Tu apoyo cubre alimento, salud y recuperación para perros rescatados.' }
        : pathname === '/voluntariado'
          ? { title: 'Súmate como voluntario | AdoptaME', description: 'Comparte tu tiempo y ayuda a transformar la vida de un perro.' }
          : { title: 'AdoptaME | Cada perro merece una historia feliz', description: 'Rescatamos perros, les devolvemos la confianza y encontramos hogares responsables.' };
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={`${window.location.origin}${pathname}`} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={`${window.location.origin}/images/dog_max.jpg`} />
      </Helmet>
      <EmergencyBanner />
      <PublicHeader />
      <main className="flex-1 pt-16" id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
