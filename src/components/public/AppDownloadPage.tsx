import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FolderDown,
  HelpCircle,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PawBackground } from '@/components/layout/PawBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { assetUrl } from '@/lib/assets';
import {
  ANDROID_APK_FILENAME,
  ANDROID_APP_CANONICAL_URL,
  ANDROID_APP_MIN_VERSION,
  ANDROID_APP_PACKAGE_ID,
  ANDROID_LATEST_RELEASE_API_URL,
  getAndroidAppFallbackInfo,
  isNativeAndroidApp,
  parseGithubApkRelease,
  type AndroidReleaseInfo,
} from '@/lib/androidApp';
import { AppDownloadQr } from './AppDownloadQr';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform?: string };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const INSTALL_STEPS = [
  {
    number: '01',
    title: 'Descarga el archivo APK',
    description:
      'Toca el botón «Descargar APK para Android». Se bajará directamente desde nuestro repositorio oficial en GitHub.',
    icon: Download,
  },
  {
    number: '02',
    title: 'Abre la descarga',
    description:
      'Cuando termine, toca «Abrir» en la notificación del navegador o entra a la carpeta Descargas de tu teléfono.',
    icon: FolderDown,
  },
  {
    number: '03',
    title: 'Permite la instalación',
    description:
      'Si Android pregunta por primera vez, activa «Permitir desde esta fuente» para Chrome o tu gestor de archivos.',
    icon: Settings,
  },
  {
    number: '04',
    title: 'Toca Instalar y listo',
    description:
      'Confirma «Instalar» y encontrarás el ícono de AdoptaME en tu pantalla de inicio para abrirla en un toque.',
    icon: CheckCircle2,
  },
];

const APP_BENEFITS = [
  {
    title: 'Acceso directo en 1 toque',
    description:
      'Abre los perfiles de perritos, campañas y tienda solidaria sin buscar enlaces en el navegador.',
    icon: Smartphone,
  },
  {
    title: 'Siempre actualizada',
    description:
      'Los nuevos rescatados, historias y actividades del refugio llegan al instante sin reinstalar la app.',
    icon: RefreshCw,
  },
  {
    title: 'Ligera y respetuosa',
    description:
      'Ocupa pocos megabytes y solo solicita acceso a internet; no pide contactos, ubicación ni cámara.',
    icon: Sparkles,
  },
  {
    title: 'Publicación verificable en GitHub',
    description:
      'El código fuente y cada paquete APK firmado están publicados en GitHub Releases para total transparencia.',
    icon: ShieldCheck,
  },
];

const APP_FAQS = [
  {
    question: '¿Es seguro descargar e instalar este APK?',
    answer:
      'Sí. El archivo está firmado y alojado únicamente en GitHub Releases del repositorio oficial de AdoptaME, y no solicita permisos invasivos en tu dispositivo (únicamente conexión a internet).',
  },
  {
    question: '¿Por qué Chrome dice «Es posible que el archivo sea dañino» o Android pide permiso?',
    answer:
      'Android y Chrome muestran ese aviso estándar con cualquier aplicación descargada fuera de Google Play Store. Solo toca «Descargar de todos modos» y habilita temporalmente la instalación desde tu navegador.',
  },
  {
    question: '¿Tengo que volver a descargar el APK cuando llegan perritos nuevos?',
    answer:
      'No. La app se conecta directamente con la plataforma actualizada de AdoptaME, así que ves los rescates, adopciones, voluntariado y novedades al instante.',
  },
  {
    question: '¿Qué hago si tengo iPhone o prefiero no descargar un APK?',
    answer:
      'Puedes instalar AdoptaME como app web (PWA): en Safari (iPhone/iPad) toca Compartir y «Añadir a pantalla de inicio»; en Chrome (Android) abre el menú ⋮ y elige «Instalar app».',
  },
];

