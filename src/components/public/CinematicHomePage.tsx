import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Heart, PawPrint, ShieldCheck, Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { assetUrl } from '@/lib/assets';
import { mergeRefugeDogs } from '@/lib/refugeDogs';
import { REFUGE_DOG_PROFILES } from '@/data/refugeDogProfiles';
import { Button } from '@/components/ui/button';
import { PackMosaic } from './PackMosaic';
import type { Animal } from '@/types';
import './CinematicHomePage.css';

const DESKTOP_VIDEO_BYTES = 6967872;
const MOBILE_VIDEO_BYTES = 6126002;
const SCROLL_DISTANCE_PX = 1500;
const RING_CIRCUMFERENCE = 126;

// Portrait / mobile vertical video selector — must match CinematicHomePage.css @media
const PORTRAIT_GATES = ['(orientation: portrait)', '(max-width: 720px)'] as const;

// Static-hero gates — must match CinematicHomePage.css @media character-for-character
const STATIC_GATES = [
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
] as const;

interface BandConfig {
  a: number;
  b: number;
  skipIn?: boolean;
  skipOut?: boolean;
  ramp?: number;
}

const BANDS: BandConfig[] = [
  // Band 1: Opening (0.00 - 0.26) — fades out cleanly BEFORE logo starts fading
  { a: 0.0, b: 0.26, skipIn: true, ramp: 0.04 },
  // Band 2: Journey (0.42 - 0.70) — enters AFTER AdoptaME logo has faded away (~2.2s+)
  { a: 0.42, b: 0.7, ramp: 0.055 },
  // Band 3: Arrival / Settle (0.74 - 1.00) — blooms centered over the serene clean ending frame
  { a: 0.74, b: 1.0, skipOut: true, ramp: 0.065 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const smoothstep = (p: number, e0: number, e1: number) => {
  if (e1 <= e0) return p >= e1 ? 1 : 0;
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

interface SplitWordsProps {
  text: string;
  accentWord?: string;
  variant: 'rise' | 'glide';
  spread?: number;
}

function SplitWords({ text, accentWord, variant, spread = 0.36 }: SplitWordsProps) {
  const words = text.split(' ');
  const total = Math.max(1, words.length - 1);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => {
          const th = Number(((index / total) * spread).toFixed(3));
          const isAccent = accentWord && word.toLowerCase().includes(accentWord.toLowerCase());

          if (variant === 'rise') {
            return (
              <span key={`${word}-${index}`} className="cin-word-mask">
                <span
                  className={`cin-word-rise ${isAccent ? 'cin-accent' : ''}`}
                  style={{ '--th': th } as React.CSSProperties}
                >
                  {word}
                </span>
              </span>
            );
          }

          return (
            <span
              key={`${word}-${index}`}
              className={`cin-word-glide ${isAccent ? 'cin-accent' : ''}`}
              style={{ '--th': th } as React.CSSProperties}
            >
              {word}
            </span>
          );
        })}
      </span>
    </>
  );
}

const HOLD_MILESTONES = [
  {
    step: '01',
    title: 'Rescate',
    text: 'Llegamos a tiempo donde hay abandono.',
    icon: PawPrint,
  },
  {
    step: '02',
    title: 'Recuperación',
    text: 'Salud veterinaria, alimento y calma.',
    icon: Stethoscope,
  },
  {
    step: '03',
    title: 'Familia real',
    text: 'Seguimiento cercano hasta que se siente en casa.',
    icon: Heart,
  },
];

const PREVIEW_DOGS = REFUGE_DOG_PROFILES.slice(0, 4);

