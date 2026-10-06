-- PETACA · Grupo 1: clave de Gemini por usuario, límite diario con la clave compartida y registro de errores.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez sin problema.

-- 1) Clave de Gemini propia (opcional). Cada usuario solo ve y cambia la suya.
create table if not exists public.ia_claves (
  user_id uuid primary key references auth.users on delete cascade,
  clave text not null check (char_length(clave) between 20 and 200),
  updated_at timestamptz not null default now()
);
alter table public.ia_claves enable row level security;
drop policy if exists "ia_claves: solo el dueño" on public.ia_claves;
create policy "ia_claves: solo el dueño" on public.ia_claves
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Cuántas notas usó cada uno por día con la clave compartida.
--    Sin políticas: solo la Edge Function (con la service role) lo lee y lo suma.
create table if not exists public.ia_uso (
  user_id uuid not null references auth.users on delete cascade,
  dia date not null,
  n int not null default 0,
  primary key (user_id, dia)
);
alter table public.ia_uso enable row level security;

create or replace function public.ia_sumar(uid uuid, d date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.ia_uso (user_id, dia, n) values (uid, d, 1)
  on conflict (user_id, dia) do update set n = public.ia_uso.n + 1
  returning n;
$$;
revoke execute on function public.ia_sumar(uuid, date) from public, anon, authenticated;

-- 3) Errores que ven los usuarios: la página los guarda sola para que los puedas revisar.
--    Se pueden agregar (con o sin sesión) pero nadie los puede leer desde la página: se miran en el Table Editor.
create table if not exists public.errores (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  user_id uuid default auth.uid(),
  mensaje text not null check (char_length(mensaje) <= 500),
  detalle text check (char_length(detalle) <= 4000),
  version text check (char_length(version) <= 20),
  dispositivo text check (char_length(dispositivo) <= 300),
  pagina text check (char_length(pagina) <= 300)
);
alter table public.errores enable row level security;
drop policy if exists "errores: cualquiera puede reportar" on public.errores;
create policy "errores: cualquiera puede reportar" on public.errores
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Para revisar los errores más nuevos:
-- select creado, mensaje, detalle, version, dispositivo from public.errores order by creado desc limit 50;
