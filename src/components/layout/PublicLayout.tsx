import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { EmergencyBanner } from './EmergencyBanner';
import { PublicMobileNav } from './PublicMobileNav';
import { assetUrl } from '@/lib/assets';
import { SiteSearchProvider } from './SiteSearch';

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
          : pathname === '/como-funciona'
            ? { title: 'Cómo funciona la adopción | AdoptaME', description: 'Conoce el proceso responsable para adoptar un perro rescatado.' }
            : pathname === '/santuario'
              ? { title: 'Santuario y padrinazgo | AdoptaME', description: 'Acompaña a los residentes permanentes que necesitan cuidados especiales.' }
              : pathname === '/en-memoria'
                ? { title: 'En memoria de | AdoptaME', description: 'Honramos a los perros que dejaron una huella en nuestra manada.' }
                : pathname === '/recursos'
                  ? { title: 'Recursos de tenencia responsable | AdoptaME', description: 'Guías para cuidar, adaptar y convivir mejor con un perro.' }
          : { title: 'AdoptaME | Cada perro merece una historia feliz', description: 'Rescatamos perros, les devolvemos la confianza y encontramos hogares responsables.' };
  return (
    <MotionConfig reducedMotion="user">
      <SiteSearchProvider>
      <div className="public-shell flex flex-col min-h-screen bg-[var(--color-background)]">
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={`${window.location.origin}${pathname}`} />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:image" content={`${window.location.origin}${assetUrl('/images/dog_max.jpg')}`} />
        </Helmet>
        <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); const main = document.getElementById('main-content'); main?.focus(); main?.scrollIntoView(); }}>Saltar al contenido principal</a>
        <EmergencyBanner />
        <PublicHeader />
        <main className="flex-1 pb-20 lg:pb-0" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <PublicFooter />
        <PublicMobileNav />
      </div>
      </SiteSearchProvider>
    </MotionConfig>
  );
}
