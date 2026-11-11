// 하루 2 마을: 공원·가게·게시판·친구 집. app.js 다음에 불러옴.
// 친구 방은 서버 없이 코드(글자)로 주고받는다. 코드에는 방·캐릭터만 들어가고 잠·식사 기록은 안 들어간다.

const fmtDay = key => { const [, m, d] = key.split('-').map(Number); return `${m}월 ${d}일`; };
const fill = (s, map) => s.replace(/\{(\w)\}/g, (_, k) => map[k] ?? '');
const friendNow = f => activityFor(f.room, TODAY, hourNow(), tick);

// ── 만남 ──
const me = () => ({seed:state.seed, born:state.born});
// 친구별 그날 만남. 친구를 알게 된 날(at) 이후만
const meetOf = (f, date) => date >= f.at ? meetingOn(me(), f.room, date) : null;
const metToday = f => meetsNow(hourNow()) ? meetOf(f, TODAY) : null;
// 최근 만남 목록 (오늘은 낮부터), 최근 것 먼저
function recentMeets(days = 7){
  return Array.from({length:days}, (_, i) => addDays(TODAY, -i)).flatMap(date =>
    state.friends.map(f => ({f, date, ev:date === TODAY ? metToday(f) : meetOf(f, date)})).filter(x => x.ev));
}
const meetLine = (x, reg = register()) => fill((x.date === TODAY ? x.ev.now : x.ev.past)[reg], {r:withRang(x.f.room.name)});
// 친구별 처음 만난 날 (기억에 쓰임). ponytail: 최대 60일만 거슬러 봄
const firstMeet = f => { for (let d = f.at; d <= TODAY && daysBetween(f.at, d) < 60; d = addDays(d, 1)) if (d === TODAY ? metToday(f) : meetOf(f, d)) return d; return null; };

// ── 마을 거리: 건물을 눌러 들어간다. 오늘 거리에서 만난 친구가 같이 서 있다 ──
const TOWN_SPOTS = [{x:42, y:86}, {x:58, y:87}, {x:74, y:86}];   // 보도 위 (%)
function drawTown(){
  const time = timeOf(hourNow()), key = seasonOf(TODAY);
  const here = state.friends.filter(f => metToday(f)?.place === 'town').slice(0, 2);
  const walking = state.friends.filter(f => friendNow(f) === 'walk' || metToday(f)?.place === 'park');
  const shopSub = state.shopDay === TODAY ? '오늘 물건은 받아 왔어요' : shopItem(state, TODAY) ? '가게에 오늘의 물건이 있어요' : '';
  $('townArt').innerHTML = `<div class="scene__base">${townScene(key, time)}</div>
    ${[state, ...here.map(f => f.room)].map((c, i) => `<div class="actor actor--static" style="--x:${TOWN_SPOTS[i].x};--y:${TOWN_SPOTS[i].y}"><div class="char">${avatar(c.look, {shadow:false})}</div></div>`).join('')}
    <div class="night" data-time="${time}"></div>`;
  const meets = recentMeets(1);
  $('townBody').innerHTML = `
    <p class="town-hint">${esc(here.length ? meetLine({f:here[0], date:TODAY, ev:metToday(here[0])}) : walking.length ? `${walking.length > 1 ? `${walking[0].room.name} 외 ${walking.length - 1}명이` : josa(walking[0].room.name, '이가')} 공원에 나와 있어요` : shopSub || '건물을 눌러 들어가 봐요')}</p>
    ${meets.length ? `<p class="sec">오늘</p>${meets.map(x => `<p class="life">${esc(state.name)} · ${esc(x.f.room.name)} — ${x.ev.feed}</p>`).join('')}` : ''}
    <p class="sec">친구 집</p>
    ${state.friends.length ? state.friends.map(f => `<button type="button" class="friend-row" data-friend="${f.room.seed}">
        <span class="friend-row__av thumb">${avatar(f.room.look, {crop:'face'})}</span>
        <span class="friend-row__t"><b>${esc(f.room.name)}</b><span class="sub">${metToday(f) ? '오늘 같이 놀았어요' : NOW_TEXT[friendNow(f)]}</span></span><span aria-hidden="true">›</span></button>`).join('')
      : '<p class="sub">친구에게 내 방 코드를 보내 보세요</p>'}
    <div class="chips"><button type="button" class="chip" id="myCodeBtn">내 방 코드 보내기</button><button type="button" class="chip" id="codeInBtn">받은 코드 넣기</button></div>`;
}
function goPlace(place){
  if (place === 'park') openPark();
  if (place === 'shop'){ drawShop(); $('shopSheet').showModal(); }
  if (place === 'board'){ drawBoard(); $('boardSheet').showModal(); }
}
$('townBtn').onclick = () => { drawTown(); $('townPage').showModal(); };
$('townArt').onclick = e => { const g = e.target.closest('[data-place]'); if (g) goPlace(g.dataset.place); };
$('townBody').onclick = e => {
  const fr = e.target.closest('[data-friend]'); if (fr) openFriend(+fr.dataset.friend);
  if (e.target.closest('#myCodeBtn')) openCode('내 방 코드', toCode('room', roomData(state, myKinds())), '친구가 이 링크를 열거나 코드를 넣으면 내 방에 놀러 와요. 서로 코드를 넣으면 캐릭터끼리 마을에서 만나요');
  if (e.target.closest('#codeInBtn')){ $('codeInBox').value = ''; $('codeIn').returnValue = ''; $('codeIn').showModal(); }
};

