import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center text-[var(--color-foreground)]">
      <SearchX aria-hidden="true" className="mx-auto h-8 w-8 text-[var(--color-primary)]" />
      <p className="mt-4 font-heading text-xl font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">{description}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
