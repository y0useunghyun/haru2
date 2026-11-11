// 캐릭터가 제안하는 작은 놀이 — 오늘 질문이 다 끝난 뒤, 하루 한 번. 메뉴 없이 대화창에서만 (chat.js 다음)
// 가위바위보: 셋 중 고르기 / 기지개 대결: 버튼을 꾹 누르는 동안 캐릭터도 늘리고, 떼면 누가 더 오래였는지
// 놀면 코인 (reward.js, 하루 상한 안). 「다음에」도 고를 수 있음

const STRETCH_MIN_MS = 1200, STRETCH_SPAN_MS = 2600;   // 캐릭터가 버티는 시간 1.2~3.8초
let playOffered = false, holdAt = 0, holdMsg = null;
const playDone = new Set();   // 결과가 난 놀이 메시지 (버튼 숨김)

function proposePlay(){
  if (playOffered || state.playDay === TODAY || !state.met) return;
  playOffered = true;
  const game = hash(`${state.seed}|play|${TODAY}`) % 2 ? 'stretch' : 'rps';
  chatPush(false, PLAY_TALK[register()][game], `play:${game}`);
}
function playButtons(m){
  if (playDone.has(m.id)) return '';
  const later = `<button type="button" class="play__opt play__later" data-play="later" data-id="${m.id}">다음에</button>`;
  const opts = m.go === 'play:rps'
    ? RPS.map((t, i) => `<button type="button" class="play__opt" data-play="rps" data-pick="${i}" data-id="${m.id}">${t}</button>`).join('')
    : `<button type="button" class="play__opt play__hold" data-play="hold" data-id="${m.id}">꾹 눌러서 쭉—</button>`;
  return `<span class="play">${opts}${later}</span>`;
}
function finishPlay(id, me, reply){
  playDone.add(id);
  state = {...state, playDay:TODAY};
  chatPush(true, me); say(reply); chatPush(false, reply);
  earn('play', COIN.park);   // reward.js
  hop(); render();
}
$('chatLog').addEventListener('click', e => {
  const b = e.target.closest('[data-play]'); if (!b || b.dataset.play === 'hold') return;
  const id = +b.dataset.id, T = PLAY_TALK[register()];
  if (b.dataset.play === 'later'){ playDone.add(id); state = {...state, playDay:TODAY}; chatPush(false, T.later); render(); return; }
  const me = +b.dataset.pick, char = Math.floor(Math.random() * 3), r = (me - char + 3) % 3;   // 0 비김, 1 내가 이김, 2 캐릭터가 이김
  finishPlay(id, RPS[me], `${RPS[char]}! ${r === 0 ? T.draw : r === 1 ? T.lose : T.win}`);
});
// 기지개: 누르는 동안 캐릭터도 늘림. 화면이 다시 그려져도 떼는 순간을 놓치지 않게 문서 전체에서 받음
function holdStart(id){ holdAt = performance.now(); holdMsg = id; doFor('stretch', 8000); render(); }
function holdEnd(){
  if (!holdAt) return;
  const mine = performance.now() - holdAt, char = STRETCH_MIN_MS + hash(`${state.seed}|stretch|${TODAY}`) % STRETCH_SPAN_MS;
  holdAt = 0;
  const T = PLAY_TALK[register()], s = ms => `${(ms / 1000).toFixed(1)}초`;
  finishPlay(holdMsg, `${s(mine)} 쭉!`, `${s(char)}! ${mine > char ? T.sLose : T.sWin}`);
}
$('chatLog').addEventListener('pointerdown', e => { const b = e.target.closest('[data-play="hold"]'); if (b){ e.preventDefault(); holdStart(+b.dataset.id); } });
document.addEventListener('pointerup', holdEnd);
document.addEventListener('pointercancel', holdEnd);
$('chatLog').addEventListener('keydown', e => { const b = e.target.closest('[data-play="hold"]'); if (b && (e.key === ' ' || e.key === 'Enter') && !holdAt && !e.repeat){ e.preventDefault(); holdStart(+b.dataset.id); } });
document.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') holdEnd(); });
// 이미 다 남긴 날 열면 인사 뒤에 바로 제안
document.addEventListener('haru:ready', () => { if (!askNow()) setTimeout(proposePlay, 1500); });
