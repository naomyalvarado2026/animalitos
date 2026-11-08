import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Package, ShoppingBag } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Button } from '@/components/ui/button';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { getColorOptions, getVariantColorKey, splitVariantLabel, type MerchandiseProduct, type MerchandiseVariantOption } from '@/lib/merchandise';
import { motionDuration, motionEaseOut } from '@/lib/motionTokens';
import { Link } from 'react-router-dom';

type ProductDetailDialogProps = {
  product: MerchandiseProduct | null;
  variant: MerchandiseVariantOption | null;
  onClose: () => void;
  onSelectVariant: (variant: MerchandiseVariantOption) => void;
  onOrder: () => void;
};

export function ProductDetailDialog({ product, variant, onClose, onSelectVariant, onOrder }: ProductDetailDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.slug, variant?.id]);

  if (!product) return null;

  const images = [...new Set([variant?.image, ...product.galleryImages, product.image].filter((image): image is string => Boolean(image)))];
  const activeImage = images[Math.min(activeImageIndex, Math.max(images.length - 1, 0))] ?? '';
  const colorOptions = getColorOptions(product.variants);
  const activeColorKey = variant ? getVariantColorKey(variant) : '';
  const selectedColor = colorOptions.find((option) => option.key === activeColorKey) ?? colorOptions[0];
  const sizeOptions = selectedColor?.variants.filter((item) => splitVariantLabel(item).sizeLabel) ?? [];
  const selectedSize = variant ? splitVariantLabel(variant).sizeLabel : null;
  const currentVariant = variant ?? selectedColor?.variants[0] ?? null;
  const stock = currentVariant?.inventory ?? product.inventory;
  const priceCents = product.priceCents + (currentVariant?.priceDelta ?? 0);

  return (
    <AccessibleDialog open onClose={onClose} title={`Ficha de ${product.name}`}>
      <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto bg-[#fffdf9] text-[#17022b]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-3 p-4 sm:p-7">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#f1e2ff] sm:rounded-[2rem]">
              <AnimatePresence initial={false} mode="wait">
                {activeImage ? (
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionDuration.quick, ease: motionEaseOut }}
                    className="absolute inset-0"
                  >
                    <ResilientImage
                      src={activeImage}
                      alt={`${product.name}, foto ${activeImageIndex + 1}`}
                      width={1200}
                      height={1200}
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </motion.div>
                ) : (
                  <Package aria-hidden="true" className="h-12 w-12 text-[#3c096c]/40" />
                )}
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button type="button" aria-label="Foto anterior" onClick={() => setActiveImageIndex((index) => (index - 1 + images.length) % images.length)} className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#17022b] shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c]">
                    <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <button type="button" aria-label="Foto siguiente" onClick={() => setActiveImageIndex((index) => (index + 1) % images.length)} className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#17022b] shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c]">
                    <ChevronRight aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <span aria-live="polite" className="absolute bottom-3 right-3 rounded-full bg-[#17022b]/85 px-3 py-1 text-xs font-semibold text-white">Foto {activeImageIndex + 1} de {images.length}</span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Fotos del producto">
                {images.map((image, index) => (
                  <button key={image} type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={activeImageIndex === index} onClick={() => setActiveImageIndex(index)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-transparent bg-[#f1e2ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c]">
                    <ResilientImage src={image} alt="" width={128} height={128} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    {activeImageIndex === index && (shouldReduceMotion
                      ? <span className="pointer-events-none absolute inset-0 rounded-[0.6rem] border-2 border-[#3c096c]" />
                      : <motion.span layoutId={`product-gallery-${product.slug}`} className="pointer-events-none absolute inset-0 rounded-[0.6rem] border-2 border-[#3c096c]" transition={{ duration: motionDuration.quick, ease: motionEaseOut }} />)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 p-5 pt-1 sm:p-7 lg:pt-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f1e2ff] px-3 py-1 text-xs font-bold uppercase tracking-[.1em] text-[#3c096c]">{product.category}</span>
                {!product.isLive && <span className="rounded-full bg-[#17022b] px-3 py-1 text-xs font-bold text-white">Propuesta</span>}
              </div>
              <h3 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-[-.045em] sm:text-4xl">{product.name}</h3>
              <p className="mt-3 leading-relaxed text-[#65566f]">{product.description || 'Un artículo solidario de la colección AdoptaME.'}</p>
            </div>

            {colorOptions.length > 0 && (
              <fieldset>
                <legend className="text-sm font-bold">{product.isLive ? 'Color' : 'Color de referencia'}: {selectedColor?.name}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((option) => (
                    <button key={option.key} type="button" aria-label={`Elegir color ${option.name}`} aria-pressed={activeColorKey === option.key} onClick={() => onSelectVariant(option.variants[0])} className={`relative flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c] ${activeColorKey === option.key ? 'border-[#3c096c] bg-[#f1e2ff]' : 'border-[#17022b]/15 bg-white hover:border-[#ff8069]'}`}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/20" style={{ backgroundColor: option.hex }}>
                      <AnimatePresence initial={false}>
                        {activeColorKey === option.key && <motion.span key="selected" initial={{ scale: shouldReduceMotion ? 1 : 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: shouldReduceMotion ? 1 : 0.6, opacity: 0 }} transition={{ duration: motionDuration.quick, ease: motionEaseOut }}><Check aria-hidden="true" className={`h-3 w-3 ${option.hex.toLowerCase() === '#3c096c' ? 'text-white' : 'text-[#17022b]'}`} /></motion.span>}
                      </AnimatePresence>
                      </span>
                      {option.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {sizeOptions.length > 0 && (
              <fieldset>
                <legend className="text-sm font-bold">Talla{selectedSize ? `: ${selectedSize}` : ''}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizeOptions.map((item) => {
                    const size = splitVariantLabel(item).sizeLabel;
                    return (
                      <button key={item.id} type="button" aria-pressed={variant?.id === item.id} onClick={() => onSelectVariant(item)} className={`relative min-h-11 min-w-12 rounded-xl border px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c096c] ${variant?.id === item.id ? 'border-[#3c096c] text-white' : 'border-[#17022b]/15 bg-white hover:border-[#ff8069]'}`}>
                        {variant?.id === item.id && (shouldReduceMotion
                          ? <span className="absolute inset-0 rounded-[0.65rem] bg-[#3c096c]" />
                          : <motion.span layoutId={`product-size-${product.slug}`} className="absolute inset-0 rounded-[0.65rem] bg-[#3c096c]" transition={{ duration: motionDuration.quick, ease: motionEaseOut }} />)}
                        <span className="relative">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <section aria-label="Detalles del producto" className="rounded-2xl bg-white p-4">
              <h4 className="text-sm font-bold">Características</h4>
              {product.details.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-[#4d4944]">
                  {product.details.map((detail) => <li key={detail} className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8069]" />{detail}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#65566f]">Detalles del producto disponibles al coordinar tu pedido.</p>
              )}
            </section>

            <div className="flex items-end justify-between gap-4 border-t border-[#17022b]/10 pt-4">
              <AnimatePresence initial={false} mode="wait">
                <motion.div key={`price-${currentVariant?.id ?? 'base'}-${priceCents}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: motionDuration.quick }}>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#65566f]">{product.isLive ? 'Valor' : 'Precio de referencia'}</p>
                  <p className="mt-1 font-heading text-2xl font-extrabold text-[#3c096c]">${(priceCents / 100).toFixed(2)} USD</p>
                </motion.div>
              </AnimatePresence>
              <AnimatePresence initial={false} mode="wait">
                <motion.p key={`stock-${currentVariant?.id ?? 'base'}-${stock}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: motionDuration.quick }} className={`text-right text-sm font-semibold ${product.isLive && stock < 1 ? 'text-rose-700' : 'text-[#65566f]'}`}>
                  {product.isLive ? (stock > 0 ? `${stock} disponibles` : 'Agotado') : 'Sujeto a validación'}
                </motion.p>
              </AnimatePresence>
            </div>

            {product.isLive ? (
              <Button disabled={stock < 1} onClick={onOrder} className="min-h-12 w-full bg-[#17022b] text-white hover:bg-[#38332f] disabled:cursor-not-allowed disabled:opacity-50">
                <ShoppingBag aria-hidden="true" /> {stock < 1 ? 'Sin existencias' : 'Solicitar este producto'}
              </Button>
            ) : (
              <Button asChild className="min-h-12 w-full bg-[#17022b] text-white hover:bg-[#38332f]">
                <Link to="/contacto"><ShoppingBag aria-hidden="true" /> Consultar por este diseño</Link>
              </Button>
            )}
            <p className="text-xs leading-relaxed text-[#65566f]">El envío y el pago se coordinan contigo antes de confirmar el pedido. Esta solicitud no realiza cobros.</p>
          </div>
        </div>
      </div>
    </AccessibleDialog>
  );
}
