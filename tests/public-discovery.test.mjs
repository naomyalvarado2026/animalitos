import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FAQS, filterFaqItems, isFaqCategory, normalizeSearch, resolveFaqItems, validateFaqItems } from '../src/lib/faq.ts';
import { PUBLIC_DESTINATIONS, searchPublicContent } from '../src/lib/publicDiscovery.ts';

test('normaliza tildes, mayúsculas y espacios sin perder palabras', () => {
  assert.equal(normalizeSearch('  ADOPCIÓN   y ENVÍO  '), 'adopcion y envio');
});

test('solo admite categorías propias del catálogo', () => {
  assert.equal(isFaqCategory('store'), true);
  assert.equal(isFaqCategory('__proto__'), false);
  assert.equal(isFaqCategory('constructor'), false);
  assert.equal(isFaqCategory(null), false);
});

test('configuración ausente o JSON inválido usa orientación de respaldo', () => {
  for (const raw of [undefined, null, '', '{', '{}', 'null', '42']) assert.deepEqual(resolveFaqItems(raw), DEFAULT_FAQS);
});

test('un catálogo vacío intencional no repone preguntas eliminadas', () => {
  assert.deepEqual(resolveFaqItems('[]'), []);
});

test('descarta filas mal formadas y evita errores de render', () => {
  const raw = JSON.stringify([null, 23, 'abc', {}, { question: 4, answer: 'Texto' }, { question: ' ', answer: 'Texto' }, { question: 'Visitar', answer: ' Coordina tu cita ', category: 'visit' }]);
  assert.deepEqual(resolveFaqItems(raw), [{ question: 'Visitar', answer: 'Coordina tu cita', category: 'visit' }]);
});

test('conserva preguntas antiguas sin categoría y normaliza duplicados', () => {
  const raw = JSON.stringify([{ question: ' Adopción ', answer: 'Primera' }, { question: 'ADOPCION', answer: 'Segunda', category: 'adoption' }]);
  assert.deepEqual(resolveFaqItems(raw), [{ question: 'Adopción', answer: 'Primera', category: 'adoption' }]);
});

test('un contenido publicado reemplaza los respaldos sin mezclarlos', () => {
  const custom = [{ category: 'store', question: 'Pedido especial', answer: 'Pregunta al equipo' }];
  assert.deepEqual(resolveFaqItems(JSON.stringify(custom)), custom);
});

test('las preguntas contextuales no mezclan categorías', () => {
  const items = filterFaqItems(DEFAULT_FAQS, '', 'store');
  assert.equal(items.length, 2);
  assert.ok(items.every((item) => item.category === 'store'));
});

test('la búsqueda FAQ compara todos los términos en pregunta y respuesta', () => {
  assert.equal(filterFaqItems(DEFAULT_FAQS, 'ENViO   cantidad', 'store').length, 2);
  assert.equal(filterFaqItems(DEFAULT_FAQS, 'zz-no-existe').length, 0);
});

test('la validación de publicación rechaza vacíos y repetidos', () => {
  assert.throws(() => validateFaqItems([{ category: 'adoption', question: ' ', answer: 'Respuesta' }]), /fila 1/);
  assert.throws(() => validateFaqItems([{ category: 'store', question: 'Envío', answer: 'A' }, { category: 'store', question: 'ENVIO', answer: 'B' }]), /repetida/);
  assert.throws(() => validateFaqItems([{ category: 'invalid', question: 'Pregunta', answer: 'A' }]), /categoría/);
});

test('la validación recorta texto y conserva orden elegido en admin', () => {
  const items = [{ category: 'store', question: ' B ', answer: ' Dos ' }, { category: 'adoption', question: 'A', answer: 'Uno' }];
  assert.deepEqual(validateFaqItems(items).map((item) => item.question), ['B', 'A']);
  assert.equal(items[0].question, ' B ');
  assert.deepEqual(validateFaqItems([]), []);
});

test('búsqueda vacía ofrece destinos públicos prioritarios', () => {
  const results = searchPublicContent('  ');
  assert.equal(results.length, 6);
  assert.equal(results[0].href, '/adopta');
});

test('busca sin tildes y con palabras del recorrido', () => {
  assert.ok(searchPublicContent('como funciona').some((item) => item.href === '/como-funciona'));
  assert.ok(searchPublicContent('foster').some((item) => item.href === '/voluntariado'));
  assert.ok(searchPublicContent('envio').some((item) => item.href === '/tienda'));
});

test('incluye preguntas publicadas con enlace codificado al contexto', () => {
  const question = '¿Envío & recogida #local?';
  const results = searchPublicContent('recogida', [{ category: 'store', question, answer: 'Coordina con el equipo.' }]);
  const faq = results.find((item) => item.kind === 'faq');
  assert.ok(faq);
  const params = new URLSearchParams(faq.href.split('?')[1]);
  assert.equal(params.get('q'), question);
  assert.equal(params.get('category'), 'store');
});

test('un resultado exacto va antes que las coincidencias en descripciones', () => {
  assert.equal(searchPublicContent('Donaciones', DEFAULT_FAQS)[0].href, '/donaciones');
});

test('sin coincidencias no inventa respuestas', () => {
  assert.deepEqual(searchPublicContent('zz-imposible', DEFAULT_FAQS), []);
});

test('limita listas extensas sin introducir destinos externos o privados', () => {
  const faqs = Array.from({ length: 40 }, (_, index) => ({ category: 'store', question: `Consulta ${index}`, answer: 'Tema' }));
  assert.equal(searchPublicContent('consulta', faqs).length, 12);
  assert.ok(PUBLIC_DESTINATIONS.every((item) => item.href.startsWith('/') && !item.href.startsWith('//') && !item.href.startsWith('/admin')));
  assert.equal(new Set(PUBLIC_DESTINATIONS.map((item) => item.id)).size, PUBLIC_DESTINATIONS.length);
});
