import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { draftStore, remoteStore, reconcile } from '../apps/platform/inspection-store.js';

const { PGlite } = await import(pathToFileURL(resolve(process.argv[2])).href);
const database = new PGlite();
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const query = (sql,args = []) => database.query(sql,args);
async function use(role, owner = '') {
  await database.exec('reset role; set role ' + role);
  await query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
}
const data = {status:'Avaliado',notes:'Teste A',advice:''};
const map = new Map();
const storage = { getItem:k=>map.get(k) ?? null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k) };
const drafts = draftStore(a,storage);
try {
  await database.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated, anon;
  `);
  await query('insert into auth.users values ($1),($2)',[a,b]);
  for (const migration of ['20261121204325_platform_foundation','20261122003740_inspection_reviews_v1']) {
    await database.exec(await readFile(new URL('../supabase/migrations/'+migration+'.sql',import.meta.url),'utf8'));
  }
  const table = 'public.inspection_reviews';
  const insert = `insert into ${table}(model_version,case_code,status,notes,advice) values ('aurea-v03',$1,$2,$3,$4) returning *`;
  await use('anon');
  await assert.rejects(query('select * from '+table),{code:'42501'});
  await assert.rejects(query(insert,['R01',data.status,data.notes,data.advice]),{code:'42501'});
  await use('authenticated',a);
  const [rowA] = (await query(insert,['R01',data.status,data.notes,data.advice])).rows;
  assert.equal(rowA.owner_id,a);
  assert.ok(rowA.created_at instanceof Date && rowA.updated_at instanceof Date);
  await assert.rejects(query(insert,['R01',data.status,data.notes,data.advice]),{code:'23505'});
  await assert.rejects(query(insert,['R02','inválido','','']),{code:'23514'});
  await assert.rejects(query(insert,['R02',data.status,'x'.repeat(4001),'']),{code:'23514'});
  await assert.rejects(query(`update ${table} set created_at=now()`),{code:'42501'});
  await use('authenticated',b);
  for (const statement of [`select * from ${table}`, `update ${table} set notes='B' returning *`, `delete from ${table} returning *`]) {
    assert.equal((await query(statement)).rows.length,0);
  }
  await assert.rejects(query(`insert into ${table}(owner_id,model_version,case_code,status)
    values ($1,'aurea-v03','R01','Avaliado')`,[a]),{code:'42501'});
  const [rowB] = (await query(insert,['R01',data.status,'Teste B',''])).rows;
  assert.equal(rowB.owner_id,b);
  await assert.rejects(query(`update ${table} set owner_id=$1`,[a]),{code:'42501'});
  await use('authenticated',a);
  assert.equal((await query('select * from '+table)).rows[0].notes,'Teste A');
  const [edited] = (await query(`update ${table} set notes='Remoto atualizado' where revision=$1 returning *`,[rowA.revision])).rows;
  assert.notEqual(edited.revision,rowA.revision);
  assert.equal((await query(`update ${table} set notes='Antigo' where revision=$1 returning *`,[rowA.revision])).rows.length,0);

  // Translate only the exercised PostgREST calls into real PostgreSQL statements.
  const realFetch = globalThis.fetch;
  const allowed = new Set([a,b]);
  globalThis.fetch = async (url, options) => {
    const owner = options.headers.Authorization.slice(7);
    assert.ok(allowed.has(owner));
    await use('authenticated',owner);
    const code = url.searchParams.get('case_code').slice(3);
    const rev = url.searchParams.get('revision')?.slice(3);
    const body = options.body && JSON.parse(options.body);
    try {
      let result;
      if (options.method === 'GET') result = await query('select * from '+table+' where case_code=$1',[code]);
      else if (options.method === 'POST') result = await query(insert,[code,body.status,body.notes,body.advice]);
      else result = await query(`update ${table} set status=$1,notes=$2,advice=$3 where case_code=$4 and revision=$5 returning *`,
        [body.status,body.notes,body.advice,code,rev]);
      return Response.json(result.rows);
    } catch (error) {
      if (error.code === '23505') return Response.json({}, {status:409});
      throw error;
    }
  };
  const life = new AbortController();
  let identity = a;
  let expiry = Date.now()/1000+3600;
  const client = {auth:{getSession:async()=>({data:{session:{user:{id:identity},expires_at:expiry,access_token:identity}}})}};
  const remote = remoteStore(client,{url:'http://localhost',key:'sb_publishable_fixture'},a,life.signal);
  try {
    const legacy = 'safevision:inspection:v1:'+a+':aurea-v03:R01';
    storage.setItem(legacy,JSON.stringify({...data,date:new Date().toISOString()}));
    assert.equal(drafts.read('R01').notes,data.notes);
    assert.equal(draftStore(b,storage).read('R01').date,'');
    const local = drafts.save('R01',{...data,notes:'Offline A'});
    assert.ok(storage.getItem(legacy));
    assert.equal(local.pending,true);
    const clash = await reconcile(remote,'R01',local);
    assert.equal(clash.current.notes,'Remoto atualizado');
    drafts.archive('R01',clash.current);
    const accepted = await reconcile(remote,'R01',local,'local',clash.current);
    assert.equal(accepted.saved.notes,'Offline A');
    assert.equal(accepted.saved.pending,false);
    assert.equal(drafts.backups('R01')[0].notes,'Remoto atualizado');
    assert.equal((await reconcile(remote,'R01',local,'local',clash.current)).conflict,true);
    assert.equal((await reconcile(remote,'R01',local,'cloud',accepted.saved)).saved.notes,'Offline A');
    const other = drafts.save('R02',data);
    assert.equal((await reconcile(remote,'R02',other)).saved.notes,data.notes);
    expiry = 0;
    await assert.rejects(remote.get('R02'),/Sessão/);
    assert.equal(drafts.read('R02').pending,true);
    expiry = Date.now()/1000+3600;
    identity = b;
    await assert.rejects(remote.get('R02'),/Sessão/);
    life.abort();
    await assert.rejects(remote.get('R02'), {name:'AbortError'});
    assert.throws(()=>drafts.save('R02',{...data,status:'inválido'}));
    drafts.clear('R01');
    assert.equal(drafts.read('R01').date,'');
  } finally { globalThis.fetch = realFetch; }
  await use('authenticated',a);
  assert.equal((await query(`delete from ${table} where case_code='R01' returning *`)).rows.length,1);
  await use('authenticated',b);
  assert.equal((await query('select * from '+table)).rows[0].notes,'Teste B');
  await use('anon');
  await assert.rejects(query('select * from '+table),{code:'42501'});
  console.log('PGlite: duas identidades, CRUD, RLS, grants, revisão condicional e sincronização com adaptador HTTP simulado passaram.');
} finally { await database.close(); }
