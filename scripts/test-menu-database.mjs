import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { planMenuPublication } from '../src/lib/cms/menu-publication-plan.ts';
const require=createRequire(import.meta.url);
const {PGlite}=require(path.join(process.env.TEMP, 'casa-menu-db-test/node_modules/@electric-sql/pglite'));
export async function createTestDatabase() {
 const db=new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 const baseline=fs.readFileSync('supabase/migrations/20260717000100_phase1_cms.sql','utf8');
 for(const name of ['offerings','menus','menu_items','redirects']){
  const sql=baseline.match(new RegExp('create table if not exists public\\.'+name+' \\([\\s\\S]*?\\n\\);'))?.[0];
  assert.ok(sql);await db.exec(sql);
 }
 await db.exec("alter table public.offerings add column details jsonb default '{}'::jsonb;");
 const visual=fs.readFileSync('supabase/migrations/20260717001700_menu_visual_settings.sql','utf8');
 await db.exec(visual.slice(visual.indexOf('create table'),visual.indexOf('insert into')));
 await db.exec(fs.readFileSync('supabase/migrations/20260928085241_coordinated_menu_publication.sql','utf8'));
 await db.exec('grant all on public.menus,public.menu_items,public.offerings,public.redirects,public.menu_visual_settings to service_role;');
 const menu='00000000-0000-4000-8000-000000000010';
 const offering='00000000-0000-4000-8000-000000000020';
 await db.query("insert into public.menus(id,name,location,status) values($1,'Principal','main','active')",[menu]);
 await db.query("insert into public.offerings(id,type,title,slug,status,details) values($1,'class','Torno','torno','published',$2)",[offering,JSON.stringify({class:{menuTitle:'Torno'},retained:'original'})]);
 await db.exec("update public.offerings set subtitle='',excerpt='Actividad de prueba',description='Contenido de prueba',duration='2 horas',teacher='',cover_image_url='',seo_title='Torno',seo_description='Actividad de prueba';");
 return {db,menu,offering};
}
export async function runDatabaseTests() {
 const {db,menu,offering}=await createTestDatabase();
 const get=async()=> (await db.query('select public.menu_publication_snapshot($1) as state',[menu])).rows[0].state;
 const apply=async(s,p)=> (await db.query('select public.publish_menu_revision($1,$2,$3,null,$4) as state',[menu,s.revision,JSON.stringify(p),'test@local'])).rows[0].state;
 let snapshot=await get();
 const base={linked_entity_type:'none',is_visible:true,open_in_new_tab:false};
 let tree=[{...base,label:'Inicio',url:'/#hero',linked_entity_id:'menu-root:inicio'},
 { ...base,label:'Clases',url:'/clases',linked_entity_id:'menu-root:clases',children:[{...base,label:'Torno',url:'/clases/torno',linked_entity_type:'offering',linked_entity_id:offering}]}];
 let plan=planMenuPublication(snapshot,tree);
 snapshot=await apply(snapshot,plan);
 assert.equal(snapshot.items.length,3);
 const before=snapshot;
 tree=tree.map(root=>({...root,id:snapshot.items.find((r)=>r.linked_entity_id===root.linked_entity_id).id}));
 tree[1].children[0]= {...tree[1].children[0],id:snapshot.items.find((r)=>r.linked_entity_id===offering).id};
 tree[1].label='Cursos';tree[1].children[0].label='Torno por un día';
 plan=planMenuPublication(snapshot,tree);snapshot=await apply(snapshot,plan);
 assert.equal(snapshot.offerings[0].slug,'torno-por-un-dia');
 assert.equal(snapshot.offerings[0].details.retained,'original');
 assert.equal(snapshot.routes.find((r)=>r.key==='clases').path,'/cursos');
 assert.equal(snapshot.redirects[0].source_url,'/clases/torno');
 await assert.rejects(()=>apply(before,plan),/otra sesión/);
 const invalid=structuredClone(plan); invalid.offerings[0].type='invalid';
 await assert.rejects(()=>apply(snapshot,invalid));
 assert.equal((await get()).revision,snapshot.revision,'failed transaction changes nothing');
 const history=await db.query('select count(*)::int as n from public.menu_publication_history');
 assert.equal(history.rows[0].n,2,'failed writes also roll back audit history');
 await db.exec('set role anon');
 await assert.rejects(()=>get(),/permission denied/);
 await db.exec('reset role');
 // Move while keeping content, identity and slug. Use the current menu rows as the request.
 const roots=snapshot.items.filter((r)=>!r.parent_id).sort((a,b)=>a.sort_order-b.sort_order);
 const moveTree=roots.map((r)=>({...r,children:snapshot.items.filter((c)=>c.parent_id===r.id)}));
 moveTree[1].linked_entity_id='menu-root:workshops';moveTree[1].label='Workshops';moveTree[1].url='/workshops';
 snapshot=await apply(snapshot,planMenuPublication(snapshot,moveTree,true));
 assert.equal(snapshot.offerings[0].type,'workshop');assert.equal(snapshot.offerings[0].id,offering);
 assert.equal(snapshot.offerings[0].details.retained,'original');
 assert.equal(snapshot.redirects.find((r)=>r.source_url==='/clases/torno').target_url,'/workshops/torno-por-un-dia');
 await db.close(); console.log("PASS: atomic publication, rollback, concurrency, permissions, moves and redirect history");
}
if(process.argv.includes('--test')) await runDatabaseTests();
