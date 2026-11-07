import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  const [consent, setConsent] = useState<boolean | null>(() => getAnalyticsConsent());
  const [saved, setSaved] = useState(false);
  const choose = (accepted: boolean) => {
    setAnalyticsConsent(accepted);
    setConsent(accepted);
    setSaved(true);
  };

  return (
    <section className="bg-[var(--color-background)] px-5 pb-20 pt-32 text-[var(--color-foreground)] sm:px-8">
      <Helmet>
        <title>Privacidad y métricas | AdoptaME</title>
        <meta name="description" content="Conoce cómo protegemos tus datos y cómo usamos métricas anónimas en AdoptaME." />
      </Helmet>
      <article className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Tu privacidad importa</h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted-foreground)]">Usamos la información que compartes para acompañar una solicitud responsable y, si lo autorizas, entender qué perfiles reciben más interés.</p>
        <div className="mt-10 space-y-8">
          <section>
            <h2 className="font-heading text-xl font-bold">Datos de una solicitud</h2>
            <p className="mt-2 leading-relaxed text-[var(--color-muted-foreground)]">Tu nombre, correo, teléfono y ciudad se envían al equipo de AdoptaME para responder y dar seguimiento al interés que expresaste. No necesitas completar los detalles de tu hogar en el primer paso; podemos conversar esos datos contigo después.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold">Métricas opcionales</h2>
            <p className="mt-2 leading-relaxed text-[var(--color-muted-foreground)]">Si aceptas las métricas en esta pestaña, registraremos de forma agregada qué perfil de perro fue visto y para cuál se envió una solicitud. Esta medición no incluye tu nombre, correo ni teléfono y no usa una cuenta publicitaria. La preferencia termina al cerrar la pestaña y puedes rechazarla.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold">Control de tu decisión</h2>
            <p className="mt-2 leading-relaxed text-[var(--color-muted-foreground)]">Tu elección se guarda solo en esta pestaña. Puedes cambiarla aquí en cualquier momento. Rechazar las métricas no afecta el envío de una solicitud ni la atención del equipo.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" variant={consent === true ? 'warm' : 'outline'} onClick={() => choose(true)}>Aceptar métricas</Button>
              <Button type="button" variant={consent === false ? 'warm' : 'outline'} onClick={() => choose(false)}>Rechazar métricas</Button>
              {saved && <span role="status" className="text-sm text-[var(--color-muted-foreground)]">Preferencia guardada para esta pestaña.</span>}
            </div>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold">Contacto</h2>
            <p className="mt-2 leading-relaxed text-[var(--color-muted-foreground)]">Si tienes dudas sobre una solicitud o sobre el uso de tus datos, escríbenos desde el <Link to="/contacto" className="font-semibold text-[var(--color-primary)] underline">formulario de contacto</Link>.</p>
          </section>
        </div>
      </article>
    </section>
  );
}
