import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
