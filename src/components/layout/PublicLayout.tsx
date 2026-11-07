import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import { Check, X } from 'lucide-react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { EmergencyBanner } from './EmergencyBanner';
import { PublicMobileNav } from './PublicMobileNav';
import { assetUrl } from '@/lib/assets';
import { SiteSearchProvider } from './SiteSearch';
import { ANALYTICS_CONSENT_EVENT, getAnalyticsConsent, setAnalyticsConsent, trackAnimalEvent } from '@/lib/analytics';

export function PublicLayout() {
  const { pathname, hash } = useLocation();
  const [analyticsConsent, setAnalyticsConsentState] = useState<boolean | null>(() => getAnalyticsConsent());

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  useEffect(() => {
    const trackCurrentProfile = () => {
      const match = pathname.match(/^\/adopta\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
      if (match) trackAnimalEvent('profile_view', match[1]);
    };
    const syncConsent = () => {
      setAnalyticsConsentState(getAnalyticsConsent());
      trackCurrentProfile();
    };
    trackCurrentProfile();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, syncConsent);
  }, [pathname]);

  const seo = pathname === '/adopta'
    ? { title: 'Adopta un perro | AdoptaME', description: 'Conoce perros rescatados y encuentra el compañero que encaja contigo.' }
    : pathname === '/tienda'
      ? { title: 'Tienda solidaria | AdoptaME', description: 'Compra productos con propósito y ayuda a financiar el rescate de perros.' }
      : pathname === '/donaciones'
        ? { title: 'Dona y salva una vida | AdoptaME', description: 'Tu apoyo cubre alimento, salud y recuperación para perros rescatados.' }
      : pathname.startsWith('/apadrina')
        ? { title: 'Apadrina un perro rescatado | AdoptaME', description: 'Acompaña el cuidado de un integrante de la manada mientras llega su familia.' }
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
  useEffect(() => {
    const syncDocumentTitle = () => {
      const metaTitle = document.head.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const title = metaTitle || seo.title;
      if (document.title !== title) document.title = title;
    };
    syncDocumentTitle();
    const observer = new MutationObserver(syncDocumentTitle);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] });
    return () => observer.disconnect();
  }, [pathname, seo.title]);
  const canonicalPath = pathname === '/' ? '' : `${pathname.replace(/^\//, '').replace(/\/$/, '')}/`;
  return (
    <MotionConfig reducedMotion="user">
      <SiteSearchProvider>
      <div className="public-shell flex flex-col min-h-screen bg-[var(--color-background)]">
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={`${window.location.origin}${import.meta.env.BASE_URL}${canonicalPath}`} />
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
        {analyticsConsent === null && <div role="region" aria-label="Preferencia de métricas" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-[var(--color-foreground)] shadow-xl lg:inset-x-5 lg:bottom-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">¿Nos permites contar visitas y solicitudes por perfil para mejorar la adopción? No incluimos tus datos de contacto. <Link to="/privacidad" className="font-semibold text-[var(--color-primary)] underline">Privacidad</Link></p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setAnalyticsConsent(false)} className="min-h-10 rounded-xl border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-muted)]"><X className="mr-1 inline h-3.5 w-3.5" />Ahora no</button>
              <button type="button" onClick={() => setAnalyticsConsent(true)} className="min-h-10 rounded-xl bg-[var(--color-primary)] px-3 text-xs font-semibold text-white hover:opacity-90"><Check className="mr-1 inline h-3.5 w-3.5" />Aceptar métricas</button>
            </div>
          </div>
        </div>}
      </div>
      </SiteSearchProvider>
    </MotionConfig>
  );
}
