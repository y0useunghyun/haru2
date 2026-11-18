// 꾸준함 보상: 코인(하루 상한)·가게·레벨 (app.js·chat.js 다음에 불러옴)
// 원칙: 쌓이기만 하고 줄지 않음. 연속 기록 X. 기록만이 방법은 아님(들르기·공원도). 며칠 만에 오면 반기는 선물
// 숫자·상한은 data.js(COIN·PRICE·LEVELS·LOOK_LOCKED), 계산은 life.js(earnCoins·levelOf·lookOwned)

const COIN_IMG = pxImg(pxImage('coin', 9, 9, p => {
  p.shape(ell(4.5, 4.5, 4.4), (x, y) => (x + y < 6 ? '#FFE680' : '#FFD23F'));
  p.line(4, 3, 4, 5, '#E8A317'); p.dot(3, 2, '#FFF6CC');
}), 'coin__img');
const COIN_POP_MS = 1200;

// 코인 받기. 받은 만큼 방 왼쪽 위에서 「+4」가 튐
function earn(kind, amount, cap = true){
  const r = earnCoins(state, kind, amount, TODAY, cap);
  state = r.state;
  if (r.got) coinPop(r.got);
  return r.got;
}
// 기록이 새로 채워진 것마다 (기분·잠·식사·운동 각각 하루 한 번)
function earnFromRecord(before, after){
  if (!before.mood && after.mood) earn('mood', COIN.answer);
  if (before.sleep == null && after.sleep != null) earn('sleep', COIN.answer);
  if (!before.meals.length && after.meals.length) earn('meal', COIN.answer);
  if (!before.moves.length && !before.rest && (after.moves.length || after.rest)) earn('move', COIN.answer);
}
// 열 때: 오늘 첫 방문 +10, 며칠 만에 왔으면 +20 (상한 밖)
function rewardOnOpen(){
  if (!state.met) return;
  earn('visit', COIN.visit);
  if (gapDays >= 2) earn('back', COIN.back, false);
}
// 레벨: 들른 날 누적. 오르면 대화창에서 말하고 +30 (처음 보는 저장값은 지금 단계를 조용히 기억)
function levelLine(i){
  const n = LEVELS[i].name;
  return register() === 'casual' ? `우리 이제 ${josa(n, ['이야', '야'])}!` : `우리 이제 ${josa(n, ['이에요', '예요'])}`;
}
document.addEventListener('haru:ready', () => {
  const lv = levelOf(state);
  if (lv <= state.levelSeen) return;
  const quiet = state.levelSeen < 0 && lv === 0;
  state = {...state, levelSeen:lv};
  if (!quiet){ earn(`level${lv}`, COIN.level, false); chatPush(false, levelLine(lv)); }
  save();
});

function drawCoin(){
  if (!$('coinImg').innerHTML) $('coinImg').innerHTML = COIN_IMG;
  $('coinN').textContent = state.coins;
  $('coinPill').hidden = !state.met;
}
let coinTimer = null;
function coinPop(n){
  drawCoin();
  const plus = $('coinPlus');
  plus.textContent = `+${n}`;
  $('coinPill').classList.remove('coin--pop'); void $('coinPill').offsetWidth; $('coinPill').classList.add('coin--pop');
  clearTimeout(coinTimer);
  coinTimer = setTimeout(() => $('coinPill').classList.remove('coin--pop'), COIN_POP_MS);
}
$('coinPill').onclick = () => { drawShop(); $('shopSheet').showModal(); };   // town.js

// ── 가게: 코인으로 가구·소품 사기. 꾸미기는 꾸미기 창에서 입어 보고 산다 (app.js) ──
// 한 번 누르면 그 카드가 「한 번 더 누르면 사요」, 두 번째에 산다 (스크롤하다 잘못 눌러도 코인이 안 빠지게)
const price = n => `<span class="price">${COIN_IMG}${n}</span>`;
let shopPick = null;
function shopBuyList(){
  const free = state.shopDay === TODAY ? null : shopItem(state, TODAY);   // 오늘 공짜인 건 코인 목록에서 뺌
  const props = ALL_ITEMS.filter(key => !owned().has(key) && key !== free);
  const looks = PARTS.some(p => Array.from({length:partSize(p)}, (_, i) => i).some(i => !lookOwned(state, p.k, i)));
  return `<p class="sec shop-coins">코인으로 사기 ${price(state.coins)}</p>
    <p class="sub">매일 들르고 이야기하면 코인이 모여요</p>
    ${props.length ? `<div class="props-grid">${props.map(key => { const {p, k, label} = itemOf(key), on = key === shopPick;
      return `<button type="button" class="pcard buy" data-buy="${key}" ${on ? 'aria-pressed="true"' : ''}><span class="pcard__img">${kindArt(p, k)}</span><b>${esc(label)}</b>${on ? '<span class="buy__again">한 번 더 누르면 사요</span>' : price(PRICE.prop)}</button>`; }).join('')}</div>`
      : '<p class="sub">가구·소품을 다 모았어요</p>'}
    ${looks ? '<button type="button" class="chip shop-look" id="shopLook">머리·옷은 꾸미기에서 입어 보고 사요 ›</button>' : ''}`;
}
$('shopBody').addEventListener('click', e => {
  if (e.target.closest('#shopLook')){ $('shopSheet').close(); return openEdit('캐릭터 꾸미기'); }
  const b = e.target.closest('[data-buy]'); if (!b) return;
  const key = b.dataset.buy;
  if (shopPick !== key){ shopPick = key; return drawShop(); }
  shopPick = null;
  if (state.coins < PRICE.prop){ drawShop(); return showToast(`코인이 ${PRICE.prop - state.coins}개 모자라요. 내일 또 들러요`); }
  state = {...state, coins:state.coins - PRICE.prop};
  gainItem(key);   // app.js: 갖기 + 방 알림
  drawShop(); render();
  showToast(`${itemOf(key).label} 샀어요! 방 꾸미기에서 바꿔 봐요`);   // 열린 가게 안 아래쪽에 (스크롤 위치와 상관없이 보임)
});
$('shopSheet').addEventListener('close', () => { shopPick = null; });

// ── 캐릭터 페이지: 함께한 단계 ──
function rewardSection(){
  const lv = levelOf(state), next = LEVELS[lv + 1], days = state.visits.length;
  const fill = next ? Math.round((days - LEVELS[lv].at) / (next.at - LEVELS[lv].at) * 100) : 100;
  return `<p class="sec">${esc(josa(state.name, ['과', '와']))} 나</p>
    <div class="level"><b>${LEVELS[lv].name}</b><div class="level__bar"><i style="width:${fill}%"></i></div>
    <p class="sub">${next ? `${next.at - days}번 더 만나면 ${next.name}` : '가장 가까운 사이예요'} · ${price(state.coins)}</p></div>`;
}
