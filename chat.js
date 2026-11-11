// 대화창: 캐릭터가 묻고, 내가 한 줄로 대답하고, 캐릭터가 이어서 묻는다 (app.js 다음에 불러옴)
// 대화 기록은 저장하지 않는다. 남긴 내용은 기록(state.days)에 들어가고, 새로 열면 지금 필요한 질문부터

const CHAT_MAX = 30;
const ASK_NEXT_MS = 1500;
// 질문마다 바로 누를 수 있는 대답. 모두 parseRecord 가 알아듣는 말 (check.js 에서 확인)
const QUICK = {
  mood:MOODS.map(([, label]) => label),
  sleep:['6시간', '7시간', '8시간', '푹 잤어'],
  meal:{morning:['토스트', '시리얼', '바나나'], noon:['김밥', '라면', '샐러드'], evening:['밥이랑 국', '파스타', '치킨'], night:['밥이랑 국', '파스타', '치킨']},
  move:['30분 걸었어', '스트레칭 했어', '아무것도 안 했어'],
};

let chat = [], openAsk = null;   // openAsk = 마지막으로 물어본 것 (mood·sleep·meal·move)

function chatPush(me, t){
  if (!t) return;
  chat = [...chat.slice(1 - CHAT_MAX), {me, t}];
  drawChat();
}
// 지금 물어볼 게 있으면 묻는다. 방금 물어본 것과 같으면 다시 묻지 않음
function chatAsk(){
  const q = askNow();
  if (!q || (openAsk === q.kind && chat.at(-1)?.t === q.t)) { openAsk = q?.kind ?? null; drawChat(); return; }
  openAsk = q.kind;
  chatPush(false, q.t);
}
function quickFor(kind){
  if (kind === 'meal') return QUICK.meal[timeOf(hourNow())];
  return QUICK[kind] ?? [];
}
function drawChat(){
  $('chatLog').innerHTML = chat.map(m => `<p class="msg ${m.me ? 'msg--me' : ''}">${esc(m.t)}</p>`).join('');
  const still = openAsk && askNow()?.kind === openAsk;
  $('chatQuick').innerHTML = still ? quickFor(openAsk).map(t => `<button type="button" class="chip quick" data-quick="${esc(t)}">${esc(t)}</button>`).join('') : '';
  $('chatQuick').hidden = !still;
  $('chatLog').scrollTop = $('chatLog').scrollHeight;   // 빠른 대답 줄이 생긴 뒤에 맨 아래로
}
$('chatQuick').onclick = e => {
  const b = e.target.closest('[data-quick]'); if (!b) return;
  $('sayInput').value = b.dataset.quick;
  $('sayForm').requestSubmit();
};
// 대답이 다 끝나면 다음 질문
const askAfter = ms => setTimeout(chatAsk, ms + ASK_NEXT_MS);

// 홈이 준비되면(첫 시작·복귀 화면 다음) 인사 또는 질문으로 시작
document.addEventListener('haru:ready', () => {
  if (chat.length) return;
  const q = askNow();
  if (q) chatAsk();
  else chatPush(false, pick(lines().hello[timeOf(hourNow())]));
});
