import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import type { FaqItem } from '@/lib/faq';

function FaqAnswer({ item, initiallyOpen }: { item: FaqItem; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const id = useId();
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]">
      <h3><button id={`${id}-question`} type="button" aria-expanded={open} aria-controls={`${id}-answer`} onClick={() => setOpen(!open)} className="flex min-h-16 w-full items-center justify-between gap-5 p-5 text-left font-heading font-bold leading-relaxed hover:text-[var(--color-primary)]"><span>{item.question}</span><Plus aria-hidden="true" className={`h-5 w-5 shrink-0 text-[var(--color-primary)] transition-transform motion-reduce:transition-none ${open ? 'rotate-45' : ''}`} /></button></h3>
      <div id={`${id}-answer`} hidden={!open} aria-labelledby={`${id}-question`} className="border-t border-[var(--color-border)] px-5 py-5 text-sm leading-relaxed text-[var(--color-muted-foreground)]"><p className="whitespace-pre-line">{item.answer}</p></div>
    </div>
  );
}

export function FaqAccordion({ items, openFirst = false }: { items: FaqItem[]; openFirst?: boolean }) {
  return <div className="space-y-3">{items.map((item, index) => <FaqAnswer key={`${item.category}-${item.question}`} item={item} initiallyOpen={openFirst && index === 0} />)}</div>;
}
