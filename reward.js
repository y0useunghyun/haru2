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

// ── 가게: 코인으로 사기 (가구·꾸미기) ──
const lockedLooks = () => Object.entries(LOOK_LOCKED).flatMap(([k, is]) => is.map(i => [k, i])).filter(([k, i]) => !lookOwned(state, k, i));
const price = n => `<span class="price">${COIN_IMG}${n}</span>`;
function lookCard(k, i){
  const part = PARTS.find(p => p.k === k);
  const art = part.colors ? `<span class="swatch" style="background:${part.colors[i]}"></span>` : avatar({...state.look, [k]:i}, {crop:part.crop || 'face'});
  return `<button type="button" class="pcard buy" data-buy="look" data-k="${k}" data-i="${i}"><span class="pcard__img">${art}</span><b>${part.label}</b>${price(PRICE.look)}</button>`;
}
function shopBuyList(){
  const props = ALL_ITEMS.filter(key => !owned().has(key));
  const looks = lockedLooks();
  if (!props.length && !looks.length) return '<p class="sec">코인으로 사기</p><p class="sub">다 모았어요</p>';
  return `<p class="sec shop-coins">코인으로 사기 ${price(state.coins)}</p>
    <p class="sub" id="shopMsg">매일 들르고 이야기하면 코인이 모여요</p>
    ${looks.length ? `<p class="cal-sub">꾸미기</p><div class="props-grid">${looks.map(([k, i]) => lookCard(k, i)).join('')}</div>` : ''}
    ${props.length ? `<p class="cal-sub">가구·소품</p><div class="props-grid">${props.map(key => { const {p, k, name} = itemOf(key);
      return `<button type="button" class="pcard buy" data-buy="prop" data-key="${key}"><span class="pcard__img">${kindArt(p, k)}</span><b>${esc(name)}</b>${price(PRICE.prop)}</button>`; }).join('')}</div>` : ''}`;
}
$('shopBody').addEventListener('click', e => {
  const b = e.target.closest('[data-buy]'); if (!b) return;
  const cost = PRICE[b.dataset.buy];
  if (state.coins < cost){ $('shopMsg').textContent = `코인이 ${cost - state.coins}개 모자라요. 내일 또 들러요`; return; }
  state = {...state, coins:state.coins - cost};
  if (b.dataset.buy === 'prop') gainItem(b.dataset.key);   // app.js: 갖기 + 알림
  else state = {...state, looks:[...state.looks, `${b.dataset.k}:${b.dataset.i}`]};
  drawShop(); render();
  $('shopMsg').textContent = b.dataset.buy === 'prop' ? '샀어요! 방 꾸미기에서 바꿔 봐요' : '샀어요! 캐릭터 꾸미기에서 입혀 봐요';
});

// ── 캐릭터 페이지: 함께한 단계 ──
function rewardSection(){
  const lv = levelOf(state), next = LEVELS[lv + 1], days = state.visits.length;
  const fill = next ? Math.round((days - LEVELS[lv].at) / (next.at - LEVELS[lv].at) * 100) : 100;
  return `<p class="sec">${esc(josa(state.name, ['과', '와']))} 나</p>
    <div class="level"><b>${LEVELS[lv].name}</b><div class="level__bar"><i style="width:${fill}%"></i></div>
    <p class="sub">${next ? `${next.at - days}번 더 만나면 ${next.name}` : '가장 가까운 사이예요'} · ${price(state.coins)}</p></div>`;
}
