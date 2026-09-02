import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function AccessibleDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <dialog ref={ref} aria-labelledby={titleId} aria-modal="true" className="accessible-dialog" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); } }} onCancel={(event) => { event.preventDefault(); closeRef.current(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current(); } }}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 sm:px-7">
        <h2 id={titleId} className="font-heading text-lg font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={`Cerrar ${title.toLowerCase()}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] hover:bg-[var(--color-accent)]"><X aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      {children}
    </dialog>, document.body,
  );
}
