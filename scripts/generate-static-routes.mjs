import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const dist = path.join(root, 'dist');
const viteConfig = await readFile(path.join(root, 'vite.config.ts'), 'utf8');
const basePath = viteConfig.match(/base:\s*['"]([^'"]+)['"]/)?.[1] ?? '/';
const basePrefix = basePath === '/' ? '' : basePath.replace(/\/$/, '');
const siteOrigin = (process.env.VITE_SITE_ORIGIN ?? 'https://naomyalvarado2026.github.io').replace(/\/$/, '');

const staticRoutes = [
  { path: '/', title: 'AdoptaME — Cada perro merece una historia feliz', description: 'Conoce perros rescatados, adopta responsablemente y apoya su recuperación con AdoptaME.' },
  { path: '/adopta', title: 'Adopta un perro | AdoptaME', description: 'Conoce perros rescatados y encuentra el compañero que encaja contigo.' },
  { path: '/apadrina', title: 'Apadrina un perro rescatado | AdoptaME', description: 'Acompaña el cuidado de un integrante de la manada mientras llega su familia.' },
  { path: '/como-funciona', title: 'Cómo funciona la adopción | AdoptaME', description: 'Conoce el proceso responsable para adoptar un perro rescatado.' },
  { path: '/santuario', title: 'Santuario y padrinazgo | AdoptaME', description: 'Acompaña a los residentes permanentes que necesitan cuidados especiales.' },
  { path: '/en-memoria', title: 'En memoria de | AdoptaME', description: 'Honramos a los perros que dejaron una huella en nuestra manada.' },
  { path: '/recursos', title: 'Recursos de tenencia responsable | AdoptaME', description: 'Guías para cuidar, adaptar y convivir mejor con un perro.' },
  { path: '/campanas', title: 'Campañas de temporada | AdoptaME', description: 'Conoce las propuestas de temporada y descubre formas de apoyar a la manada.' },
  { path: '/hogar-temporal', title: 'Hogar temporal | AdoptaME', description: 'Conoce el proceso para ofrecer un hogar temporal y acompañar a un perro rescatado.' },
  { path: '/apoyo-comunitario', title: 'Apoyo comunitario | AdoptaME', description: 'Solicita orientación, reporta un animal perdido o encontrado y consulta recursos verificados.' },
  { path: '/tienda', title: 'Tienda solidaria | AdoptaME', description: 'Compra productos con propósito y ayuda a financiar el rescate de perros.' },
  { path: '/nosotros', title: 'Quiénes somos | AdoptaME', description: 'Conoce al equipo y la misión de AdoptaME.' },
  { path: '/nosotros/historia', title: 'Nuestra historia | AdoptaME', description: 'La historia del refugio y el trabajo por una vida mejor para cada perro.' },
  { path: '/historias-de-exito', title: 'Historias de adopción | AdoptaME', description: 'Historias de perros rescatados que encontraron una familia.' },
  { path: '/voluntariado', title: 'Voluntariado | AdoptaME — Tu tiempo, su segunda oportunidad', description: 'Súmate como voluntario en AdoptaME. Paseos, salud, fotografía, eventos y hogares temporales para los 12 perritos rescatados.' },
  { path: '/faq', title: 'Preguntas frecuentes | AdoptaME', description: 'Respuestas sobre adopción, cuidado y apoyo a AdoptaME.' },
  { path: '/transparencia', title: 'Transparencia | AdoptaME', description: 'Consulta la información pública sobre el trabajo y los recursos de AdoptaME.' },
  { path: '/transparencia/ingresos', title: 'Ingresos | Transparencia AdoptaME', description: 'Consulta los ingresos registrados para apoyar el trabajo de AdoptaME.' },
  { path: '/transparencia/ingresos/donaciones', title: 'Donaciones recibidas | AdoptaME', description: 'Consulta el registro público de donaciones recibidas por AdoptaME.' },
  { path: '/transparencia/ingresos/eventos', title: 'Ingresos de eventos | AdoptaME', description: 'Consulta los ingresos de eventos solidarios registrados por AdoptaME.' },
  { path: '/transparencia/egresos', title: 'Egresos | Transparencia AdoptaME', description: 'Consulta los gastos registrados para el cuidado y rescate de perros.' },
  { path: '/donaciones', title: 'Dona y salva una vida | AdoptaME', description: 'Tu apoyo cubre alimento, salud y recuperación para perros rescatados.' },
  { path: '/donaciones/donadores-principales', title: 'Personas que apoyan | AdoptaME', description: 'Conoce a quienes contribuyen al bienestar de los perros rescatados.' },
  { path: '/contacto', title: 'Contacto | AdoptaME', description: 'Comunícate con el equipo de AdoptaME.' },
  { path: '/contacto/quiero-apoyar', title: 'Quiero apoyar | AdoptaME', description: 'Encuentra una forma de contribuir al cuidado de los perros rescatados.' },
  { path: '/privacidad', title: 'Privacidad y métricas | AdoptaME', description: 'Conoce cómo protegemos tus datos y cómo usamos métricas anónimas en AdoptaME.' },
];

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function upsertMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function pageUrl(routePath) {
  const clean = routePath === '/' ? '' : `${routePath.replace(/^\//, '').replace(/\/$/, '')}/`;
  return new URL(`${basePrefix}/${clean}`, `${siteOrigin}/`).toString();
}

