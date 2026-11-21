import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Pass the entry point of PGlite 0.5.17. These fixtures emulate Supabase roles,
// not the Auth service or the PostgREST transport.
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2])).href);
const database = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const migration = new URL('../supabase/migrations/20261121204325_platform_foundation.sql', import.meta.url);
const query = (statement, values = []) => database.query(statement, values);
const use = async (role, user = '') => {
  await database.exec(`reset role; set role ${role};`);
  await query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
};

try {
  await database.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
  `);
  await query('insert into auth.users values ($1), ($2)', [alice, bob]);
  await database.exec(await readFile(migration, 'utf8'));

  await use('authenticated', alice);
  await query("insert into profiles(display_name) values ('Alice')");
  const { rows: [project] } = await query("insert into projects(title) values ('Área de teste') returning id, owner_id");
  assert.equal(project.owner_id, alice);
  assert.equal((await query("update projects set title = 'Revisado' where id=$1 returning id", [project.id])).rows.length, 1);
  assert.equal((await query('select id from project_versions')).rows.length, 2);
  await query('update projects set title = title, description = description where id=$1', [project.id]);
  assert.equal((await query('select id from project_versions')).rows.length, 2);
  await assert.rejects(query("insert into project_versions(project_id,title,description) values ($1,'x','')", [project.id]), { code: '42501' });
  await assert.rejects(query('update projects set owner_id=$1', [bob]), { code: '42501' });
  await assert.rejects(query("update projects set model_object_key='outro/projeto.glb'"), { code: '42501' });

  await use('authenticated', bob);
  assert.equal((await query('select id from projects where id=$1', [project.id])).rows.length, 0);
  assert.equal((await query('select id from profiles')).rows.length, 0);
  assert.equal((await query('select id from project_versions')).rows.length, 0);
  assert.equal((await query("update projects set title='Outra edição' where id=$1 returning id", [project.id])).rows.length, 0);
  assert.equal((await query('delete from projects where id=$1 returning id', [project.id])).rows.length, 0);
  await assert.rejects(query("insert into projects(owner_id,title) values ($1,'x')", [alice]), { code: '42501' });
  assert.equal((await query("insert into projects(title) values ('Projeto próprio') returning owner_id")).rows[0].owner_id, bob);
  await use('anon');
  await assert.rejects(query('select id from projects'), { code: '42501' });

  await use('authenticated', alice);
  assert.equal((await query('delete from projects where id=$1 returning id', [project.id])).rows.length, 1);
  await database.exec('reset role');
  assert.equal((await query('select id from project_versions where project_id=$1', [project.id])).rows.length, 0);
  console.log('RLS validada em PostgreSQL/PGlite: propriedade, CRUD, histórico, isolamento entre usuários e acesso anônimo.');
} finally {
  await database.close();
}
