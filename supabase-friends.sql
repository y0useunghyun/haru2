-- 하루 2 친구 실시간: SQL Editor 에 새 쿼리로 붙여 넣고 Run (supabase.sql·supabase-ai.sql 다음)
-- 방(공개 정보만: 이름·모습·성격·소품 — 기분·잠·식사 기록 X), 친구 관계(서로), 우편함(인사·선물)
-- 친구가 아닌 사람은 방을 못 보고, 인사도 친구에게만 보낼 수 있음

create table if not exists public.rooms (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null check (length(code) < 4000),   -- 앱의 방 코드(H2.…) 그대로. 읽을 때 앱이 형식 검사
  updated_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "내 방 읽기" on public.rooms for select to authenticated using ((select auth.uid()) = user_id);
create policy "내 방 만들기" on public.rooms for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "내 방 고치기" on public.rooms for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.friendships (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friendships enable row level security;
create policy "내 친구 목록" on public.friendships for select to authenticated using ((select auth.uid()) = user_id);
create policy "친구 지우기" on public.friendships for delete to authenticated using ((select auth.uid()) = user_id);

-- 초대 링크를 연 사람이 부름 → 서로 친구 (방이 있는 사람만)
create or replace function public.add_friend(friend uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or friend = auth.uid() or not exists (select 1 from public.rooms where user_id = friend) then return false; end if;
  insert into public.friendships (user_id, friend_id) values (auth.uid(), friend), (friend, auth.uid()) on conflict do nothing;
  return true;
end $$;
-- 내 친구들의 방만
create or replace function public.friend_rooms() returns table (user_id uuid, code text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.user_id, r.code, r.updated_at from public.rooms r
  join public.friendships f on f.friend_id = r.user_id
  where f.user_id = auth.uid();
$$;
revoke all on function public.add_friend(uuid) from public, anon;
grant execute on function public.add_friend(uuid) to authenticated;
revoke all on function public.friend_rooms() from public, anon;
grant execute on function public.friend_rooms() to authenticated;

create table if not exists public.mail (
  id bigint generated always as identity primary key,
  to_user uuid not null references auth.users (id) on delete cascade,
  from_user uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code text not null check (length(code) < 2000),   -- 앱의 인사 코드(G2.…) 그대로
  created_at timestamptz not null default now()
);
alter table public.mail enable row level security;
create policy "친구에게만 보내기" on public.mail for insert to authenticated with check (
  (select auth.uid()) = from_user
  and exists (select 1 from public.friendships f where f.user_id = (select auth.uid()) and f.friend_id = to_user)
);
create policy "받은 것 읽기" on public.mail for select to authenticated using ((select auth.uid()) = to_user);
create policy "받은 것 지우기" on public.mail for delete to authenticated using ((select auth.uid()) = to_user);
