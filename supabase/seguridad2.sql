-- PETACA · Seguridad y avisos (octubre 2026).
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez sin problema.

-- 1) Permisos mínimos. Sin sesión (anon) solo se pueden reportar errores; con sesión, solo lo que usa la página.
--    Las tablas internas (avisos enviados, cupo de la IA, Telegram, intentos de entrada) quedan solo para las funciones.
revoke all on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
grant insert on public.errores to anon, authenticated;
grant select, insert, update, delete on public.panel_state to authenticated;
grant select, insert, update on public.profiles to authenticated;
revoke all on public.avisos_enviados, public.ia_uso, public.tg_chat from authenticated;

-- 2) Clave propia de Gemini: se puede guardar, cambiar o borrar, pero la página ya no la puede volver a leer entera.
--    Para mostrar "termina en …", ia_clave_fin() devuelve solo los últimos 4 caracteres de la clave propia.
revoke all on public.ia_claves from authenticated;
grant insert, update, delete on public.ia_claves to authenticated;
grant select (user_id, updated_at) on public.ia_claves to authenticated;
create or replace function public.ia_clave_fin()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select right(clave, 4) from public.ia_claves where user_id = auth.uid()
$$;
revoke execute on function public.ia_clave_fin() from public, anon;
grant execute on function public.ia_clave_fin() to authenticated;

-- 3) Errores: como mucho 30 reportes por minuto entre todos, para que nadie llene la tabla.
create index if not exists errores_creado on public.errores (creado);
create or replace function public.errores_tope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.errores where creado > now() - interval '1 minute') >= 30 then
    raise exception 'Demasiados reportes de error en un minuto';
  end if;
  return new;
end
$$;
drop trigger if exists errores_tope on public.errores;
create trigger errores_tope before insert on public.errores for each row execute function public.errores_tope();

-- 4) Entrar con usuario: lo hace la función "entrar" del lado del servidor (el email nunca llega a la página).
--    Después de 5 intentos fallidos con el mismo usuario en 15 minutos, ese usuario queda frenado 15 minutos.
create table if not exists public.login_intentos (
  usuario text primary key,
  fallos int not null default 0,
  desde timestamptz not null default now(),
  hasta timestamptz
);
alter table public.login_intentos enable row level security;
revoke all on public.login_intentos from anon, authenticated;
create or replace function public.login_fallo(u text)
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into public.login_intentos as li (usuario, fallos, desde) values (u, 1, now())
  on conflict (usuario) do update set
    fallos = case when li.desde < now() - interval '15 minutes' then 1 else li.fallos + 1 end,
    desde = case when li.desde < now() - interval '15 minutes' then now() else li.desde end,
    hasta = case
      when (case when li.desde < now() - interval '15 minutes' then 1 else li.fallos + 1 end) >= 5
      then now() + interval '15 minutes' else li.hasta end
  returning hasta;
$$;
revoke execute on function public.login_fallo(text) from public, anon, authenticated;

-- 5) Telegram: el chat se vincula con un link (t.me/bot?start=código) que abre la propia persona, así nadie puede
--    mandar sus avisos al chat de otro. Los chats que ya estaban cargados siguen andando (quedan como vinculados).
create table if not exists public.tg_chats (
  user_id uuid primary key references auth.users on delete cascade,
  chat_id bigint not null,
  creado timestamptz not null default now()
);
alter table public.tg_chats enable row level security;
revoke all on public.tg_chats from anon, authenticated;
create table if not exists public.tg_vinculos (
  token text primary key,
  user_id uuid not null references auth.users on delete cascade,
  expira timestamptz not null
);
alter table public.tg_vinculos enable row level security;
revoke all on public.tg_vinculos from anon, authenticated;
insert into public.tg_chats (user_id, chat_id)
select user_id, (data->'cfg'->>'TGCHAT')::bigint
from public.panel_state
where coalesce(data->'cfg'->>'TGCHAT', '') ~ '^-?[0-9]{5,15}$'
on conflict (user_id) do nothing;

-- 6) Avisos en el celular (notificaciones push): cada dispositivo que los activa guarda su suscripción.
create table if not exists public.push_subs (
  endpoint text primary key check (char_length(endpoint) between 20 and 1000),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null check (char_length(p256dh) between 40 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  creado timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "push_subs: solo el dueño" on public.push_subs;
create policy "push_subs: solo el dueño" on public.push_subs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
revoke all on public.push_subs from anon, authenticated;
grant select, insert, update, delete on public.push_subs to authenticated;

-- 7) Al final, cuando la página nueva ya está publicada: la función vieja que devolvía el email de un usuario se borra.
drop function if exists public.login_email(text);

-- El cron de avisos manda una clave (guardada en Vault con el nombre avisos_cron_secret) que la función "avisos" exige:
--   select cron.alter_job(1, command := $c$ select net.http_post(
--     url := 'https://jrsjnmutdnzuxqimroaa.supabase.co/functions/v1/avisos',
--     headers := jsonb_build_object('Content-Type', 'application/json',
--       'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_cron_secret')),
--     body := '{}'::jsonb) $c$);