function imageUrl(imagePath) {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return new URL(`${basePrefix}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`, `${siteOrigin}/`).toString();
}

async function writeRoute(template, route, structuredData) {
  const canonical = pageUrl(route.path);
  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = upsertMeta(html, 'name', 'description', route.description);
  html = upsertMeta(html, 'property', 'og:title', route.title);
  html = upsertMeta(html, 'property', 'og:description', route.description);
  html = upsertMeta(html, 'property', 'og:image', route.image ?? imageUrl('/images/dog_max.jpg'));
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertCanonical(html, canonical);
  if (route.ogType === 'article') html = upsertMeta(html, 'property', 'og:type', 'article');
  if (structuredData) {
    const json = JSON.stringify(structuredData).replaceAll('<', '\\u003c');
    html = html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
  }

  const relativePath = route.path === '/' ? '' : route.path.replace(/^\//, '');
  const outputDir = path.join(dist, relativePath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  return canonical;
}

const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let routesForSitemap = [];
try {
  const { REFUGE_DOG_PROFILES } = await vite.ssrLoadModule('/src/data/refugeDogProfiles.ts');
  const { getDefaultDogEditorial } = await vite.ssrLoadModule('/src/data/dogEditorialProfiles.ts');
  const template = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const route of staticRoutes) routesForSitemap.push(await writeRoute(template, route));
  for (const dog of REFUGE_DOG_PROFILES.filter((profile) => profile.is_published)) {
    const editorial = getDefaultDogEditorial(dog.adoption_slug);
    const title = `${dog.name} busca familia | AdoptaME`;
    const description = dog.description;
    const canonical = await writeRoute(template, {
      path: `/adopta/${dog.adoption_slug}`,
      title,
      description,
      image: imageUrl(editorial?.cover_image_url ?? dog.main_image_url),
      ogType: 'article',
    }, {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: imageUrl(editorial?.cover_image_url ?? dog.main_image_url),
      mainEntityOfPage: `${siteOrigin}${basePrefix}/adopta/${dog.adoption_slug}`,
      about: { '@type': 'Thing', name: 'Adopción responsable de perros' },
    });
    routesForSitemap.push(canonical);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routesForSitemap.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
  await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${siteOrigin}${basePath}sitemap.xml\n`, 'utf8');
} finally {
  await vite.close();
}

console.log(`Generated ${routesForSitemap.length} public SEO routes and sitemap entries.`);
