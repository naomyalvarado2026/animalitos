// Run only against the intended project after 20261008120000. Never seeds real finance.
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(line => line.includes('=')).map(line => { const i=line.indexOf('='); return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')]; }));
if (!env.VITE_SUPABASE_URL?.includes('uxktqlmffongcagaxgtr') || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Verify the intended AdoptaME project and local service credential.');
async function request(table, method='GET', body, query='') {
  const response=await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}${query}`,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'},body:body?JSON.stringify(body):undefined});
  if(!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
  return response.status===204?[]:response.json();
}
const products=[
  ['buzo-manada','Buzo de la manada',3200,'Ropa','buzo','Morado','#3c096c',['Diseño propuesto en algodón con interior afelpado','Capucha y bolsillo frontal','Tallas propuestas S, M y L','Bordado de marca; composición y medidas por confirmar']],
  ['manta-abrazos','Manta Abrazos AdoptaME',2200,'Hogar y mascotas','manta','Lavanda','#b795d3',['Diseño propuesto en tejido polar suave','Formato propuesto 100 × 70 cm','Etiqueta de marca y huella bordada','Lavado y resistencia por validar con proveedor']],
  ['termo-huellas','Termo Huellas',2400,'Accesorios','termo','Coral','#ff8069',['Diseño propuesto en acero inoxidable','Capacidad propuesta 500 ml','Tapa con cierre deslizante','Aislamiento térmico pendiente de validación']],
  ['adorno-navidad','Adorno Una Navidad con Huellas',900,'Temporada','adorno','Morado','#3c096c',['Esfera decorativa con acabado brillante','Cinta coral para colgar','Diámetro propuesto 8 cm','Artículo decorativo; mantener fuera del alcance de mascotas']],
];
for (const [slug,name,price,category,image,color,hex,characteristics] of products) {
  await request('products','POST',[{slug,name,price_cents:price,currency:'USD',category,description:'Propuesta de colección AdoptaME. Render de referencia y precio estimado; fabricación, materiales y entrega por confirmar.',image_url:`/brand/merch/${image}-render-960.webp`,characteristics,inventory:0,is_active:true,is_proposal:true}],'?on_conflict=slug');
  const [p]=await request('products','GET',null,`?slug=eq.${slug}&select=id`);
  for(const label of (image==='buzo'?['Morado · S','Morado · M','Morado · L']:[color])) await request('product_variants','POST',[{product_id:p.id,label,color_hex:hex,image_url:`/brand/merch/${image}-render-960.webp`,inventory:0,is_active:true,price_delta_cents:0}],'?on_conflict=product_id,label');
}
const campaigns=[
 ['halloween-2026','Huellitas sin sustos','Halloween','2026-10-15','2026-10-31','scooby.jpg','Una temporada para compartir historias de rescate y reunir alimento, sin disfraces incómodos ni sustos para los animales.',['Difunde el perfil de un rescatado','Coordina una entrega de alimento sellado','Comparte consejos para una celebración tranquila']],
 ['navidad-2026','Una Navidad con huellas','Navidad','2026-12-01','2026-12-25','yeri.jpg','Preparamos una propuesta de campaña de alimento e insumos para el refugio. Regala compañía y el compromiso de cuidar durante todo el año.',['Consulta la lista de insumos antes de donar','Explora el adorno de la colección propuesta','Súmate a la difusión de adopciones responsables']],
 ['fin-de-ano-2026','Que el nuevo año los encuentre seguros','Fin de año','2026-12-26','2027-01-06','noah.jpg','Plan de difusión para reducir el estrés de las fiestas, revisar identificaciones y acompañar a los rescatados durante el cambio de año.',['Prepara un espacio tranquilo y acompañado','Revisa placas y datos de contacto','Apoya con insumos coordinados con el equipo']],
 ['san-valentin-2027','Amor que se queda','San Valentín','2027-02-01','2027-02-14','moana.jpg','El cariño se demuestra con tiempo y constancia. Esta propuesta invita a conocer a los rescatados, apadrinar y conversar sobre adopción en familia.',['Conoce el carácter y necesidades de cada perro','Consulta cómo apadrinar','No regales animales por sorpresa']],
 ['familias-2027','Hogares con espacio para una huella','Mes de la familia','2027-05-01','2027-05-31','minie.jpg','Una propuesta para conversar en familia sobre cuidados, gastos y tiempo antes de adoptar, con recursos educativos del proyecto.',['Lee el proceso de adopción','Comparte responsabilidades de cuidado','Consulta al equipo antes de elegir un compañero']],
 ['verano-2027','Agua, sombra y compañía','Temporada de calor','2027-07-01','2027-08-31','tigresa.jpg','Plan educativo para promover paseos en horarios frescos, agua disponible y espacios de descanso. Las fechas son una referencia de planificación.',['Revisa agua y sombra a diario','Evita paseos sobre superficies calientes','Consulta insumos útiles para el refugio']],
];
await request('seasonal_campaigns','POST',campaigns.map(([slug,title,season,starts_on,ends_on,image,description,actions])=>({slug,title,season,starts_on,ends_on,image_url:`/images/refugio/${image}`,description,actions,is_active:true})),'?on_conflict=slug');
const incomes=[['donation','EJEMPLO · Aporte mensual de la manada',80,'2026-10-02'],['event','EJEMPLO · Jornada solidaria de octubre',150,'2026-10-04'],['other','EJEMPLO · Venta simulada de colección',54,'2026-10-05'],['donation','EJEMPLO · Aporte para alimento',120,'2026-10-06'],['donation','EJEMPLO · Apoyo veterinario',65,'2026-10-07']];
const expenses=[['food','EJEMPLO · Compra simulada de alimento',92,'2026-10-02'],['medical','EJEMPLO · Consulta veterinaria simulada',45,'2026-10-04'],['supplies','EJEMPLO · Insumos de limpieza',28,'2026-10-05'],['infrastructure','EJEMPLO · Mantenimiento de cerramiento',60,'2026-10-06'],['utilities','EJEMPLO · Servicios del refugio',35,'2026-10-07']];
for(const [table,rows,prefix] of [['income_records',incomes,'11111111'],['expense_records',expenses,'22222222']]) await request(table,'POST',rows.map(([category,description,amount_usd,date],i)=>({id:`${prefix}-0000-4000-8000-${String(i+1).padStart(12,'0')}`,category,description,amount_usd,date,is_demo:true,is_public:false})),'?on_conflict=id');
const allProducts=await request('products','GET',null,'?select=id,slug,name,price_cents');
for(const [i,status] of ['pending','confirmed','paid','shipped','completed','cancelled'].entries()) {
  const p=allProducts.find(p=>p.slug===['camiseta-adoptame','panuelo-me-eligieron','tote-bag-adoptame','buzo-manada','manta-abrazos','adorno-navidad'][i]);
  if(!p) throw new Error('Missing catalog seed product');
  const id=`33333333-0000-4000-8000-${String(i+1).padStart(12,'0')}`;
  await request('orders','POST',[{id,order_number:`DEMO-AME-00${i+1}`,customer_name:`Cliente de ejemplo ${i+1}`,customer_email:`ejemplo${i+1}@example.com`,status,total_cents:p.price_cents*(i%2+1),currency:'USD',is_demo:true,idempotency_key:`demo-seasonal-order-2026-${i+1}`,created_at:`2026-10-0${i+1}T15:00:00Z`}],'?on_conflict=id');
  await request('order_items','POST',[{id:`44444444-0000-4000-8000-${String(i+1).padStart(12,'0')}`,order_id:id,product_id:p.id,product_name_snapshot:p.name,variant_label_snapshot:'Ejemplo · sin reserva de inventario',unit_price_cents:p.price_cents,quantity:i%2+1}],'?on_conflict=id');
}
console.log('Seed verified: 4 new proposals, 6 campaigns, 5 demo incomes, 5 demo expenses, 6 demo orders. No inventory reserved and no real transaction inserted.');
