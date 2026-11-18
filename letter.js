// 다시 오면 달라져 있는 것: 일주일마다 편지 · 첫눈 · 친구 캐릭터가 내 방에 놀러 옴 (계산은 life.js, 대사는 talk.js)
// 지난 기록 꺼내기는 대화창 시작(chat.js). town.js 끝의 start() 보다 먼저 불러야 haru:ready 를 들음

// ── 편지 ──
const letterTitle = k => (k === 1 ? '첫 편지' : `${k}번째 편지`);
function openLetter(k = letterCount(state, TODAY)){
  if (k < 1) return;
  const {from, to, lines} = letterOf(state, k, register(), state.friends);
  $('letterTitle').textContent = letterTitle(k);
  $('letterBody').innerHTML = `<p class="sub">${fmtDay(from)} ~ ${fmtDay(to)}</p>${lines.map(t => `<p>${esc(t)}</p>`).join('')}<p class="letter__sign">— ${esc(state.name)}</p>`;
  $('letterOk').textContent = LETTER[register()].ok;
  if (k > state.letterSeen){ state = {...state, letterSeen:k}; save(); window.clarity?.('event', 'letter_open'); }
  $('letter').returnValue = ''; $('letter').showModal();
}
// 캐릭터 페이지: 받은 편지 다시 읽기 (최근 것부터)
function letterSection(){
  const n = letterCount(state, TODAY);
  if (n < 1) return '';
  return `<p class="sec">받은 편지</p><div class="chips">${Array.from({length:n}, (_, i) => n - i).slice(0, 12)
    .map(k => `<button type="button" class="chip" data-letter="${k}">${letterTitle(k)}${k > state.letterSeen ? ' · 새 편지' : ''}</button>`).join('')}</div>`;
}
$('charBody').addEventListener('click', e => { const b = e.target.closest('[data-letter]'); if (b) openLetter(+b.dataset.letter); });
$('letter').onclose = () => { if ($('charPage').open) drawCharPage(); };
// 새 편지가 있으면 대화창에 「편지 읽기」 (읽을 때까지 열 때마다)
document.addEventListener('haru:ready', () => {
  if (letterCount(state, TODAY) > state.letterSeen) chatPush(false, LETTER[register()].open, 'letter');
});

// ── 첫눈: 그 겨울 처음 눈 온 날 (실제 날씨. ?demo&weather=snow 로 확인) ──
const SNOW_GAP_DAYS = 150;   // 지난 첫눈에서 이만큼 지나야 새 겨울
function checkFirstSnow(){
  const last = state.snows.at(-1);
  if (weather !== 'snow' || !state.met || (last && daysBetween(last, TODAY) < SNOW_GAP_DAYS)) return;
  state = {...state, snows:[...state.snows, TODAY]};
  const t = FIRST_SNOW[register()], tell = () => { say(t, 5000); chatPush(false, t); hop(); render(); };
  if (chat.length) tell(); else document.addEventListener('haru:ready', tell, {once:true});   // 대화가 시작되기 전이면 시작한 뒤에
}
if (DEMO && weather === 'snow') document.addEventListener('haru:ready', checkFirstSnow, {once:true});

// ── 친구 캐릭터가 내 방에 놀러 옴: 낮·저녁, 내 캐릭터가 방에 있을 때 ──
const GUEST_SPOTS = [{x:30, y:90}, {x:72, y:90}];
let guestLine = null, guestTimer = null, homeShown = false;   // 대화가 시작되기 전엔 대화창에 쓰지 않음 (첫 질문이 막힘)
document.addEventListener('haru:ready', () => { homeShown = true; render(); });
const guestNow = () => (state.met && meetsNow(hourNow()) && ACTIVITIES[nowActivity()].spot ? guestOn(state, state.friends, TODAY) : null);
const guestName = f => josaOf(f.room.name, '이', '가');
function drawGuest(){
  const f = guestNow(), el = $('guest'), b = $('guestBubble');
  el.hidden = !f; b.hidden = !f || !guestLine;
  if (!f) return;
  const mine = SPOTS[ACTIVITIES[nowActivity()].spot] ?? SPOTS.center;
  const at = GUEST_SPOTS[mine.x < 50 ? 1 : 0];   // 내 캐릭터 반대쪽
  el.style.cssText = b.style.cssText = `--x:${at.x};--y:${at.y}`;
  const key = JSON.stringify([f.room.seed, f.room.look]);
  if (el.dataset.key !== key){ $('guestChar').innerHTML = avatar(f.room.look); $('guestChar').setAttribute('aria-label', `놀러 온 ${f.room.name}`); el.dataset.key = key; }
  b.textContent = guestLine ?? '';
  if (homeShown && !state.guests.some(g => g.s === f.room.seed)){   // 처음 놀러 온 날은 기억에 남김
    state = {...state, guests:[...state.guests, {s:f.room.seed, on:TODAY}]};
    chatPush(false, GUEST_TALK[register()].first.replace('{n}', guestName(f)));
  }
}
// 내 캐릭터가 가끔 말함 (app.js speech)
const guestTalk = () => { const f = guestNow(); return f ? GUEST_TALK[register()].here.replace('{n}', guestName(f)) : null; };
$('guestChar').onclick = () => {
  const f = guestNow(); if (!f) return;
  guestLine = pick(VISIT_LINE[PERSONALITIES[f.room.personality].register]); talk++;
  clearTimeout(guestTimer); guestTimer = setTimeout(() => { guestLine = null; render(); }, 3000);
  render();
};
