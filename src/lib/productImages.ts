import { PRODUCT_IMAGE_BUCKET } from '@/lib/merchandise';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function prepareProductImage(file: File): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Usa imágenes JPG, PNG o WebP.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Cada imagen debe pesar menos de 20 MB.');
  }
  if (typeof createImageBitmap !== 'function') {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error('Este navegador no puede comprimir la imagen. Prueba con una versión de menos de 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext('2d');
  try {
    if (!context) {
      if (file.size <= MAX_UPLOAD_BYTES) return file;
      throw new Error('No se pudo preparar la imagen para subirla.');
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }

  for (const quality of [0.84, 0.74, 0.64]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], 'product.webp', { type: 'image/webp' });
    }
  }
  throw new Error('La imagen sigue siendo muy pesada. Reduce su tamaño e inténtalo de nuevo.');
}

export function getProductImageStoragePath(url: string, productId: string) {
  try {
    const pathname = new URL(url).pathname;
    const prefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/products/${productId}/`;
    if (!pathname.startsWith(prefix)) return null;
    return decodeURIComponent(pathname.slice(`/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`.length));
  } catch {
    return null;
  }
}
