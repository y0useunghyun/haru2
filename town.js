// 하루 2 마을: 공원·가게·게시판·친구 집. app.js 다음에 불러옴.
// 친구 방은 서버 없이 코드(글자)로 주고받는다. 코드에는 방·캐릭터만 들어가고 잠·식사 기록은 안 들어간다.

const season = () => SEASONS[seasonOf(TODAY)];
const fmtDay = key => { const [, m, d] = key.split('-').map(Number); return `${m}월 ${d}일`; };
const fill = (s, map) => s.replace(/\{(\w)\}/g, (_, k) => map[k] ?? '');
const friendNow = f => activityFor(f.room, TODAY, hourNow(), tick);

// ── 그림 ──
const TREE = s => P('0 0 70 100', `<path d="M35 96 V58" stroke-width="5"/><g fill="${s.leaf}">${s === SEASONS.winter
  ? '<path d="M35 10 L58 58 H12Z"/>' : '<circle cx="35" cy="34" r="24"/><circle cx="18" cy="48" r="14"/><circle cx="52" cy="48" r="14"/>'}</g>`);
const BENCH = P('0 0 90 44', '<rect x="4" y="6" width="82" height="10" rx="3" fill="#E8A86A"/><rect x="2" y="20" width="86" height="8" rx="3" fill="#C98B5A"/><path d="M12 28 V42 M78 28 V42" stroke-width="4"/>');
const POND = P('0 0 120 30', '<ellipse cx="60" cy="15" rx="56" ry="12" fill="#BFE3FF"/><path d="M34 14 q6 -4 12 0 M70 18 q6 -4 12 0" stroke="#fff"/>');
// 잔디 위 길 + 계절 흩뿌림 (봄 꽃잎, 여름 꽃, 가을 낙엽, 겨울 눈)
const SCATTER = [[18,30],[44,70],[70,24],[96,86],[120,40],[150,78],[176,28],[188,92],[30,96],[132,100],[84,52],[160,56]];
const SEASON_DOT = {
  spring:(x, y) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#FF9EB8" stroke="none" transform="rotate(30 ${x} ${y})"/>`,
  summer:(x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#FFD23F" stroke="#fff" stroke-width="1.6"/>`,
  autumn:(x, y) => `<path d="M${x} ${y-4} L${x+3} ${y} L${x} ${y+4} L${x-3} ${y}Z" fill="#E8835F" stroke="none"/>`,
  winter:(x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" stroke="#CFD6E0" stroke-width="1"/>`,
};
const parkGround = key => `<svg class="park-ground" viewBox="0 0 200 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <path d="M-10 118 C40 70 120 80 150 40 S200 0 214 -4" fill="none" stroke="${SEASONS[key].ground}" stroke-width="22" stroke-linecap="round"/>
  ${SCATTER.map(([x, y]) => SEASON_DOT[key](x, y)).join('')}</svg>`;
const SKY_CLOUDS = `<span class="fx fx--cloud1">${P('0 0 40 20', '<ellipse cx="16" cy="12" rx="14" ry="7" fill="#fff" stroke="none"/><ellipse cx="26" cy="9" rx="10" ry="7" fill="#fff" stroke="none"/>')}</span>
  <span class="fx fx--cloud2">${P('0 0 40 20', '<ellipse cx="16" cy="12" rx="14" ry="7" fill="#fff" stroke="none"/><ellipse cx="26" cy="9" rx="10" ry="7" fill="#fff" stroke="none"/>')}</span>`;
const PLACE_ICON = {
  park:  s => TREE(s),
  shop:  () => P('0 0 70 70', '<rect x="8" y="26" width="54" height="40" fill="#FFF3D6"/><path d="M4 26 L12 8 H58 L66 26Z" fill="#FF9EB8"/><path d="M22 8 L19 26 M35 8 V26 M48 8 L51 26" stroke="#fff" stroke-width="3"/><rect x="26" y="40" width="18" height="26" fill="#8EC9FF"/>'),
  board: () => P('0 0 70 70', '<path d="M16 50 V68 M54 50 V68" stroke-width="4"/><rect x="6" y="8" width="58" height="42" rx="4" fill="#E8A86A"/><rect x="12" y="14" width="20" height="16" fill="#fff"/><rect x="36" y="16" width="22" height="12" fill="#FFD23F"/><rect x="18" y="33" width="26" height="12" fill="#86D9B9"/>'),
};
function townArt(){
  const s = season(), time = timeOf(hourNow());
  const inner = svg => svg.replace(/<\/?svg[^>]*>/g, '');
  return `<div class="scene__base"><svg class="town-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMax slice" fill="none" stroke="#1E1B18" stroke-width="2" stroke-linejoin="round">
      <rect width="300" height="200" fill="${SKY[time]}" stroke="none"/>
      <path d="M-10 140 Q80 100 160 130 T310 118 V200 H-10Z" fill="${s.grass}"/>
      <rect x="-4" y="160" width="308" height="44" fill="${s.ground}"/>
      <g transform="translate(232 62) scale(.9)">${inner(TREE(s))}</g>
      <g transform="translate(196 50) scale(1.1)">${inner(TREE(s))}</g>
      <g transform="translate(10 74) scale(1.25)">${inner(PLACE_ICON.shop())}</g>
      <g transform="translate(116 96) scale(.95)">${inner(PLACE_ICON.board())}</g>
    </svg></div>
    <div class="actor actor--static" style="--x:52;--y:96"><div class="char">${avatar(state.look, {shadow:false})}</div></div>
    <div class="night" data-time="${time}"></div>`;
}

// ── 마을 ──
function drawTown(){
  const walking = state.friends.filter(f => friendNow(f) === 'walk');
  const shopSub = state.shopDay === TODAY ? '내일 또 와요' : shopItem(state, TODAY) ? '오늘의 물건' : '다 모았어요';
  $('townArt').innerHTML = townArt();
  $('townBody').innerHTML = `
    <div class="places">
      <button type="button" class="pcard" data-place="park"><span class="pcard__img">${PLACE_ICON.park(season())}</span><b>공원</b>
        <span class="pcard__st">${walking.length ? `${esc(walking[0].room.name)} 산책 중` : `${season().label} 공원`}</span></button>
      <button type="button" class="pcard" data-place="shop"><span class="pcard__img">${PLACE_ICON.shop()}</span><b>가게</b><span class="pcard__st">${shopSub}</span></button>
      <button type="button" class="pcard" data-place="board"><span class="pcard__img">${PLACE_ICON.board()}</span><b>게시판</b><span class="pcard__st">소식</span></button>
    </div>
    <p class="sec">친구 집</p>
    ${state.friends.length ? state.friends.map(f => `<button type="button" class="friend-row" data-friend="${f.room.seed}">
        <span class="friend-row__av thumb">${avatar(f.room.look, {crop:'face'})}</span>
        <span class="friend-row__t"><b>${esc(f.room.name)}</b><span class="sub">${NOW_TEXT[friendNow(f)]}</span></span><span aria-hidden="true">›</span></button>`).join('')
      : '<p class="sub">친구에게 내 방 코드를 보내 보세요</p>'}
    <div class="chips"><button type="button" class="chip" id="myCodeBtn">내 방 코드 보내기</button><button type="button" class="chip" id="codeInBtn">받은 코드 넣기</button></div>`;
}
$('townBtn').onclick = () => { drawTown(); $('townPage').showModal(); };
$('townBody').onclick = e => {
  const place = e.target.closest('[data-place]')?.dataset.place;
  if (place === 'park') openPark();
  if (place === 'shop'){ drawShop(); $('shopSheet').showModal(); }
  if (place === 'board'){ drawBoard(); $('boardSheet').showModal(); }
  const fr = e.target.closest('[data-friend]'); if (fr) openFriend(+fr.dataset.friend);
  if (e.target.closest('#myCodeBtn')) openCode('내 방 코드', toCode('room', roomData(state, myKinds())), '친구가 이 링크를 열거나 코드를 넣으면 내 방에 놀러 와요. 방을 바꾸면 새로 보내 주세요');
  if (e.target.closest('#codeInBtn')){ $('codeInBox').value = ''; $('codeIn').returnValue = ''; $('codeIn').showModal(); }
};

// ── 공원: 계절이 바뀌고, 산책 나온 친구를 만난다 ──
const PARK_ACTS = Object.keys(PARK_SPOTS);
const FRIEND_SPOTS = [{x:80, y:93}, {x:16, y:95}];
function drawPark(){
  const s = season(), time = timeOf(hourNow()), R = PARK[register()];
  const act = PARK_ACTS[hash(`${state.seed}|park|${tick}`) % PARK_ACTS.length], spot = PARK_SPOTS[act];
  const friends = state.friends.filter(f => friendNow(f) === 'walk').slice(0, FRIEND_SPOTS.length);
  const line = friends.length && talk % 2 ? fill(R.friend, {n:friends[0].room.name}) : fill(R[act][talk % R[act].length], {s:s.label});
  $('parkScene').innerHTML = `<div class="scene__base">
      <div class="plane plane--sky" style="background:${SKY[time]}"></div><div class="plane plane--grass" style="background:${s.grass}">${parkGround(seasonOf(TODAY))}</div>
      ${time === 'night' ? '' : SKY_CLOUDS}<span class="fx fx--tree">${TREE(s)}</span><span class="fx fx--tree2">${TREE(s)}</span><span class="fx fx--pond">${POND}</span><span class="fx fx--bench">${BENCH}</span>
    </div>
    ${friends.map((f, i) => `<div class="actor actor--static" style="--x:${FRIEND_SPOTS[i].x};--y:${FRIEND_SPOTS[i].y}"><div class="char">${avatar(f.room.look, {shadow:false})}</div></div>`).join('')}
    <div class="actor actor--static" style="--x:${spot.x};--y:${spot.y}"><button type="button" class="char" id="parkChar" aria-label="${esc(state.name)} 쓰다듬기">${avatar(state.look, {shadow:false})}</button></div>
    <p class="bubble bubble--static" style="--x:${spot.x};--y:${spot.y}">${esc(line)}</p>
    <div class="night" data-time="${time}"></div>`;
  $('parkSub').textContent = friends.length ? `${friends.map(f => f.room.name).join(', ')}도 산책 나와 있어요` : `${s.label} 공원이에요`;
}
function openPark(){ drawPark(); if (!$('parkPage').open) $('parkPage').showModal(); }
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

// ── 게시판: 오늘의 소식 + 받은 인사 ──
function drawBoard(){
  const news = [...NEWS[seasonOf(TODAY)], ...NEWS.all];
  $('boardBody').innerHTML = `<p class="life" style="margin-top:0">${news[hash(TODAY) % news.length]}</p>
    <p class="sec">받은 인사</p>
    ${state.mail.length ? [...state.mail].reverse().slice(0, 30).map(m => `<div class="row"><div class="row__h"><span>${esc(m.from)}</span><span class="num">${fmtDay(m.date)}</span></div>
      <p class="sub"><b>${GREETS[m.greet]}</b>${m.item ? ` · 선물 ${esc(itemOf(m.item).name)} ${itemOf(m.item).p.name}` : ''}</p></div>`).join('')
      : '<p class="sub">친구에게 내 방 코드를 보내 보세요</p>'}`;
}

// ── 친구 방 ──
let friendSel = null;
const GUEST = {x:38, y:97}, GUEST_RIGHT = {x:80, y:97};   // 놀러 간 내 캐릭터 자리
function drawFriend(){
  const f = state.friends.find(x => x.room.seed === friendSel); if (!f) return;
  const r = f.room, act = friendNow(f), info = ACTIVITIES[act], spot = info.spot ? SPOTS[info.spot === 'wander' && tick % 2 ? 'wander2' : info.spot] : null;
  const FL = LINES[r.personality], mine = talk % 2 === 1;
  const line = !spot ? `${josa(r.name, '은는')} 공원에 산책 갔어요`
    : mine ? pick(VISIT_LINE[register()]) : (talk % 4 === 0 ? pick(FL.hello[timeOf(hourNow())]) : pick(FL.doing[act]));
  const guest = spot && spot.x < 55 && spot.y > 80 ? GUEST_RIGHT : GUEST;   // 친구가 앞쪽 가운데면 비켜 선다
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
