-- UIG Nexus: schema checksum. Paste into Supabase -> SQL Editor -> Run.
-- Read-only: it only looks at the catalog, it changes nothing.
-- The TOTAL row should read 1292 | ce912d68e769fd500251549e250538f8,
-- which is what the live production database returns for the same query.
-- If it doesn't, the per-part rows show where the difference is. Expected:
--   col 540 fbdd6894 | con 207 d482acb0 | enum 4 8508ab1e | fn 11 419ae2d9
--   fngrant 11 9c61f192 | grant 183 20d9f71b | idx 88 8e321f07
--   pol 163 66dae5da | rel 61 693e6528 | trg 24 2cc486d8
with t as (
  select c.oid, n.nspname s, c.relname r, c.relkind k, c.relrowsecurity rls, c.relforcerowsecurity frls
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private') and c.relkind in ('r','v','m','p')
), lines as (
  select 'rel '||s||'.'||r||' kind='||k::text||' rls='||rls||' force='||frls as l from t
  union all
  select 'col '||t.s||'.'||t.r||'.'||a.attname||' '||format_type(a.atttypid,a.atttypmod)
         ||case when a.attnotnull then ' NN' else '' end
         ||coalesce(' DEF='||pg_get_expr(d.adbin,d.adrelid),'')
         ||case when a.attgenerated<>'' then ' GEN' else '' end
  from t join pg_attribute a on a.attrelid=t.oid and a.attnum>0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
  union all
  select 'con '||t.s||'.'||t.r||' '||co.conname||' '||pg_get_constraintdef(co.oid)
  from t join pg_constraint co on co.conrelid=t.oid
  union all
  select 'idx '||schemaname||'.'||tablename||' '||indexname||' '||indexdef from pg_indexes where schemaname in ('public','private')
  union all
  select 'pol '||schemaname||'.'||tablename||' '||policyname||' '||cmd||' '||permissive||' roles='||array_to_string(roles,',')
         ||' q='||coalesce(md5(qual),'-')||' wc='||coalesce(md5(with_check),'-')
  from pg_policies where schemaname in ('public','private','storage')
  union all
  select 'fn '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||') -> '||pg_get_function_result(p.oid)
         ||' secdef='||p.prosecdef||' vol='||p.provolatile::text||' cfg='||coalesce(array_to_string(p.proconfig,','),'-')||' src='||md5(p.prosrc)
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')
  union all
  select 'trg '||n.nspname||'.'||c.relname||' '||tg.tgname||' '||md5(pg_get_triggerdef(tg.oid))
  from pg_trigger tg join pg_class c on c.oid=tg.tgrelid join pg_namespace n on n.oid=c.relnamespace
  where not tg.tgisinternal and n.nspname in ('public','private','auth','storage')
  union all
  select 'enum '||t2.typname||' '||string_agg(e.enumlabel, ',' order by e.enumsortorder)
  from pg_type t2 join pg_enum e on e.enumtypid=t2.oid join pg_namespace n on n.oid=t2.typnamespace
  where n.nspname='public' group by t2.typname
  union all
  select 'view '||schemaname||'.'||viewname||' '||md5(definition) from pg_views where schemaname in ('public','private')
  union all
  select 'bucket '||id||' public='||public from storage.buckets
  union all
  select 'pub '||schemaname||'.'||tablename from pg_publication_tables where pubname='supabase_realtime'
  union all
  select 'grant '||table_schema||'.'||table_name||' '||grantee||' '||string_agg(privilege_type, ',' order by privilege_type)
  from information_schema.role_table_grants
  where table_schema in ('public','private') and grantee in ('anon','authenticated','service_role')
  group by table_schema, table_name, grantee
  union all
  select 'fngrant '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||') anon='||has_function_privilege('anon',p.oid,'EXECUTE')
         ||' auth='||has_function_privilege('authenticated',p.oid,'EXECUTE')
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')
),
f as (select l from lines where l not like 'trg storage.%' and l not like 'bucket %')
select split_part(l,' ',1) as part, count(*) as items, left(md5(string_agg(l, E'\n' order by l collate "C")),8) as checksum
from f group by 1
union all
select 'TOTAL', count(*), md5(string_agg(l, E'\n' order by l collate "C")) from f
order by 1