function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function AppDownloadPage() {
  const [release, setRelease] = useState<AndroidReleaseInfo>(() => getAndroidAppFallbackInfo());
  const [runningInApp] = useState(() => isNativeAndroidApp());
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(ANDROID_LATEST_RELEASE_API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        const parsed = parseGithubApkRelease(data);
        if (parsed.isLiveRelease) {
          setRelease(parsed);
        }
      })
      .catch(() => {
        // Conserva el enlace estable de última versión en GitHub Releases sin mostrar errores al usuario.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) {
      setPwaInstalled(true);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPwaPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPwaPrompt(null);
      setPwaInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(ANDROID_APP_CANONICAL_URL);
      toast.success('Enlace copiado', {
        description: 'Compártelo por WhatsApp para instalar AdoptaME en cualquier teléfono Android.',
      });
    } catch {
      toast('Enlace de descarga', {
        description: ANDROID_APP_CANONICAL_URL,
      });
    }
  }

  async function handleInstallPwa() {
    if (!pwaPrompt) return;
    try {
      await pwaPrompt.prompt();
      const choice = await pwaPrompt.userChoice;
      setPwaPrompt(null);
      if (choice.outcome === 'accepted') {
        setPwaInstalled(true);
        toast.success('AdoptaME quedó añadida a tu pantalla de inicio.');
      }
    } catch {
      setPwaPrompt(null);
    }
  }

  const publishedDate = formatPublishedDate(release.publishedAt);

  return (
    <div className="pt-16">
      <Helmet>
        <title>Descargar App Android (APK) | AdoptaME</title>
        <meta
          name="description"
          content="Descarga e instala la app oficial de AdoptaME para Android (.apk) desde GitHub o agrégala a tu pantalla de inicio."
        />
      </Helmet>

      {/* Hero de descarga */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        <PawBackground className="opacity-45" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {runningInApp && (
            <div
              role="status"
              className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    ¡Ya estás navegando desde la app Android de AdoptaME!
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Desde aquí puedes comprobar si hay un APK nuevo en GitHub o compartir el enlace con otra persona.
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyShareLink()}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Compartir app
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-accent-foreground)]">
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                App oficial para Android · Gratis
              </div>

              <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Lleva a AdoptaME en tu{' '}
                <span className="brand-gradient-text">teléfono Android</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
                Descarga el archivo APK oficial directamente desde GitHub e instálalo en segundos.
                Explora perritos rescatados, postula para adoptar o ser voluntario, apoya campañas y
                mantente al tanto del refugio en un solo toque.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button variant="warm" size="xl" asChild>
                  <a
                    href={release.downloadUrl}
                    download={ANDROID_APK_FILENAME}
                    rel="noopener noreferrer"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                    Descargar APK para Android
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => void handleCopyShareLink()}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar enlace
                </Button>

                <Button variant="ghost" size="lg" asChild>
                  <a href={release.releaseUrl} target="_blank" rel="noopener noreferrer">
                    Ver en GitHub Releases
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>

              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Versión</dt>
                  <dd>Versión {release.version}</dd>
                </div>
                {release.sizeLabel && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Tamaño</dt>
                    <dd>· Peso {release.sizeLabel}</dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Compatibilidad</dt>
                  <dd>· {ANDROID_APP_MIN_VERSION}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Distribución</dt>
                  <dd>· Sin Play Store · 100% gratis</dd>
                </div>
                {publishedDate && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Publicado</dt>
                    <dd>· Publicado el {publishedDate}</dd>
                  </div>
                )}
              </dl>
            </motion.div>

            {/* Tarjeta QR + Vista previa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="lg:col-span-5"
            >
              <div className="rounded-3xl border border-[#65477c]/40 bg-[#17022b] p-6 text-white shadow-xl sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={assetUrl('/pwa-icon-512.png')}
                      alt="Ícono de la app AdoptaME"
                      width={52}
                      height={52}
                      className="h-13 w-13 rounded-2xl shadow-md"
                    />
                    <div>
                      <p className="font-heading text-lg font-bold text-white">AdoptaME</p>
                      <p className="text-xs text-[#e0beff]">{ANDROID_APP_PACKAGE_ID}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#ff8069] px-3 py-1 text-xs font-extrabold text-[#17022b]">
                    v{release.version}
                  </span>
                </div>

                <div className="mt-6 flex flex-col items-center rounded-2xl bg-[#250c3d] p-5 text-center">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e0beff]">
                    <QrCode className="h-4 w-4 text-[#ff8069]" aria-hidden="true" />
                    Escanea desde tu celular Android
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-3 shadow-lg">
                    <AppDownloadQr className="h-40 w-40" />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-white/75">
                    Apunta la cámara de tu teléfono para abrir esta página directamente y tocar
                    <strong className="text-white"> Descargar APK</strong>.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cómo instalar en 4 pasos */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-card)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-[var(--color-foreground)]">
              Cómo instalarla fácilmente en 4 pasos
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
              Como la descargamos directo desde nuestro GitHub sin pasar por Google Play, tu celular te pedirá una única confirmación de permiso.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {INSTALL_STEPS.map(({ number, title, description, icon: Icon }) => (
              <Card key={number} className="hover-card relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold tracking-widest text-[var(--color-primary)]">
                      PASO {number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-[var(--color-foreground)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                <strong className="text-[var(--color-foreground)]">¿Te aparece un aviso de seguridad?</strong>{' '}
                Es completamente normal al instalar archivos <code>.apk</code> directos. Una vez
                instalada la app, puedes desactivar «Permitir desde esta fuente» si lo prefieres.
              </p>
            </div>
            <a
              href={release.downloadUrl}
              download={ANDROID_APK_FILENAME}
              className="mt-4 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline sm:mt-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar {ANDROID_APK_FILENAME}
            </a>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-[var(--color-foreground)]">
              Pensada para acompañarte en todo el proceso
            </h2>
            <p className="mt-2.5 text-sm text-[var(--color-muted-foreground)] sm:text-base">
              Todas las funciones del refugio en una aplicación liviana para Android.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {APP_BENEFITS.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="hover-card">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-[var(--color-foreground)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Opción alternativa PWA / iPhone + Ficha técnica */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-card)] py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Card className="lg:col-span-6">
            <CardContent className="flex h-full flex-col justify-between p-6 sm:p-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)]">
                  Alternativa sin archivo APK / iPhone
                </span>
                <h2 className="mt-2 font-heading text-2xl font-bold text-[var(--color-foreground)]">
                  También puedes instalarla como app web (PWA)
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  Si usas iPhone/iPad o prefieres no instalar un APK en Android, agrega el sitio a
                  tu pantalla de inicio:
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-muted-foreground)]">
                  <li>
                    <strong className="text-[var(--color-foreground)]">En Android (Chrome):</strong>{' '}
                    abre el menú <strong>⋮</strong> y toca <strong>«Instalar app»</strong> o{' '}
                    <strong>«Añadir a pantalla de inicio»</strong>.
                  </li>
                  <li>
                    <strong className="text-[var(--color-foreground)]">En iPhone o iPad (Safari):</strong>{' '}
                    toca <strong>Compartir</strong> y elige{' '}
                    <strong>«Añadir a pantalla de inicio»</strong>.
                  </li>
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {pwaPrompt ? (
                  <Button type="button" variant="default" onClick={() => void handleInstallPwa()}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Instalar como app web ahora
                  </Button>
                ) : pwaInstalled ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    App web instalada en este dispositivo
                  </span>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to="/adopta">Explorar perritos en adopción</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-6">
            <CardContent className="p-6 sm:p-8">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)]">
                Ficha técnica y transparencia
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-[var(--color-foreground)]">
                Detalles del paquete Android
              </h2>

              <dl className="mt-5 divide-y divide-[var(--color-border)] text-sm">
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[var(--color-muted-foreground)]">Identificador</dt>
                  <dd className="font-mono text-xs font-semibold text-[var(--color-foreground)]">
                    {ANDROID_APP_PACKAGE_ID}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[var(--color-muted-foreground)]">Versión actual</dt>
                  <dd className="font-semibold text-[var(--color-foreground)]">
                    v{release.version} ({release.tagName})
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[var(--color-muted-foreground)]">Compatibilidad</dt>
                  <dd className="font-semibold text-[var(--color-foreground)]">
                    {ANDROID_APP_MIN_VERSION} (API 24–35)
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[var(--color-muted-foreground)]">Permisos requeridos</dt>
                  <dd className="font-semibold text-[var(--color-foreground)]">
                    Solo conexión a internet
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[var(--color-muted-foreground)]">Tamaño</dt>
                  <dd className="font-semibold text-[var(--color-foreground)]">
                    {release.sizeLabel ?? 'Ligera (~3 MB)'}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={release.releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] hover:underline"
                >
                  Consultar lanzamientos y checksums en GitHub
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2.5 text-center">
            <HelpCircle className="h-6 w-6 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="font-heading text-3xl font-bold text-[var(--color-foreground)]">
              Dudas frecuentes sobre el APK
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {APP_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-heading text-base font-bold text-[var(--color-foreground)] marker:content-none">
                  <div className="flex items-center justify-between gap-4">
                    <span>{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="text-lg font-bold text-[var(--color-primary)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </div>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
