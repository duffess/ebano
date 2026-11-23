# Ligar o painel na nuvem (Supabase, plano gratuito)

Sem isso, o painel funciona só no navegador de quem mexeu (bom para demonstração).
Com isso, o dono muda fotos e horários de qualquer lugar e vale para todos os clientes.

1. Crie um projeto em https://supabase.com
2. Em **SQL Editor**, rode:

```sql
create table ebano_config (id int primary key, data jsonb not null default '{}'::jsonb);
insert into ebano_config (id) values (1);
alter table ebano_config enable row level security;
create policy "todos leem" on ebano_config for select using (true);
create policy "dono edita" on ebano_config for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('ebano', 'ebano', true);
create policy "todos veem fotos" on storage.objects for select using (bucket_id = 'ebano');
create policy "dono sobe fotos" on storage.objects for insert to authenticated with check (bucket_id = 'ebano');
```

3. Em **Authentication > Users**, crie o usuário do dono (e-mail e senha).
   Em **Authentication > Sign In / Providers**, desligue "Allow new users to sign up".
4. Em **Project Settings > API**, copie a URL e a chave `anon`.
5. Na Vercel, em **Settings > Environment Variables**, crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   e faça um novo deploy. Localmente, coloque as duas num arquivo `.env.local`.

O painel fica em `/admin`.