// ── 공원: 계절이 바뀌고, 오늘 만난 친구와 같이 있다 ──
const PARK_ACTS = Object.keys(PARK_SPOTS);
const WALKER_SPOTS = [{x:86, y:97}, {x:12, y:96}];
function drawPark(){
  const key = seasonOf(TODAY), time = timeOf(hourNow()), R = PARK[register()];
  const date = state.friends.find(f => metToday(f)?.place === 'park');
  const ev = date && metToday(date);
  const act = VN_SPOT[vnNode] ?? PARK_ACTS[hash(`${state.seed}|park|${tick}`) % PARK_ACTS.length];   // 고른 곳으로
  const mine = ev && !VN_SPOT[vnNode] ? ev.pair[0] : PARK_SPOTS[act];
  const walkers = state.friends.filter(f => f !== date && friendNow(f) === 'walk').slice(0, WALKER_SPOTS.length);
  const line = vnLine ?? (ev ? meetLine({f:date, date:TODAY, ev})
    : walkers.length && talk % 2 ? fill(R.friend, {n:walkers[0].room.name}) : fill(R[act][talk % R[act].length], {s:SEASONS[key].label}));
  const actor = (look, at, id = '') => `<div class="actor actor--static${id && act === 'swing' ? ' actor--swing' : ''}${id && vnNode === 'swing2' ? ' actor--high' : ''}" style="--x:${at.x};--y:${at.y}">${id
    ? `<button type="button" class="char" id="${id}" aria-label="${esc(state.name)} 쓰다듬기">` : '<div class="char">'}${avatar(look, {shadow:false})}${id ? '</button>' : '</div>'}</div>`;
  $('parkScene').innerHTML = `<div class="scene__base">${parkScene(key, time)}</div>
    ${walkers.map((f, i) => actor(f.room.look, WALKER_SPOTS[i])).join('')}
    ${ev ? actor(date.room.look, ev.pair[1]) : ''}
    ${actor(state.look, mine, 'parkChar')}
    <p class="bubble bubble--static" style="--x:${mine.x};--y:${mine.y}">${esc(line)}</p>
    <div class="night" data-time="${time}"></div>`;
  const names = [...(date ? [date] : []), ...walkers].map(f => f.room.name);
  drawVn(names);
}
// 미연시처럼: 아래 대화창에 장면 한 줄 + 고르기. 고르면 캐릭터가 그 자리로
// root → 벤치에 앉는다(bench → 하늘을 본다 sky) / 공원을 둘러본다(look → 줍기, 하루 한 번) / 집에 간다
let vnNode = 'root', vnLine = null;
const VN_SPOT = {root:'walk', bench:'bench', sky:'sky', swing:'swing', swing2:'swing', look:'leaf', picked:'leaf', seen:'leaf'};
const vnOpt = (go, label) => `<button type="button" class="vn__opt" data-vn="${go}">${label}</button>`;
function drawVn(names){
  const it = pickOn(state, TODAY), took = state.picks.find(p => p.date === TODAY);
  const node = vnNode === 'look' && state.parkDay === TODAY ? 'seen' : vnNode;
  const [text, opts] = {
    root:[`${SEASONS[seasonOf(TODAY)].label} 공원이에요.${names.length ? ` ${names.join(', ')}도 나와 있어요.` : ''}`,
      [vnOpt('bench', '벤치에 앉는다'), vnOpt('swing', '그네를 탄다'), vnOpt('look', '공원을 둘러본다'), vnOpt('home', '집에 간다')]],
    bench:['벤치에 앉았다. 바람이 분다.', [vnOpt('sky', '하늘을 본다'), vnOpt('root', '일어난다')]],
    sky:['구름이 천천히 지나간다.', [vnOpt('root', '일어난다')]],
    swing:['그네에 앉았다. 발을 구르니 조금씩 흔들린다.', [vnOpt('swing2', '더 높이 탄다'), vnOpt('root', '내린다')]],
    swing2:['발끝에 하늘이 닿을 것 같다.', [vnOpt('root', '내린다')]],
    look:[it.see, [vnOpt('take', `${josa(it.name, ['을', '를'])} 주워 간다`), vnOpt('leave', '그냥 둔다')]],
    picked:[took ? `${josa(PICK_BY_ID[took.id].name, ['을', '를'])} 책상 위 병에 넣었다.` : '그 자리에 두고 왔다.', [vnOpt('root', '더 걷는다'), vnOpt('home', '집에 간다')]],
    seen:[took ? `오늘 주운 ${PICK_BY_ID[took.id].name}, 책상 위 병에 있다.` : '오늘은 천천히 걷기만 했다.', [vnOpt('root', '돌아간다')]],
  }[node];
  $('parkVn').innerHTML = `<p class="vn__t">${esc(text)}</p><div class="vn__opts">${opts.join('')}</div>`;
}
$('parkVn').onclick = e => {
  const go = e.target.closest('[data-vn]')?.dataset.vn; if (!go) return;
  if (go === 'home'){ $('parkPage').close(); return; }
  if (go === 'take' || go === 'leave'){
    if (state.parkDay === TODAY) return;
    const it = pickOn(state, TODAY), take = go === 'take';
    state = {...state, parkDay:TODAY, picks:take ? [...state.picks, {id:it.id, date:TODAY}] : state.picks};
    vnLine = PARK_TALK[register()][take ? 'take' : 'leave'];
    vnNode = 'picked'; render(); drawPark(); return;
  }
  vnNode = go; vnLine = null; talk++; drawPark();
};
function openPark(){ vnNode = 'root'; vnLine = null; drawPark(); if (!$('parkPage').open) $('parkPage').showModal(); }
$('parkScene').onclick = e => { if (e.target.closest('#parkChar')){ talk++; drawPark(); } };
// 공원에서 같이 돌아오면 집에 있다
$('parkPage').onclose = () => { if (nowActivity() === 'walk') doFor('wander', 60000); greeted = true; say(pick(lines().poke)); render(); };

