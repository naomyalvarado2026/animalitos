import { assetUrl } from './assets.ts';
import type { DogEditorialProfile } from '../data/dogEditorialProfiles.ts';

type SocialCardAnimal = { name: string; main_image_url: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar la fotografía para la tarjeta.'));
    image.src = assetUrl(src);
  });
}

function coverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, focalX: number, focalY: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const maxX = Math.max(0, image.naturalWidth - sourceWidth);
  const maxY = Math.max(0, image.naturalHeight - sourceHeight);
  const sourceX = maxX * Math.min(100, Math.max(0, focalX)) / 100;
  const sourceY = maxY * Math.min(100, Math.max(0, focalY)) / 100;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

export async function downloadDogSocialCard(animal: SocialCardAnimal, editorial: DogEditorialProfile): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no permite generar la tarjeta.');

  await document.fonts?.ready;
  const image = await loadImage(editorial.cover_image_url || animal.main_image_url);
  ctx.fillStyle = editorial.accent_color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  coverImage(ctx, image, 0, 0, 1080, 820, editorial.focal_x, editorial.focal_y);
  const gradient = ctx.createLinearGradient(0, 430, 0, 830);
  gradient.addColorStop(0, 'rgba(23,23,23,0)');
  gradient.addColorStop(1, 'rgba(23,23,23,.82)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 420, 1080, 410);

  ctx.fillStyle = '#fffdf9';
  ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('UNA HISTORIA REAL', 72, 730);
  ctx.font = '800 104px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(animal.name, 68, 810);

  ctx.fillStyle = '#171717';
  ctx.fillRect(0, 820, 1080, 530);
  ctx.fillStyle = '#f0644a';
  ctx.font = '800 40px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AdoptaME', 72, 915);
  ctx.fillStyle = '#fffdf9';
  ctx.font = '700 45px "Plus Jakarta Sans", sans-serif';
  wrapText(ctx, editorial.voice_line, 72, 1005, 930, 58, 4);
  ctx.fillStyle = '#ffcf5a';
  ctx.font = '700 30px "DM Sans", sans-serif';
  ctx.fillText('Conoce su historia · comparte · adopta responsablemente', 72, 1280);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo exportar la tarjeta.');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `adoptame-${editorial.slug}-instagram.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}
