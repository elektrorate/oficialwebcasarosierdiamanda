import assert from 'node:assert/strict';
import test from 'node:test';
import { planMenuPublication, type PublicationSnapshot, type PublicationItem } from '../src/lib/cms/menu-publication-plan.ts';
import { canonicalMenuPath, internalMenuPath, menuSlug } from '../src/lib/cms/menu-routing.ts';
const home='00000000-0000-4000-8000-000000000001';
const root='00000000-0000-4000-8000-000000000002';
const child='00000000-0000-4000-8000-000000000003';
const offering='00000000-0000-4000-8000-000000000004';
export function fixture() {
 const snapshot: PublicationSnapshot={revision:'v1',menu:{id:home},items:[
  {id:home,label:'Inicio',url:'/#hero'}, {id:root,label:'Clases',url:'/clases'},
  {id:child,label:'Torno',url:'/clases/torno',linked_entity_id:offering}],
  offerings:[{id:offering,title:'Torno',slug:'torno',type:'class',details:{class:{menuTitle:'Torno'},retained:'keep'}}],
  routes:[{key:'clases',path:'/clases',aliases:[]},{key:'workshops',path:'/workshops',aliases:[]}],redirects:[]};
 const item=(id:string,label:string,url:string,linked_entity_id:string):PublicationItem=>({id,label,url,linked_entity_id,linked_entity_type:'none',is_visible:true,open_in_new_tab:false});
 const tree=[item(home,'Inicio','/#hero','menu-root:inicio'),item(root,'Clases','/clases','menu-root:clases')];
 tree[1].children=[{...item(child,'Torno','/clases/torno',offering),linked_entity_type:'offering'}];
 return {snapshot,tree,offering};
}
test('accented names produce readable slugs',()=>assert.equal(menuSlug(' Cerámica por un día '),'ceramica-por-un-dia'));
test('unchanged publication does not rename pages',()=>{const {snapshot,tree}=fixture();const plan=planMenuPublication(snapshot,tree);assert.equal(plan.offerings.length,0);assert.equal(plan.redirects.length,0);});
test('rename offering updates slug and creates redirect',()=>{const {snapshot,tree}=fixture();tree[1].children![0].label='Torno por un día';const plan=planMenuPublication(snapshot,tree);assert.equal(plan.offerings[0].slug,'torno-por-un-dia');assert.deepEqual(plan.redirects,[{source_url:'/clases/torno',target_url:'/clases/torno-por-un-dia'}]);});
test('retain URL mode renames label without altering slug',()=>{const {snapshot,tree}=fixture();Object.assign(tree[1].children![0],{label:'Otro nombre',url_auto:false});assert.equal(planMenuPublication(snapshot,tree).offerings[0].slug,'torno');});
test('section rename retains stable identity and old prefix',()=>{const {snapshot,tree}=fixture();tree[1].label='Cursos';const plan=planMenuPublication(snapshot,tree);assert.equal(plan.routes[0].path,'/cursos');assert.ok(plan.routes[0].aliases.includes('/clases'));assert.equal(canonicalMenuPath('/clases/torno',plan.routes),'/cursos/torno');assert.equal(internalMenuPath('/cursos/torno',plan.routes),'/clases/torno');});
test('move requires explicit compatibility acknowledgement',()=>{const {snapshot,tree}=fixture();tree[1].linked_entity_id='menu-root:workshops';tree[1].url='/workshops';assert.throws(()=>planMenuPublication(snapshot,tree),/Confirma/);const plan=planMenuPublication(snapshot,tree,true);assert.equal(plan.offerings[0].type,'workshop');assert.equal(plan.offerings[0].id,offering);assert.equal(plan.redirects[0].target_url,'/workshops/torno');});
test('moving to gift cards retains identity and requires acknowledgement',()=>{const {snapshot,tree}=fixture();tree[1].linked_entity_id='menu-root:giftcards';tree[1].url='/gift-cards';assert.throws(()=>planMenuPublication(snapshot,tree),/Confirma/);assert.equal(planMenuPublication(snapshot,tree,true).offerings[0].type,'gift_card');});
test('order is the submitted order, including Inicio',()=>{const {snapshot,tree}=fixture();tree.reverse();const plan=planMenuPublication(snapshot,tree);assert.equal(plan.items.find(i=>i.id===home)?.sort_order,1);});
test('duplicate offering slugs rejected',()=>{const {snapshot,tree}=fixture();snapshot.offerings.push({id:'other',slug:'ocupado',type:'class'});tree[1].children![0].label='Ocupado';assert.throws(()=>planMenuPublication(snapshot,tree),/ocupada/);});
test('unknown internal links rejected',()=>{const {snapshot,tree}=fixture();tree.push({...tree[0],id:undefined,label:'Error',url:'/experiencias2',linked_entity_id:'custom'});assert.throws(()=>planMenuPublication(snapshot,tree),/conocida/);});
test('external links are preserved',()=>{const {snapshot,tree}=fixture();tree.push({...tree[0],id:undefined,label:'External',url:'https://example.com',linked_entity_id:'external'});assert.equal(planMenuPublication(snapshot,tree).items.at(-1)?.url,'https://example.com');});
test('reserved and occupied section URLs rejected',()=>{for(const path of ['/admin','/workshops','//evil.test','/cursos?a=1']){const {snapshot,tree}=fixture();tree[1].url=path;assert.throws(()=>planMenuPublication(snapshot,tree));}});
test('historical section prefix cannot be stolen',()=>{const {snapshot,tree}=fixture();snapshot.routes[1].aliases=['/cursos'];tree[1].label='Cursos';assert.throws(()=>planMenuPublication(snapshot,tree),/historial/);});
test('duplicate linked page rejected',()=>{const {snapshot,tree}=fixture();tree[1].children!.push({...tree[1].children![0],id:undefined});assert.throws(()=>planMenuPublication(snapshot,tree),/dos secciones/);});
test('old redirect chains are flattened',()=>{const {snapshot,tree}=fixture();snapshot.redirects=[{source_url:'/antigua',target_url:'/clases/torno',status:'active'}];tree[1].children![0].label='Nuevo';const plan=planMenuPublication(snapshot,tree);assert.ok(plan.redirects.some(r=>r.source_url==='/antigua'&&r.target_url==='/clases/nuevo'));});
test('redirect target already owned by history is rejected',()=>{const {snapshot,tree}=fixture();snapshot.redirects=[{source_url:'/clases/nuevo',target_url:'/clases/torno',status:'active'}];tree[1].children![0].label='Nuevo';assert.throws(()=>planMenuPublication(snapshot,tree),/reservada/);});
test('empty labels, deleted offerings and foreign menu IDs are rejected',()=>{const {snapshot,tree}=fixture();tree[1].label=' ';assert.throws(()=>planMenuPublication(snapshot,tree));tree[1].label='Clases';snapshot.offerings[0].deleted_at='today';assert.throws(()=>planMenuPublication(snapshot,tree));delete snapshot.offerings[0].deleted_at;tree[1].id='00000000-0000-4000-8000-000000000099';assert.throws(()=>planMenuPublication(snapshot,tree),/pertenece/);});
