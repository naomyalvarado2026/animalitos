import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion } from 'motion/react';

export function ScrollEnhancements() {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      progress.set(ratio);
      setShowTop(scrollTop > 520);
    };
    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    const resizeObserver = new ResizeObserver(onScroll);
    resizeObserver.observe(document.body);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      resizeObserver.disconnect();
    };
  }, [progress]);

  const scrollToTop = () => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 right-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#ff8069] via-[#e0beff] to-[#3c096c]"
        style={{ scaleX: progress }}
      />
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Volver arriba"
          title="Volver arriba"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/95 text-[var(--color-foreground)] shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] motion-reduce:hover:translate-y-0 lg:bottom-6 lg:right-6"
        >
          <ArrowUp aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
