import { useId, type ReactNode } from 'react';
import { Check, PawPrint } from 'lucide-react';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { merchandiseDogName } from '@/lib/merchandiseDogs';
import type { MerchandiseColorOption, MerchandiseProduct } from '@/lib/merchandise';

type ProductConfiguratorProps = {
  designs?: readonly MerchandiseProduct[];
  selectedDesignSlug?: string | null;
  onSelectDesign?: (design: MerchandiseProduct) => void;
  colorOptions: readonly MerchandiseColorOption[];
  selectedColorKey?: string;
  onSelectColor: (option: MerchandiseColorOption) => void;
  sizeOptions: readonly string[];
  selectedSize?: string | null;
  onSelectSize: (size: string) => void;
  colorCaption?: string;
  sizeCaption?: string;
};

function StepHeading({ number, children }: { number: number; children: ReactNode }) {
  return (
    <legend className="flex items-center gap-2 text-sm font-bold text-[#17022b]">
      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#3c096c] text-xs font-extrabold text-white">{number}</span>
      {children}
    </legend>
  );
}

function DesignPicker({
  designs,
  selectedDesignSlug,
  onSelectDesign,
  name,
  step,
}: {
  designs: readonly MerchandiseProduct[];
  selectedDesignSlug: string | null;
  onSelectDesign: (design: MerchandiseProduct) => void;
  name: string;
  step: number;
}) {
  const selectedDesign = designs.find((design) => design.slug === selectedDesignSlug);
  const selectedDogName = selectedDesign?.dogSlugs[0] ? merchandiseDogName(selectedDesign.dogSlugs[0]) : null;
  return (
    <fieldset className="space-y-3">
      <StepHeading number={step}>Elige el perrito{selectedDogName ? ` · ${selectedDogName}` : ''}</StepHeading>
      <p className="text-xs leading-relaxed text-[#65566f]">Cada opción muestra la ilustración asociada a su ficha.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {designs.map((design) => {
          const dogSlug = design.dogSlugs[0];
          const dogName = dogSlug ? merchandiseDogName(dogSlug) : design.name;
          const selected = selectedDesignSlug === design.slug;
          return (
            <label key={design.slug} className="group relative block min-w-0 cursor-pointer rounded-2xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#3c096c]">
              <input
                className="peer sr-only"
                type="radio"
                name={name}
                value={design.slug}
                aria-label={`Diseño de ${dogName}`}
                checked={selected}
                onChange={() => onSelectDesign(design)}
              />
              <span className={`relative block overflow-hidden rounded-2xl border-2 bg-white transition-colors peer-checked:border-[#3c096c] ${selected ? 'border-[#3c096c]' : 'border-[#17022b]/10 group-hover:border-[#e0beff]'}`}>
                <span className="relative block aspect-square overflow-hidden bg-[#f1e2ff]">
                  <ResilientImage
                    src={design.image}
                    alt={`Camiseta propuesta con el diseño de ${dogName}`}
                    width={480}
                    height={480}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                  <span className={`absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full shadow-sm ${selected ? 'bg-[#3c096c] text-white' : 'bg-white/95 text-transparent'}`}>
                    <Check aria-hidden="true" className="h-4 w-4" />
                  </span>
                </span>
                <span className="block truncate px-2 py-2 text-center text-xs font-bold text-[#17022b] sm:text-sm">{dogName}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-[#fff4ef] px-3 py-2.5 text-xs leading-relaxed text-[#603524]">
        <PawPrint aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#c9503d]" />
        Las ilustraciones son propuestas. Elegir una deja claro cuál diseño quieres consultar.
      </p>
    </fieldset>
  );
}

function ColorPicker({
  options,
  selectedKey,
  onSelect,
  name,
  caption,
  step,
}: {
  options: readonly MerchandiseColorOption[];
  selectedKey: string;
  onSelect: (option: MerchandiseColorOption) => void;
  name: string;
  caption?: string;
  step: number;
}) {
  if (!options.length) return null;
  const selectedOption = options.find((option) => option.key === selectedKey);
  return (
    <fieldset className="space-y-3">
      <StepHeading number={step}>Elige el color{selectedOption ? ` · ${selectedOption.name}` : ''}</StepHeading>
      {caption && <p className="text-xs text-[#65566f]">{caption}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.key === selectedKey;
          return (
            <label key={option.key} className="group relative flex min-h-12 cursor-pointer items-center gap-2 rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#3c096c]">
              <input className="peer sr-only" type="radio" name={name} value={option.key} checked={selected} onChange={() => onSelect(option)} />
              <span className={`flex min-h-12 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors peer-checked:border-[#3c096c] peer-checked:bg-[#f1e2ff] ${selected ? 'border-[#3c096c] bg-[#f1e2ff] text-[#3c096c]' : 'border-[#17022b]/15 bg-white text-[#17022b] group-hover:border-[#e0beff]'}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/15" style={{ backgroundColor: option.hex }}>
                  {selected && <Check aria-hidden="true" className={`h-3.5 w-3.5 ${option.hex.toLowerCase() === '#3c096c' ? 'text-white' : 'text-[#17022b]'}`} />}
                </span>
                {option.name}
                <span className="sr-only">{selected ? ', seleccionado' : ''}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SizePicker({
  options,
  selectedSize,
  onSelect,
  name,
  caption,
  step,
}: {
  options: readonly string[];
  selectedSize: string | null;
  onSelect: (size: string) => void;
  name: string;
  caption?: string;
  step: number;
}) {
  if (!options.length) return null;
  return (
    <fieldset className="space-y-3">
      <StepHeading number={step}>Elige la talla{selectedSize ? ` · ${selectedSize}` : ''}</StepHeading>
      {caption && <p className="text-xs text-[#65566f]">{caption}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((size) => {
          const selected = size === selectedSize;
          return (
            <label key={size} className="group relative cursor-pointer rounded-xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#3c096c]">
              <input className="peer sr-only" type="radio" name={name} value={size} checked={selected} onChange={() => onSelect(size)} />
              <span className={`grid min-h-12 min-w-14 place-items-center rounded-xl border px-4 py-2 text-sm font-bold transition-colors peer-checked:border-[#3c096c] peer-checked:bg-[#3c096c] peer-checked:text-white ${selected ? 'border-[#3c096c] bg-[#3c096c] text-white' : 'border-[#17022b]/15 bg-white text-[#17022b] group-hover:border-[#e0beff]'}`}>
                {size}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProductConfigurator({
  designs = [],
  selectedDesignSlug = null,
  onSelectDesign,
  colorOptions,
  selectedColorKey = '',
  onSelectColor,
  sizeOptions,
  selectedSize = null,
  onSelectSize,
  colorCaption,
  sizeCaption,
}: ProductConfiguratorProps) {
  const id = useId();
  const hasDesigns = designs.length > 0;
  const canChooseOptions = !hasDesigns || Boolean(selectedDesignSlug);
  const sizeStep = (hasDesigns ? 1 : 0) + 1;
  const colorStep = sizeStep + (sizeOptions.length > 0 ? 1 : 0);

  return (
    <div className="space-y-5">
      {hasDesigns && onSelectDesign && (
        <DesignPicker designs={designs} selectedDesignSlug={selectedDesignSlug} onSelectDesign={onSelectDesign} name={`${id}-design`} step={1} />
      )}
      {!canChooseOptions ? (
        <p className="rounded-xl border border-dashed border-[#3c096c]/25 bg-[#f1e2ff]/55 p-3 text-sm leading-relaxed text-[#4c3c58]">
          Después de elegir el diseño, podrás seleccionar la talla y el color que prefieres.
        </p>
      ) : (
        <>
          <SizePicker options={sizeOptions} selectedSize={selectedSize} onSelect={onSelectSize} name={`${id}-size`} caption={sizeCaption} step={sizeStep} />
          <ColorPicker options={colorOptions} selectedKey={selectedColorKey} onSelect={onSelectColor} name={`${id}-color`} caption={colorCaption} step={colorStep} />
        </>
      )}
    </div>
  );
}