// ── 가게: 재화 없이 하루 하나, 아직 없는 물건 ──
function drawShop(){
  const key = shopItem(state, TODAY);
  if (state.shopDay === TODAY){ $('shopBody').innerHTML = '<p class="sub">오늘 물건은 받아 왔어요. 내일 또 들러요</p>'; return; }
  if (!key){ $('shopBody').innerHTML = '<p class="sub">가게 물건을 다 모았어요</p>'; return; }
  const {p, k, name} = itemOf(key);
  $('shopBody').innerHTML = `<p class="sub" style="margin-top:-8px">오늘의 물건</p>
    <div class="shop-item"><span class="pcard__img">${kindArt(p, k)}</span><b>${esc(name)} ${p.name}</b></div>
    <button type="button" class="primary" id="shopTake">받아 오기</button>`;
}
$('shopBody').onclick = e => {
  if (!e.target.closest('#shopTake')) return;
  const key = shopItem(state, TODAY); if (!key) return;
  gainItem(key);
  state = {...state, shopDay:TODAY};
  reply = null; drawShop(); render();
  setTimeout(() => { say(SHOP_LINE[register()]); render(); }, 4000);   // 새 소품 알림 다음에
};

// ── 게시판: 캐릭터들 소식(만남) + 받은 인사 + 오늘의 소식 ──
function drawBoard(){
  const news = [...NEWS[seasonOf(TODAY)], ...NEWS.all];
  const meets = recentMeets(7).map(x => ({date:x.date, who:`${esc(state.name)} · ${esc(x.f.room.name)}`, text:x.ev.feed}));
  const mail = state.mail.map(m => ({date:m.date, who:esc(m.from), text:GREETS[m.greet] + (m.item ? ` · 선물 ${esc(itemOf(m.item).name)} ${itemOf(m.item).p.name}` : '')}));
  const feed = [...meets, ...mail].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  $('boardBody').innerHTML = `<p class="life" style="margin-top:0">${news[hash(TODAY) % news.length]}</p>
    <p class="sec">마을 소식</p>
    ${feed.length ? feed.map(x => `<div class="row"><div class="row__h"><span>${x.who}</span><span class="num">${x.date === TODAY ? '오늘' : fmtDay(x.date)}</span></div><p class="sub"><b>${x.text}</b></p></div>`).join('')
      : '<p class="sub">친구와 서로 방 코드를 넣으면 캐릭터끼리 만나요</p>'}`;
}

