-- 하루 2 AI 대답 횟수 제한: SQL Editor 에 붙여 넣고 Run (supabase.sql 다음)
-- 사람마다 하루에 몇 번 썼는지. 표는 직접 못 건드리고(정책 없음), 아래 함수로만 1씩 올림

create table if not exists public.ai_uses (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_uses enable row level security;

create or replace function public.bump_ai_use() returns int
language sql security definer set search_path = public as $$
  insert into public.ai_uses (user_id, day, count) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_uses.count + 1
  returning count;
$$;
revoke all on function public.bump_ai_use() from public, anon;
grant execute on function public.bump_ai_use() to authenticated;
