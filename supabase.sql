-- 하루 2 서버 저장: Supabase 대시보드 → SQL Editor 에 붙여 넣고 Run
-- 사람마다 한 줄. 저장값(캐릭터·방·기록)을 통째로 jsonb 로. 본인 줄만 읽고 쓰기 (익명 로그인도 authenticated 역할)

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null check (pg_column_size(data) < 1000000),   -- 한 사람 1MB 까지 (몇 년치 기록도 충분)
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "본인 저장값 읽기" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "본인 저장값 만들기" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "본인 저장값 고치기" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "본인 저장값 지우기" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);