// ── 친구 방 ──
let friendSel = null;
const GUEST = {x:38, y:97}, GUEST_RIGHT = {x:80, y:97};   // 놀러 간 내 캐릭터 자리
function drawFriend(){
  const f = state.friends.find(x => x.room.seed === friendSel); if (!f) return;
  const r = f.room, act = friendNow(f), info = ACTIVITIES[act], spot = info.spot ? SPOTS[info.spot === 'wander' && tick % 2 ? 'wander2' : info.spot] : null;
  const FL = LINES[r.personality], mine = talk % 2 === 1;
  const last = recentMeets(3).find(x => x.f === f);   // 친구 입장에서: 「(내 이름)이랑 ~했어」
  const line = !spot ? `${josa(r.name, '은는')} 공원에 산책 갔어요`
    : mine ? pick(VISIT_LINE[register()]) : talk % 4 === 0 ? pick(FL.hello[timeOf(hourNow())])
    : last && talk % 4 === 2 ? fill((last.date === TODAY ? last.ev.now : last.ev.past)[PERSONALITIES[r.personality].register], {r:withRang(state.name)}) : pick(FL.doing[act]);
  const guest = !spot || (spot.x < 55 && spot.y > 80) ? GUEST_RIGHT : GUEST;   // 친구가 앞쪽 가운데거나 쪽지가 있으면 비켜 선다
  const at = mine || !spot ? guest : spot;
  $('friendTitle').textContent = `${r.name}네 방`;
  $('friendScene').innerHTML = `<div class="scene__base">${sceneBase({kinds:r.kinds})}</div>
    ${spot ? `<div class="actor actor--static ${spot.lying ? 'is-lying' : ''}" style="--x:${spot.x};--y:${spot.y}"><div class="char">${avatar(r.look, {sleepy:act === 'nap', shadow:false})}</div><span class="held">${heldArt(info.held)}</span></div>`
      : `<span class="note" style="pointer-events:none">${NOTE}</span>`}
    <div class="actor actor--static" style="--x:${guest.x};--y:${guest.y}"><div class="char">${avatar(state.look, {shadow:false})}</div></div>
    <button type="button" class="bubble bubble--static" id="friendBubble" style="--x:${at.x};--y:${at.y}">${esc(line)}</button>`;
}
function openFriend(seed){ friendSel = seed; talk = talk - talk % 4; drawFriend(); if (!$('friendPage').open) $('friendPage').showModal(); }
$('friendScene').onclick = e => { if (e.target.closest('#friendBubble')){ talk++; drawFriend(); } };
$('unfriendBtn').onclick = () => {
  const f = state.friends.find(x => x.room.seed === friendSel);
  if (!f || !confirm(`${f.room.name}네 집을 목록에서 지울까요? 코드를 다시 넣으면 또 갈 수 있어요`)) return;
  state = {...state, friends:state.friends.filter(x => x !== f)};
  $('friendPage').close(); render(); if ($('townPage').open) drawTown();
};

// ── 인사 남기기: 정해진 인사 + 선물 하나 (자유 글은 없음) ──
let greetDraft = {g:0, it:null};
function drawGreet(){
  const f = state.friends.find(x => x.room.seed === friendSel);
  $('greetTitle').textContent = `${f.room.name}에게 인사`;
  $('greetChips').innerHTML = GREETS.map((g, i) => `<button type="button" class="chip" data-greet="${i}" aria-pressed="${i === greetDraft.g}">${g}</button>`).join('');
  $('giftGrid').innerHTML = [...owned()].map(key => { const {p, k, name} = itemOf(key);
    return `<button type="button" class="pcard" data-gift="${key}" aria-pressed="${key === greetDraft.it}"><span class="pcard__img">${kindArt(p, k)}</span><b>${esc(name)}</b></button>`; }).join('');
}
$('greetBtn').onclick = () => { greetDraft = {g:0, it:null}; drawGreet(); $('greetSheet').showModal(); };
$('greetSheet').onclick = e => {
  const g = e.target.closest('[data-greet]'); if (g){ greetDraft = {...greetDraft, g:+g.dataset.greet}; drawGreet(); }
  const it = e.target.closest('[data-gift]'); if (it){ greetDraft = {...greetDraft, it:greetDraft.it === it.dataset.gift ? null : it.dataset.gift}; drawGreet(); }
  if (!e.target.closest('#greetMake')) return;
  const f = state.friends.find(x => x.room.seed === friendSel);
  const code = toCode('gift', {f:state.name, s:state.seed, t:f.room.seed, g:greetDraft.g, it:greetDraft.it, d:TODAY, r:Math.floor(Math.random()*1e6)});
  $('greetSheet').close();
  openCode(`${f.room.name}에게 보낼 인사`, code, '친구가 링크를 열거나 「받은 코드 넣기」에 붙여 넣으면 전해져요. 선물은 내 방에서도 그대로 있어요');
};

