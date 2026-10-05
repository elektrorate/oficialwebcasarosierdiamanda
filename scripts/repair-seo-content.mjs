// Run with node --env-file=.env.local scripts/repair-seo-content.mjs [--apply]
// Only published content is eligible. Record the before/after values before writing.
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const revisions = [
  ["offerings", "curso-ceramica-barcelona-formacion-integral", "Formación integral en cerámica en Barcelona | Casa Rosier", "Desarrolla una base sólida en cerámica con formación práctica en Barcelona: técnicas, materiales y fundamentos para crear tus propios proyectos."],
  ["offerings", "formulacion-esmaltes-barcelona", "Workshop de esmaltes cerámicos en Barcelona | Casa Rosier", "Aprende a formular esmaltes cerámicos de baja y alta temperatura en Barcelona. Desarrolla tus propias fórmulas y conoce los materiales en Casa Rosier."],
  ["offerings", "clases-regulares-de-modelado", "Clases regulares de modelado en Barcelona | Casa Rosier", "Disfruta de cuatro sesiones mensuales de modelado cerámico en Barcelona, con acompañamiento cercano, arcilla, esmaltes y horneado incluidos."],
  ["offerings", "coworking-de-investigacion-tecnica-de-esmaltes-y-engobes", "Coworking de esmaltes y engobes en Barcelona | Casa Rosier", "Investiga esmaltes y engobes en el laboratorio cerámico de Casa Rosier. Modalidad coworking con tres horas semanales para desarrollar tus pruebas."],
  ["offerings", "experiencia-de-un-dia-modelado", "Modelado cerámico de un día en Barcelona | Casa Rosier", "Descubre el modelado cerámico en una experiencia de un día en Barcelona. Ven sola, en pareja o con amigos a experimentar con el barro en Casa Rosier."],
  ["offerings", "tarjeta-regalo-ceramica-en-barcelona", "Tarjeta regalo de cerámica en Barcelona | Casa Rosier", "Regala tiempo para crear con una tarjeta regalo de cerámica en Barcelona. Una experiencia en el taller de Casa Rosier para descubrir el trabajo con arcilla."],
  ["offerings", "workshops-esmaltes-online-zoom", "Workshop de formulación de esmaltes online | Casa Rosier", "Aprende formulación de esmaltes cerámicos online vía Zoom con Casa Rosier. Explora materiales y fórmulas para avanzar en tus proyectos de cerámica."],
  ["offerings", "team-building-ceramica-barcelona", "Team building de cerámica en Barcelona | Casa Rosier", "Comparte una experiencia de cerámica con tu equipo en Barcelona. Un taller de Casa Rosier para empresas y grupos que quieren crear juntos con arcilla."],
  ["blog_posts", "del-barro-a-la-idea-7-formas-de-expandir-tu-creatividad-con-piezas-funcionales", "7 ideas para crear cerámica funcional | Casa Rosier", "Explora siete formas de desarrollar tu creatividad con cerámica funcional: convierte tus ideas en tazas, cuencos y piezas que forman parte del día a día."],
  ["blog_posts", "hacer-ceramica-en-pareja-en-barcelona", "Hacer cerámica en pareja en Barcelona | Casa Rosier", "Descubre cómo una experiencia de cerámica en pareja permite compartir tiempo, experimentar con el barro y crear algo juntos en Barcelona."],
  ["blog_posts", "caminos-y-tecnicas-para-convertir-barro-en-forma", "Técnicas de modelado cerámico: del barro a la forma | Casa Rosier", "Conoce distintos caminos para modelar arcilla y construir formas cerámicas. Técnicas, decisiones y práctica para dar forma a tus piezas en el taller."],
  ["blog_posts", "no-es-falta-de-talento-es-miedo-a-crear", "El miedo a crear y la práctica cerámica | Casa Rosier", "Una reflexión sobre el miedo a crear al empezar cerámica: el juicio, la experimentación y el aprendizaje a través del trabajo con arcilla."],
  ["blog_posts", "esmaltes-ceramicos-que-son-como-funcionan-y-como-evitar-errores-comunes", "Esmaltes cerámicos: composición y errores comunes | Casa Rosier", "Descubre qué son los esmaltes cerámicos y cómo influyen la composición, la cocción y la aplicación en sus resultados. Aprende a interpretar errores comunes."],
  ["blog_posts", "barbotina-con-esteroides", "Barbotina cerámica: uniones y control de humedad | Casa Rosier", "Conoce el papel de la barbotina, la humedad y el secado en las uniones de arcilla. Notas de taller sobre silicato de sodio y CMC en Casa Rosier."],
];

const changes = [];
for (const [table, slug, seo_title, seo_description] of revisions) {
  const { data, error } = await db.from(table).select("id,slug,seo_title,seo_description,excerpt")
    .eq("slug", slug).eq("status", "published").is("deleted_at", null).single();
  if (error) throw error;
  const after = { seo_title, seo_description };
  if (slug === "formulacion-esmaltes-barcelona" && data.excerpt?.includes("20206")) {
    after.excerpt = data.excerpt.replaceAll("20206", "2026");
  }
  const before = Object.fromEntries(Object.keys(after).map(key => [key, data[key]]));
  if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ table, id: data.id, slug, before, after });
}
const { data: settings, error: settingsError } = await db.from("site_settings").select("id,default_og_image_url").single();
if (settingsError) throw settingsError;
if (!settings.default_og_image_url?.trim()) {
  const { data: home, error } = await db.from("home_page_settings").select("hero").single();
  if (error) throw error;
  if (!home.hero?.heroImage) throw new Error("Missing approved home image");
  changes.push({ table: "site_settings", id: settings.id, before: { default_og_image_url: settings.default_og_image_url }, after: { default_og_image_url: home.hero.heroImage } });
}
const report = { checkedAt: new Date().toISOString(), changes };
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--apply") && changes.length) {
  const backup = new URL(`../reports/seo-content-before-after-${Date.now()}.json`, import.meta.url);
  await writeFile(backup, JSON.stringify(report, null, 2), { flag: "wx" });
  console.log(`Backup: ${backup.pathname}`);
  for (const change of changes) {
    let query = db.from(change.table).update(change.after).eq("id", change.id);
    if (change.table !== "site_settings") query = query.eq("status", "published").is("deleted_at", null);
    // Optimistic concurrency: do not overwrite a field edited since the snapshot.
    for (const [key, value] of Object.entries(change.before)) query = value === null ? query.is(key, null) : query.eq(key, value);
    const fields = Object.keys(change.after).join(",");
    const { data, error } = await query.select(fields).single();
    if (error) throw error;
    for (const [key, value] of Object.entries(change.after)) {
      if (data[key] !== value) throw new Error(`Unverified write: ${change.table}/${change.id}/${key}`);
    }
    console.log(`Verified: ${change.table}/${change.slug || change.id}`);
  }
}
