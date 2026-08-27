import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: string; // e.g. "1,240+" or "890+" or "120" or "$45,200"
  duration?: number; // duration in ms
  className?: string;
}

export function AnimatedCounter({ value, duration = 1500, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Extract number and formatting (prefix, suffix, commas)
  const numericMatch = value.match(/[\d,]+/);
  const numericString = numericMatch ? numericMatch[0].replace(/,/g, '') : '0';
  const targetNumber = parseInt(numericString, 10);
  const prefix = value.substring(0, value.indexOf(numericMatch ? numericMatch[0] : ''));
  const suffix = value.substring((value.indexOf(numericMatch ? numericMatch[0] : '') || 0) + (numericMatch ? numericMatch[0].length : 0));
  const hasCommas = value.includes(',');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTimestamp: number | null = null;

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easedProgress * targetNumber);

            const formattedCurrent = hasCommas ? current.toLocaleString() : current.toString();
            setDisplayValue(`${prefix}${formattedCurrent}${suffix}`);

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setDisplayValue(value);
            }
          };

          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [value, duration, targetNumber, prefix, suffix, hasCommas, hasAnimated]);

  return (
    <span ref={countRef} className={className}>
      {hasAnimated ? displayValue : `${prefix}0${suffix}`}
    </span>
  );
}