// ── 코드 보내기·받기 ──
const canLink = () => location.protocol.startsWith('http');
const linkOf = code => canLink() ? `${location.origin}${location.pathname}?code=${code}` : code;
function openCode(title, code, help){
  $('codeTitle').textContent = title; $('codeHelp').textContent = help;
  $('codeBox').value = linkOf(code);
  $('codeShare').hidden = !navigator.share || !canLink();
  $('codeSheet').returnValue = ''; $('codeSheet').showModal();
}
$('codeCopy').onclick = async () => {
  try { await navigator.clipboard.writeText($('codeBox').value); showToast('복사했어요. 친구에게 보내 주세요'); }
  catch (err){ console.warn('복사 실패', err); $('codeBox').select(); showToast('글자를 길게 눌러 복사해 주세요'); }
};
$('codeShare').onclick = async () => {
  try { await navigator.share({title:'하루 2', text:`${state.name}에게서 온 하루 2 코드`, url:$('codeBox').value}); }
  catch (err){ if (err.name !== 'AbortError') { console.warn('공유 실패', err); showToast('공유하지 못했어요. 복사하기를 써 주세요'); } }
};
$('codeIn').onclose = () => { if ($('codeIn').returnValue === 'ok') takeCode($('codeInBox').value); };

function takeCode(text){
  const r = readCode(text);
  if (!r) return showToast('코드를 읽지 못했어요. 받은 글자를 그대로 붙여 넣어 주세요');
  return r.type === 'room' ? takeRoom(text.match(CODE_RE)[0], r.data) : takeGift(r);
}
function takeRoom(code, room){
  if (room.seed === state.seed) return showToast('내 방 코드예요. 친구에게 보내 주세요');
  const old = state.friends.find(f => f.room.seed === room.seed);
  const entry = {code, at:old?.at ?? TODAY, room};
  state = {...state, friends:old ? state.friends.map(f => f === old ? entry : f) : [...state.friends, entry]};
  render(); if ($('townPage').open) drawTown();
  showToast(old ? `${room.name}네 방이 새로 바뀌었어요` : `${room.name}네 방에 놀러 왔어요. 마을 친구 집에 저장했어요`);
  openFriend(room.seed);
}
function takeGift({data, id}){
  if (data.to !== state.seed) return showToast('다른 친구에게 보낸 인사예요');
  if (state.mail.some(m => m.id === id)) return showToast('이미 받은 인사예요');
  state = {...state, mail:[...state.mail, {id, from:data.from, greet:data.greet, item:data.item, date:TODAY}].slice(-100)};
  const isNew = data.item ? gainItem(data.item) : false;
  const gift = data.item ? ` · 선물 ${itemOf(data.item).name} ${itemOf(data.item).p.name}${isNew ? '' : ' (이미 있어서 마음만 받았어요)'}` : '';
  showToast(`${data.from}: ${GREETS[data.greet]}${gift}`);
  say(GIFT_LINE[register()](data.from), 4000); render(); hop();
}

// 링크로 받은 코드: 주소에서 지우고, 홈이 보이면 한 번 처리
const pendingCode = params.get('code');
if (pendingCode){ const q = new URLSearchParams(location.search); q.delete('code'); history.replaceState(null, '', location.pathname + (q.size ? `?${q}` : '')); }
let codeDone = false;
document.addEventListener('haru:ready', () => { if (pendingCode && !codeDone){ codeDone = true; takeCode(pendingCode); } });

Object.assign(PAGES, {townPage:drawTown, parkPage:drawPark, friendPage:drawFriend});
start();
