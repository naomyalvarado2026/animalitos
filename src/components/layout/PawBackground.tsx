/** Decorative paw print SVG icon */
export function PawIcon({
  className = '',
  size = 24,
  color = 'currentColor',
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={color}
      className={className}
      aria-hidden="true"
    >
      {/* Main pad */}
      <ellipse cx="50" cy="65" rx="22" ry="18" />
      {/* Toe pads */}
      <ellipse cx="30" cy="44" rx="9" ry="11" />
      <ellipse cx="46" cy="36" rx="9" ry="11" />
      <ellipse cx="62" cy="36" rx="9" ry="11" />
      <ellipse cx="74" cy="44" rx="9" ry="11" />
    </svg>
  );
}

/** Subtle paw print background pattern for section backgrounds */
export function PawBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 paw-pattern pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
