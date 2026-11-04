-- Execute no SQL Editor do projeto Supabase existente.
-- Não altera as medições da tabela tendencia_notas.
-- Depende da função public.is_admin() já criada em supabase/setup.sql.

create table if not exists public.dashboard_card_config (
  card_key text primary key check (card_key in ('geral', 'amarela', 'vermelha', 'nd')),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 80),
  complemento text not null default '' check (char_length(complemento) <= 180),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_card_config enable row level security;

drop policy if exists "Leitura publica configuracao cards" on public.dashboard_card_config;
create policy "Leitura publica configuracao cards" on public.dashboard_card_config
for select to anon, authenticated using (true);

drop policy if exists "Admin insere configuracao cards" on public.dashboard_card_config;
create policy "Admin insere configuracao cards" on public.dashboard_card_config
for insert to authenticated with check (public.is_admin());

drop policy if exists "Admin atualiza configuracao cards" on public.dashboard_card_config;
create policy "Admin atualiza configuracao cards" on public.dashboard_card_config
for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.dashboard_card_config (card_key, titulo, complemento) values
  ('geral', 'Meta', 'para atingir a meta de 85%'),
  ('amarela', 'Redução Notas Amarelas', ''),
  ('vermelha', 'Redução Notas Vermelhas', ''),
  ('nd', 'Redução Notas ND', '')
on conflict (card_key) do nothing;
