import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-[var(--color-primary)] transition-transform duration-300 hover:-rotate-12" />
      )}
    </Button>
  );
}
