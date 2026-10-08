export function RecordMode({ demo, onChange }: { demo: boolean; onChange: (demo: boolean) => void }) {
  return <div className="space-y-3"><div className="flex flex-wrap gap-2" aria-label="Tipo de registros">
    {[false, true].map(value => <button key={String(value)} type="button" aria-pressed={demo === value} onClick={() => onChange(value)} className={`rounded-full border px-4 py-2 text-sm ${demo === value ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : ''}`}>{value ? 'Ejemplos de práctica' : 'Registros reales'}</button>)}
  </div><p className="rounded-xl border border-[var(--color-border)] p-3 text-sm">{demo ? 'DEMONSTRACIÓN · Importes y clientes ficticios para practicar. No representan ventas, pagos ni movimientos reales; no se incluyen en el dashboard, reportes o transparencia.' : 'Solo movimientos reales. Los ejemplos están disponibles en una vista separada.'}</p></div>;
}
