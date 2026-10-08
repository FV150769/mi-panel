-- Medidas de "Contale a Petaca": cuánto tardó cada nota, por qué camino se entendió (al instante, con la IA o sin IA)
-- y qué hizo la persona con lo que entendió (guardó, corrigió, quitó o descartó). No se guarda el texto de la nota
-- ni quién la escribió. Se agregan desde la página; nadie las puede leer desde ahí: se miran en el Table Editor.
create table if not exists public.notas_medidas (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  version text check (char_length(version) <= 20),
  via text check (char_length(via) <= 20),
  audio boolean not null default false,
  ms integer check (ms between 0 and 600000),
  prep integer check (prep between 0 and 600000),
  ia integer check (ia between 0 and 600000),
  modelo text check (char_length(modelo) <= 60),
  pasos text check (char_length(pasos) <= 200),
  items smallint check (items between 0 and 100),
  resultado text check (char_length(resultado) <= 20),
  editados smallint check (editados between 0 and 100),
  quitados smallint check (quitados between 0 and 100)
);
alter table public.notas_medidas enable row level security;
drop policy if exists "notas_medidas: con sesión se pueden agregar" on public.notas_medidas;
create policy "notas_medidas: con sesión se pueden agregar" on public.notas_medidas
  for insert to authenticated
  with check (true);
revoke all on public.notas_medidas from anon, authenticated;
grant insert on public.notas_medidas to authenticated;

-- Para ver cómo vienen las notas de la última semana:
-- select via, count(*) as notas, round(avg(ms)) as ms_promedio, percentile_disc(0.9) within group (order by ms) as ms_p90,
--        round(100.0 * count(*) filter (where resultado = 'guardo' and editados = 0 and quitados = 0) / count(*)) as pct_bien
-- from public.notas_medidas where creado > now() - interval '7 days' group by via order by notas desc;
