// 친구 실시간 (Supabase): 초대 링크로 서로 친구, 친구 방은 열 때마다 최신, 인사·선물은 서버로 바로 (town.js 다음)
// 서버에 올라가는 건 방 코드(이름·모습·성격·소품)뿐, 기분·잠·식사 기록 X. 서버가 안 되면 지금처럼 코드 방식 — supabase-friends.sql
// ponytail: 열 때·마을 열 때 가져오는 방식 (구독 X). 동시에 보는 실시간이 필요해지면 Supabase Realtime

const FRIEND_REFRESH_MS = 60000;
let lastRoomCode = '', cloudReady = false;
let homeReady_ = state.met && !$('title').open && !$('first').open;   // start() 가 town.js 끝에서 먼저 돌아서, 이미 홈이면 준비된 것
const pendingFriend = params.get('f');
if (pendingFriend){ const q = new URLSearchParams(location.search); q.delete('f'); history.replaceState(null, '', location.pathname + (q.size ? `?${q}` : '')); }
const isUid = s => typeof s === 'string' && /^[0-9a-f-]{36}$/.test(s);

// 내 방이 바뀌면 서버의 내 방도 (cloud.js 의 cloudPush 가 부름)
async function friendSyncRoom(){
  if (!sb || !cloudUser || !state.met) return;
  const code = toCode('room', roomData(state, myKinds()));
  if (code === lastRoomCode) return;
  const {error} = await sb.from('rooms').upsert({user_id:cloudUser.id, code, updated_at:new Date().toISOString()});
  if (error) return console.warn('방 올리기 실패', error);
  lastRoomCode = code;
}
// 친구 방 최신으로 + 받은 인사·선물
async function refreshFriends(){
  if (!sb || !cloudUser || !state.met) return;
  const {data:rooms, error} = await sb.rpc('friend_rooms');
  if (error) return console.warn('친구 방 가져오기 실패', error);
  let friends = state.friends;
  for (const r of rooms ?? []){
    const read = readCode(r.code); if (read?.type !== 'room' || read.data.seed === state.seed) continue;
    const old = friends.find(f => f.uid === r.user_id || f.room.seed === read.data.seed);
    const entry = {code:r.code, at:old?.at ?? TODAY, room:read.data, uid:r.user_id};
    friends = old ? friends.map(f => (f === old ? entry : f)) : [...friends, entry];
  }
  state = {...state, friends:friends.slice(-30)};
  const {data:mail} = await sb.from('mail').select('id, code');
  for (const m of mail ?? []){
    const g = readCode(m.code);
    if (g?.type === 'gift') takeGift(g);   // town.js: 받는 사람 확인·같은 인사 두 번 X
    await sb.from('mail').delete().eq('id', m.id);
  }
  render(); if ($('townPage').open) drawTown();
}
// 친구에게 인사 보내기 → 되면 true (안 되면 town.js 가 코드 방식으로)
async function sendMail(uid, code){
  if (!sb || !cloudUser || !isUid(uid)) return false;
  const {error} = await sb.from('mail').insert({to_user:uid, code});
  if (error){ console.warn('인사 보내기 실패', error); return false; }
  return true;
}
// 초대 링크 (서버가 되면) — town.js 「내 방 초대 링크」
function inviteOpen(){
  if (!cloudUser || !location.protocol.startsWith('http')) return false;
  friendSyncRoom();
  openCode('내 방 초대 링크', '', '친구가 이 링크를 열면 서로 친구가 돼요. 방을 바꾸면 친구 화면에도 바로 바뀌어요');
  $('codeBox').value = `${location.origin}${location.pathname}?f=${cloudUser.id}`;
  return true;
}
// 초대 링크로 들어옴: 첫 시작을 마치고 서버 연결이 되면 친구 추가
async function takeInvite(){
  if (!pendingFriend || !cloudReady || !homeReady_ || !isUid(pendingFriend)) return;
  if (pendingFriend === cloudUser.id) return showToast('내 초대 링크예요. 친구에게 보내 주세요');
  await friendSyncRoom();
  const {data:ok, error} = await sb.rpc('add_friend', {friend:pendingFriend});
  if (error || !ok){ console.warn('친구 추가 실패', error); return showToast('친구 방을 찾지 못했어요. 링크를 다시 받아 주세요'); }
  await refreshFriends();
  const f = state.friends.find(x => x.uid === pendingFriend);
  if (f){ showToast(`${f.room.name}와 친구가 됐어요`); openFriend(f.room.seed); }
}
document.addEventListener('haru:cloud', () => { cloudReady = true; friendSyncRoom().then(refreshFriends).then(takeInvite); });
document.addEventListener('haru:ready', () => { homeReady_ = true; takeInvite(); });
$('townBtn').addEventListener('click', () => refreshFriends());
setInterval(() => { if (!document.hidden) refreshFriends(); }, FRIEND_REFRESH_MS);
