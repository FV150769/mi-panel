-- Seguridad por usuario (RLS): cada persona solo puede leer y modificar sus propios datos.
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez sin problema.

-- Datos del panel
alter table public.panel_state enable row level security;
drop policy if exists "panel_state: solo el dueño" on public.panel_state;
create policy "panel_state: solo el dueño" on public.panel_state
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nombres de usuario
alter table public.profiles enable row level security;
drop policy if exists "profiles: solo el dueño" on public.profiles;
create policy "profiles: solo el dueño" on public.profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Para revisar cómo quedó:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select tablename, policyname, cmd, qual from pg_policies where schemaname = 'public';
