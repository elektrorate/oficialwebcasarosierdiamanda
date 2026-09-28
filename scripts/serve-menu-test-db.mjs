import http from 'node:http';
import { createTestDatabase } from './test-menu-database.mjs';
const {db,menu,offering}=await createTestDatabase();
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 res.setHeader('Content-Type','application/json');
 try{
  let payload=''; for await(const chunk of req)payload+=chunk;
  if(url.pathname.startsWith('/rest/v1/rpc/')){
   const body=JSON.parse(payload||'{}');let result;
   if(url.pathname.endsWith('/menu_publication_snapshot'))result=await db.query('select public.menu_publication_snapshot($1) as value',[body.p_menu_id]);
   else if(url.pathname.endsWith('/publish_menu_revision'))result=await db.query('select public.publish_menu_revision($1,$2,$3,$4,$5) as value',[body.p_menu_id,body.p_revision,JSON.stringify(body.p_plan),body.p_visual?JSON.stringify(body.p_visual):null,body.p_actor]);
   else throw new Error('Unknown RPC');
   res.end(JSON.stringify(result.rows[0].value));return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.end('{}');return;}
  const table=url.pathname.split('/').pop();
  const allowed=['menus','menu_items','offerings','public_section_routes','redirects','menu_visual_settings'];
  let rows=[];
  if(allowed.includes(table)) rows=(await db.query(`select * from public.${table}`)).rows;
  if(table==='site_settings')rows=[{id:menu,site_name:'Casa Rosier TEST',default_language:'es',timezone:'Europe/Madrid',robots_index:true,robots_follow:true,city:'Barcelona',country:'España',show_contact_info:true,show_social_links:true,maintenance_mode:false}];
  for(const [key,value]of url.searchParams){
   if(value.startsWith('eq.'))rows=rows.filter(r=>String(r[key])===value.slice(3));
   else if(value==='is.null')rows=rows.filter(r=>r[key]==null);
   else if(value.startsWith('in.(')){const vals=value.slice(4,-1).split(',');rows=rows.filter(r=>vals.includes(String(r[key])));}
  }
  const order=url.searchParams.get('order');if(order){const key=order.split('.')[0];rows.sort((a,b)=>String(a[key]).localeCompare(String(b[key])));}
  const limit=url.searchParams.get('limit');if(limit)rows=rows.slice(0,Number(limit));
  if(req.headers.accept?.includes('vnd.pgrst.object'))res.end(JSON.stringify(rows[0]??null));else res.end(JSON.stringify(rows));
 }catch(error){res.statusCode=400;res.end(JSON.stringify({message:error.message,code:error.code}));}
});
server.listen(55439,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:55439',menu,offering})));
