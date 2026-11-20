import { Link } from 'react-router-dom';
import { ArrowRight, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import { dogProductUrl } from '@/lib/merchandiseDogs';

export function DogProductsSection({ dogSlug, dogName }: { dogSlug: string; dogName: string }) {
  const query = useStoreProducts();
  const products = (query.data ?? []).filter((product) => product.dogSlugs.includes(dogSlug));

  if (query.isPending) return <p role="status" className="mx-auto max-w-7xl px-5 py-8 text-sm text-[var(--color-muted-foreground)]">Buscando diseños de {dogName}…</p>;
  if (query.isError) return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10" aria-label={`Productos de ${dogName}`}>
      <p className="text-sm text-[var(--color-muted-foreground)]">No pudimos cargar su colección.</p>
      <Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>Volver a intentar</Button>
    </section>
  );
  if (!products.length) return null;

  return (
    <section aria-labelledby="dog-products-title" className="border-y border-[var(--color-border)] bg-[#f1e2ff]/45 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.17em] text-[#3c096c]"><PawPrint aria-hidden="true" className="h-4 w-4" /> Su huella también se lleva</p>
            <h2 id="dog-products-title" className="mt-4 font-heading text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">La colección de {dogName}.</h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-foreground)]">Cada artículo vinculado a {dogName} abre su diseño preseleccionado. En la camiseta puedes indicar la talla y el color que prefieres; el equipo confirmará las opciones disponibles.</p>
          </div>
          <Button asChild variant="outline" className="shrink-0 border-[#3c096c]/25 text-[#3c096c]"><Link to={dogProductUrl(dogSlug)}>Ver su colección <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.slug} className="overflow-hidden rounded-[1.75rem] border border-[#17022b]/10 bg-white text-[#17022b] shadow-sm">
              <Link to={dogProductUrl(dogSlug, product.slug)} aria-label={`Ver ${product.name}`} className="relative block aspect-square overflow-hidden bg-[#f1e2ff] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#3c096c]">
                <ResilientImage src={product.image} alt={`Diseño de ${product.name}`} width={960} height={960} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                {!product.isLive && <span className="absolute left-4 top-4 rounded-full bg-[#17022b] px-3 py-1 text-xs font-bold text-white">Propuesta</span>}
              </Link>
              <div className="p-6">
                <h3 className="font-heading text-2xl font-extrabold tracking-[-.04em]">{product.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#65566f]">{product.description}</p>
                <p className="mt-5 text-xs font-bold text-[#65566f]">{product.isLive ? 'Valor' : 'Precio de referencia'}</p>
                <p className="mt-1 font-heading text-lg font-extrabold text-[#3c096c]">{product.price}</p>
                <Button asChild className="mt-5 w-full bg-[#17022b] text-white hover:bg-[#38332f]"><Link to={dogProductUrl(dogSlug, product.slug)}>{product.slug.startsWith('camiseta-') ? 'Elegir talla y color' : 'Ver opciones'} <ArrowRight aria-hidden="true" /></Link></Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