export function CinematicHomePage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ringFillRef = useRef<SVGCircleElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const railDotRefs = useRef<Array<HTMLSpanElement | null>>([null, null, null]);
  const bandRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);

  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && PORTRAIT_GATES.some((q) => window.matchMedia(q).matches)
  );

  // Interactive press-and-hold state
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdHolding, setHoldHolding] = useState(false);
  const [holdCompleted, setHoldCompleted] = useState(false);
  const holdRafRef = useRef<number | null>(null);
  const holdValRef = useRef(0);
  const holdActiveRef = useRef(false);

  // Live metrics from Supabase for the interactive section
  const dogsQuery = useQuery({
    queryKey: ['public-home-dogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('species', 'dog')
        .in('status', ['available', 'medical_care'])
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Animal[];
    },
    staleTime: 60_000,
  });

  const impactQuery = useQuery({
    queryKey: ['public-impact-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_impact_metrics')
        .select('adopted_dogs, dogs_in_care, published_stories, active_volunteers')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const allDogs = mergeRefugeDogs(dogsQuery.data ?? []);
  const dogsInCareCount = Math.max(impactQuery.data?.dogs_in_care ?? 0, allDogs.length, 12);
  const adoptedCount = impactQuery.data?.adopted_dogs ?? 0;

  const videoUrl = assetUrl(
    isPortrait ? '/video/adoptame-hero-mobile.mp4' : '/video/adoptame-hero-desktop.mp4'
  );
  const videoBytes = isPortrait ? MOBILE_VIDEO_BYTES : DESKTOP_VIDEO_BYTES;
  const posterUrl = assetUrl(
    isPortrait ? '/video/adoptame-hero-mobile-poster.png' : '/video/adoptame-hero-poster.png'
  );
  const endingUrl = assetUrl(
    isPortrait ? '/video/adoptame-hero-mobile-ending.png' : '/video/adoptame-hero-ending.jpg'
  );

  // Live portrait/desktop variant detection (switches cleanly on resize or rotation)
  useEffect(() => {
    const portraitMqls = PORTRAIT_GATES.map((q) => window.matchMedia(q));
    const syncPortrait = () => {
      setIsPortrait(portraitMqls.some((m) => m.matches));
    };
    syncPortrait();
    portraitMqls.forEach((m) => m.addEventListener('change', syncPortrait));
    return () => {
      portraitMqls.forEach((m) => m.removeEventListener('change', syncPortrait));
    };
  }, []);

  // Pause ambient CSS animations when browser tab is hidden
  useEffect(() => {
    const onVisibility = () => {
      document.body.classList.toggle('cin-paused', document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('cin-paused');
    };
  }, []);

  // Main 10K-Websites Scrub Engine
  useEffect(() => {
    const heroEl = heroRef.current;
    const stageEl = stageRef.current;
    const posterEl = posterRef.current;
    const videoEl = videoRef.current;
    if (!heroEl || !stageEl || !posterEl || !videoEl) return;

    let scrubOn = false;
    let heroInitialized = false;
    let heroOnScreen = true;
    let blobObjectUrl: string | null = null;
    let abortCtrl: AbortController | null = null;

    // Reset stage visual classes when switching desktop <-> mobile video
    stageEl.classList.remove('video-ready', 'video-failed');
    setVideoReady(false);
    setVideoFailed(false);

    // Lerp & seek-gate state
    let target = 0;
    let shown = 0;
    let rafId: number | null = null;
    let lastTick = 0;
    let seekBusy = false;
    let pendingTime: number | null = null;

    // Band 1 opening load ramp (opens settled on load, hands over to scroll)
    let loadK = 0;
    let loadRafId: number | null = null;

    // Delta-gate caches per band & chapter rail
    const bandCache = BANDS.map(() => ({ op: -1, k: -1, active: false }));
    let lastProgressWrite = -1;
    let lastChapterIdx = -1;

    const heroProgress = () => {
      const rect = heroEl.getBoundingClientRect();
      const availableScroll = Math.max(1, heroEl.offsetHeight - window.innerHeight);
      const scrollRange = Math.min(SCROLL_DISTANCE_PX, availableScroll);
      return clamp(-rect.top / scrollRange, 0, 1);
    };

    const requestSeek = (t: number) => {
      if (!videoEl.duration || !Number.isFinite(videoEl.duration)) return;
      const safeTime = clamp(t, 0, Math.max(0, videoEl.duration - 0.04));
      if (seekBusy) {
        pendingTime = safeTime;
        return;
      }
      seekBusy = true;
      videoEl.currentTime = safeTime;
    };

    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const next = pendingTime;
        pendingTime = null;
        requestSeek(next);
      }
    };

    const onVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      stageEl.classList.add('video-failed');
      setVideoFailed(true);
    };

    videoEl.addEventListener('seeked', onSeeked);
    videoEl.addEventListener('error', onVideoError);

    const updateCaptions = (p: number) => {
      if (progressBarRef.current && Math.abs(p - lastProgressWrite) >= 0.004) {
        lastProgressWrite = p;
        progressBarRef.current.style.setProperty('--p', p.toFixed(4));
      }

      if (hudRef.current) {
        const hideHud = p > 0.05;
        hudRef.current.classList.toggle('is-hidden', hideHud);
      }

      const chapterIdx = p < 0.34 ? 0 : p < 0.72 ? 1 : 2;
      if (chapterIdx !== lastChapterIdx) {
        lastChapterIdx = chapterIdx;
        railDotRefs.current.forEach((dot, idx) => {
          dot?.classList.toggle('is-current', idx === chapterIdx);
        });
      }

      BANDS.forEach((band, idx) => {
        const el = bandRefs.current[idx];
        if (!el) return;

        const f = Math.min(0.032, (band.b - band.a) / 3);
        const fadeIn = band.skipIn ? 1 : smoothstep(p, band.a, band.a + f);
        const fadeOut = band.skipOut ? 1 : 1 - smoothstep(p, band.b - f, band.b);
        const opacity = clamp(fadeIn * fadeOut, 0, 1);

        const ramp = band.ramp ?? Math.min(0.03, (band.b - band.a) * 0.35);
        const scrollK = clamp((p - band.a) / ramp, 0, 1);
        const k = idx === 0 ? Math.max(scrollK, loadK) : scrollK;

        const cache = bandCache[idx];
        if (Math.abs(opacity - cache.op) >= 0.008) {
          cache.op = opacity;
          el.style.opacity = opacity.toFixed(3);
        }
        if (Math.abs(k - cache.k) >= 0.008) {
          cache.k = k;
          el.style.setProperty('--k', k.toFixed(3));
        }

        const isActive = opacity > 0.15;
        if (isActive !== cache.active) {
          cache.active = isActive;
          el.classList.toggle('is-active', isActive);
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }

      requestSeek(shown * (videoEl.duration || 0));
      updateCaptions(shown);
    };

    const onScroll = () => {
      target = heroProgress();
      if (rafId === null && heroOnScreen) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const runOpeningLoadRamp = () => {
      const start = performance.now();
      const duration = 680;
      const step = (now: number) => {
        const t = clamp((now - start) / duration, 0, 1);
        loadK = 1 - Math.pow(1 - t, 3);
        updateCaptions(shown);
        if (t < 1 && scrubOn) {
          loadRafId = requestAnimationFrame(step);
        } else {
          loadK = 1;
          loadRafId = null;
          updateCaptions(shown);
        }
      };
      loadRafId = requestAnimationFrame(step);
    };

    const loadHeroBlob = async () => {
      abortCtrl = new AbortController();
      let watchdog = window.setTimeout(() => abortCtrl?.abort(), 20000);

      try {
        const res = await fetch(videoUrl, { signal: abortCtrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const total = Number(res.headers.get('Content-Length')) || videoBytes;
        const reader = res.body?.getReader();

        let blob: Blob;
        if (reader) {
          const chunks: BlobPart[] = [];
          let got = 0;
          let lastRing = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            window.clearTimeout(watchdog);
            watchdog = window.setTimeout(() => abortCtrl?.abort(), 20000);
            if (value) {
              chunks.push(value);
              got += value.length;
              const frac = Math.min(1, got / total);
              const now = performance.now();
              if (ringFillRef.current && (now - lastRing > 100 || frac === 1)) {
                lastRing = now;
                ringFillRef.current.style.strokeDashoffset = String(
                  Math.round(RING_CIRCUMFERENCE * (1 - frac))
                );
              }
            }
          }
          blob = new Blob(chunks, { type: 'video/mp4' });
        } else {
          blob = await res.blob();
        }

        window.clearTimeout(watchdog);
        if (ringFillRef.current) ringFillRef.current.style.strokeDashoffset = '0';

        blobObjectUrl = URL.createObjectURL(blob);
        videoEl.src = blobObjectUrl;
        videoEl.load();

        videoEl.addEventListener(
          'canplay',
          () => {
            const p = heroProgress();
            target = p;
            shown = p;
            requestSeek(p * (videoEl.duration || 0));
            stageEl.classList.add('video-ready');
            setVideoReady(true);
          },
          { once: true }
        );
      } catch {
        window.clearTimeout(watchdog);
        stageEl.classList.add('video-failed');
        setVideoFailed(true);
      }
    };

    const initHeroOnce = () => {
      if (heroInitialized) return;
      heroInitialized = true;

      // Poster wins the bandwidth race first
      posterEl.style.backgroundImage = `url('${posterUrl}')`;
      let fetchStarted = false;
      const startFetch = () => {
        if (fetchStarted) return;
        fetchStarted = true;
        void loadHeroBlob();
      };

      const posterImg = new Image();
      posterImg.onload = startFetch;
      posterImg.onerror = startFetch;
      posterImg.src = posterUrl;
      window.setTimeout(startFetch, 3500);
    };

    const pinToFinalStates = () => {
      setHoldProgress(1);
      setHoldCompleted(true);
      holdValRef.current = 1;
    };

    const enableScrub = () => {
      if (scrubOn) return;
      scrubOn = true;
      initHeroOnce();
      window.addEventListener('scroll', onScroll, { passive: true });
      bandCache.forEach((c) => {
        c.op = -1;
        c.k = -1;
      });
      const p = heroProgress();
      target = p;
      shown = p;
      runOpeningLoadRamp();
      updateCaptions(p);
      onScroll();
    };

    const disableScrub = () => {
      if (!scrubOn) return;
      scrubOn = false;
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (loadRafId !== null) {
        cancelAnimationFrame(loadRafId);
        loadRafId = null;
      }
    };

    const mqls = STATIC_GATES.map((q) => window.matchMedia(q));
    const reducedMql = mqls[mqls.length - 1];

    const applyHeroMode = () => {
      if (mqls.some((m) => m.matches)) {
        disableScrub();
        if (reducedMql.matches) pinToFinalStates();
      } else {
        enableScrub();
      }
    };

    const onReducedChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        pinToFinalStates();
      } else {
        setHoldProgress(0);
        setHoldCompleted(false);
        holdValRef.current = 0;
        applyHeroMode();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        heroOnScreen = entries[0]?.isIntersecting ?? true;
        if (!heroOnScreen && rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
          lastTick = 0;
        }
      },
      { threshold: 0 }
    );
    io.observe(heroEl);

    mqls.forEach((m) => m.addEventListener('change', applyHeroMode));
    reducedMql.addEventListener('change', onReducedChange);
    applyHeroMode();

    return () => {
      disableScrub();
      io.disconnect();
      abortCtrl?.abort();
      mqls.forEach((m) => m.removeEventListener('change', applyHeroMode));
      reducedMql.removeEventListener('change', onReducedChange);
      videoEl.removeEventListener('seeked', onSeeked);
      videoEl.removeEventListener('error', onVideoError);
      if (blobObjectUrl) URL.revokeObjectURL(blobObjectUrl);
    };
  }, [posterUrl, videoUrl, videoBytes]);

  // Press-and-hold animation loop (builds while held, eases back down if released early)
  const driveHold = () => {
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(60, now - last);
      last = now;

      if (holdActiveRef.current) {
        holdValRef.current = clamp(holdValRef.current + dt / 1150, 0, 1);
        setHoldProgress(holdValRef.current);
        if (holdValRef.current >= 1) {
          setHoldCompleted(true);
          setHoldHolding(false);
          holdActiveRef.current = false;
          holdRafRef.current = null;
          return;
        }
        holdRafRef.current = requestAnimationFrame(step);
      } else {
        holdValRef.current = Math.max(0, holdValRef.current - dt / 520);
        setHoldProgress(holdValRef.current);
        if (holdValRef.current <= 0.001) {
          holdValRef.current = 0;
          setHoldProgress(0);
          holdRafRef.current = null;
          return;
        }
        holdRafRef.current = requestAnimationFrame(step);
      }
    };

    if (holdRafRef.current !== null) cancelAnimationFrame(holdRafRef.current);
    holdRafRef.current = requestAnimationFrame(step);
  };

  const startHold = () => {
    if (holdCompleted) return;
    holdActiveRef.current = true;
    setHoldHolding(true);
    driveHold();
  };

  const stopHold = () => {
    if (holdCompleted) return;
    holdActiveRef.current = false;
    setHoldHolding(false);
    driveHold();
  };

  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) cancelAnimationFrame(holdRafRef.current);
    };
  }, []);

  const holdStrokeOffset = Math.round(440 * (1 - holdProgress));

  return (
    <div className="cin-root">
      <div className="cin-env-glow" aria-hidden="true" />

      {/* ── RESPONSIVE PINNED SCRUB HERO (16:9 Desktop + 9:16 Mobile) ── */}
      <section ref={heroRef} className="cin-scrub-hero" aria-label="Historia visual de AdoptaME">
        <div ref={stageRef} className="cin-stage">
          <div ref={posterRef} className="cin-poster-layer" aria-hidden="true" />

          <video
            ref={videoRef}
            className="cin-video"
            preload="none"
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          />

          <div className="cin-global-scrim" aria-hidden="true" />
          <div className="cin-top-scrim" aria-hidden="true" />
          <div className="cin-bottom-fade" aria-hidden="true" />

          {/* Right-edge chapter rail + hairline progress */}
          <div className="cin-rail" aria-hidden="true">
            <div className="cin-rail-dots">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    railDotRefs.current[i] = el;
                  }}
                  className={`cin-rail-dot ${i === 0 ? 'is-current' : ''}`}
                />
              ))}
            </div>
            <div ref={progressBarRef} className="cin-progress-bar">
              <div className="cin-progress-fill" />
            </div>
          </div>

          {/* Minimalist scroll hairline / loading ring */}
          <div ref={hudRef} className="cin-hud" aria-hidden="true">
            {!videoReady && !videoFailed ? (
              <svg className="cin-ring" viewBox="0 0 48 48">
                <circle className="cin-ring-track" cx="24" cy="24" r="20" fill="none" strokeWidth="3" />
                <circle
                  ref={ringFillRef}
                  className="cin-ring-fill"
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE}
                />
              </svg>
            ) : (
              <span className="cin-scroll-line" />
            )}
            <span className="cin-hud-label">
              {!videoReady && !videoFailed ? 'Cargando escena' : 'Desliza'}
            </span>
          </div>

          {/* Caption Bands — timed & positioned strictly in each frame's clean negative space */}
          <div className="cin-bands">
            {/* BAND 1 (0.00 - 0.26): Desktop top-left above logo; Mobile between logo & puppy */}
            <div
              ref={(el) => {
                bandRefs.current[0] = el;
              }}
              className="cin-band cin-band--opening"
            >
              <div className="cin-band-inner">
                <span className="cin-chip mb-4">
                  <PawPrint className="h-3.5 w-3.5 text-[#ff8069]" aria-hidden="true" />
                  Rescate y adopción real
                </span>
                <h1 className="cin-headline cin-headline--opening">
                  <SplitWords text="Cada huella busca un hogar." accentWord="hogar" variant="rise" spread={0.28} />
                </h1>
              </div>
            </div>

            {/* BAND 2 (0.42 - 0.70): Enters AFTER logo disappears; bold editorial pause */}
            <div
              ref={(el) => {
                bandRefs.current[1] = el;
              }}
              className="cin-band cin-band--journey"
            >
              <div className="cin-band-inner">
                <span className="cin-chip mb-4">Del abandono a la confianza</span>
                <h2 className="cin-headline cin-headline--journey">
                  <SplitWords
                    text="No esperan lástima. Esperan familia."
                    accentWord="familia"
                    variant="glide"
                    spread={0.34}
                  />
                </h2>
                <span className="cin-accent-rule" aria-hidden="true" />
                <p className="cin-sub cin-stage-sub">
                  Cuidado veterinario, paciencia y el hogar correcto.
                </p>
              </div>
            </div>

            {/* BAND 3 (0.74 - 1.00): Vertically balanced over serene clean ending frame */}
            <div
              ref={(el) => {
                bandRefs.current[2] = el;
              }}
              className="cin-band cin-band--settle"
            >
              <div className="cin-band-inner">
                <span className="cin-chip mb-4">Tu turno</span>
                <h2 className="cin-headline cin-headline--settle">
                  <SplitWords
                    text="Tu mejor amigo ya está aquí."
                    accentWord="aquí"
                    variant="rise"
                    spread={0.32}
                  />
                </h2>
                <p className="cin-sub cin-stage-sub">
                  {dogsInCareCount} perritos reales esperan conocerte hoy.
                </p>
                <div className="cin-stage-cta">
                  <Button size="xl" className="cin-btn cin-btn-primary" asChild>
                    <Link to="/adopta">
                      Conocer a la manada <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="ghost" className="cin-btn cin-btn-secondary" asChild>
                    <Link to="/donaciones">Apoyar un rescate</Link>
                  </Button>
                </div>

                {/* Real-dog avatar proof strip tying abstract ending directly to real dogs */}
                <Link to="/adopta" className="cin-proof-pill">
                  <span className="cin-avatars" aria-hidden="true">
                    {PREVIEW_DOGS.map((dog) => (
                      <img
                        key={dog.adoption_slug}
                        src={assetUrl(dog.main_image_url)}
                        alt=""
                        loading="lazy"
                        className="cin-avatar"
                      />
                    ))}
                  </span>
                  <span className="cin-proof-text">
                    <strong>{dogsInCareCount} perritos reales</strong> · Adopción responsable
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATIC HERO (Reduced Motion & Short Landscape Phones) ── */}
      <section
        className="cin-static-hero"
        style={{ backgroundImage: `url('${endingUrl}')` }}
        aria-label="Bienvenida a AdoptaME"
      >
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <img
            src={assetUrl('/brand/logo-negative.webp')}
            alt="AdoptaME"
            className="mx-auto mb-6 h-11 w-auto"
          />
          <span className="cin-chip mb-4">
            <PawPrint className="h-3.5 w-3.5 text-[#ff8069]" aria-hidden="true" />
            Rescate y adopción real
          </span>
          <h1 className="cin-headline cin-headline--settle mx-auto">
            Tu mejor amigo <span className="cin-accent">ya está aquí.</span>
          </h1>
          <p className="cin-sub mx-auto">
            {dogsInCareCount} perritos rescatados esperan una familia responsable.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="xl" className="cin-btn cin-btn-primary" asChild>
              <Link to="/adopta">
                Conocer a la manada <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" className="cin-btn cin-btn-secondary" asChild>
              <Link to="/donaciones">Apoyar un rescate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: LA MANADA REAL (Seamless continuation in #17022b) ── */}
      <div className="relative z-10">
        <PackMosaic />
      </div>

      {/* ── SECTION 2: ONE DESIGNED INTERACTIVE MOMENT (Press & Hold over reused ending frame) ── */}
      <section
        className="cin-hold-section relative z-10 border-y border-white/10 py-20 lg:py-28"
        style={{ backgroundImage: `url('${endingUrl}')` }}
        aria-label="Cómo acompañamos cada rescate"
      >
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="cin-chip mb-4">Así funciona una oportunidad</span>
              <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                Cada adopción empieza con un gesto.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
                {holdCompleted
                  ? 'Así acompañamos a cada perrito desde el rescate hasta su hogar definitivo.'
                  : 'Mantén presionado el botón un segundo para recorrer el camino.'}
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onPointerDown={startHold}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  onPointerCancel={stopHold}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setHoldProgress(1);
                      setHoldCompleted(true);
                      holdValRef.current = 1;
                    }
                  }}
                  aria-pressed={holdCompleted}
                  className={`cin-hold-ring-btn ${holdHolding ? 'is-holding' : ''} ${holdCompleted ? 'is-complete' : ''}`}
                >
                  <svg className="cin-hold-svg" viewBox="0 0 164 164" aria-hidden="true">
                    <circle
                      cx="82"
                      cy="82"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="82"
                      cy="82"
                      r="70"
                      fill="none"
                      stroke="#ff8069"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="440"
                      strokeDashoffset={holdStrokeOffset}
                    />
                  </svg>
                  {holdCompleted ? (
                    <>
                      <Check className="h-7 w-7 text-[#ff8069]" aria-hidden="true" />
                      <span className="mt-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white">
                        Camino listo
                      </span>
                    </>
                  ) : (
                    <>
                      <PawPrint className="h-7 w-7 text-[#ff8069]" aria-hidden="true" />
                      <span className="mt-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white">
                        Mantén aquí
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {HOLD_MILESTONES.map(({ step, title, text, icon: Icon }, idx) => {
                const threshold = (idx + 1) * 0.3;
                const isLit = holdCompleted || holdProgress >= threshold;
                return (
                  <article
                    key={step}
                    className={`cin-milestone rounded-3xl border border-white/12 bg-[#17022b]/75 p-6 backdrop-blur-md ${isLit ? 'is-lit' : ''}`}
                    style={{ transitionDelay: holdCompleted ? `${idx * 90}ms` : '0ms' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold tracking-[0.18em] text-[#e0beff]">
                        {step}
                      </span>
                      <Icon className="h-5 w-5 text-[#ff8069]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 font-heading text-xl font-extrabold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {adoptedCount > 0 && (
            <p className="mt-10 text-center text-sm font-semibold text-[#e0beff] lg:text-left">
              {adoptedCount} historias felices confirmadas y {dogsInCareCount} perritos hoy bajo nuestro cuidado.
            </p>
          )}
        </div>
      </section>

      {/* ── SECTION 3: MINIMAL CLOSING FUNNEL ── */}
      <section className="relative z-10 bg-[#17022b] py-20 text-center lg:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <ShieldCheck className="mx-auto h-9 w-9 text-[#ff8069]" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
            Adopta con calma. Acompañamos todo el proceso.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/72">
            Conoce a cada perrito, resuelve tus dudas y da el paso cuando estés listo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="xl" className="cin-btn cin-btn-primary" asChild>
              <Link to="/adopta">
                Quiero adoptar <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="ghost" className="cin-btn cin-btn-secondary" asChild>
              <Link to="/como-funciona">Ver el proceso</Link>
            </Button>
          </div>
          <div className="mt-10">
            <Link
              to="/inicio-clasico"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 underline-offset-4 transition hover:text-[#e0beff] hover:underline"
            >
              Ver versión de inicio clásica
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
