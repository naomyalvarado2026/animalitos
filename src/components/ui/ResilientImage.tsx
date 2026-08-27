import { useState, type ImgHTMLAttributes } from 'react';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

type ResilientImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackLabel?: string;
};

export function ResilientImage({ alt = '', className, fallbackLabel = 'Imagen no disponible', onError, ...props }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed || !props.src) {
    return <div role="img" aria-label={alt || fallbackLabel} className={cn('flex items-center justify-center bg-[#ede5da] text-[#f0644a]', className)}><div className="flex flex-col items-center gap-2 text-center"><PawPrint className="h-9 w-9" aria-hidden="true" /><span className="px-3 text-xs font-semibold text-[#6e6a64]">{fallbackLabel}</span></div></div>;
  }
  return <img {...props} alt={alt} className={cn('transition-opacity duration-300', className)} onError={(event) => { setFailed(true); onError?.(event); }} />;
}
