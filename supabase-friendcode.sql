-- 하루 2 짧은 친구 코드(6글자): SQL Editor 새 쿼리에 붙여 넣고 Run (supabase-friends.sql 다음)
-- 헷갈리는 글자(0·O·1·I) 없이 6글자. 방마다 하나, 서버가 만들어 줌

create or replace function public.gen_friend_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6);
$$;
alter table public.rooms add column if not exists short_code text unique default public.gen_friend_code();

-- 코드를 넣은 사람이 부름 → 서로 친구, 친구의 id 를 돌려줌 (없으면 null)
create or replace function public.add_friend_code(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare friend uuid;
begin
  -- 입력 이름 code 가 rooms.code 칸과 겹쳐서 함수 이름으로 가리킴
  select r.user_id into friend from public.rooms r where r.short_code = upper(replace(trim(add_friend_code.code), '-', ''));
  if auth.uid() is null or friend is null or friend = auth.uid() then return null; end if;
  insert into public.friendships (user_id, friend_id) values (auth.uid(), friend), (friend, auth.uid()) on conflict do nothing;
  return friend;
end $$;
revoke all on function public.add_friend_code(text) from public, anon;
grant execute on function public.add_friend_code(text) to authenticated;
