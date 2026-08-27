import { PawIcon } from '@/components/layout/PawBackground';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Cargando contenido...' }: LoadingScreenProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="relative flex items-center justify-center mb-4">
        {/* Glow pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/20 animate-ping" />
        <div className="relative z-10 w-16 h-16 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-md flex items-center justify-center">
          <div className="animate-bounce">
            <PawIcon size={28} color="var(--color-primary)" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-[var(--color-muted-foreground)] tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
