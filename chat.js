// 대화창: 캐릭터가 묻고, 내가 한 줄로 대답하고, 캐릭터가 이어서 묻는다 (app.js 다음에 불러옴)
// 대화 기록은 저장하지 않는다. 남긴 내용은 기록(state.days)에 들어가고, 새로 열면 지금 필요한 질문부터

const CHAT_MAX = 30;
const ASK_NEXT_MS = 1500;
// 질문마다 입력칸에 보이는 예시 (모두 알아듣는 말, check.js 에서 확인)
const HINT = {mood:'예: 좋아, 그냥 그래', sleep:'예: 7시간', meal:'예: 김밥, 마라탕', move:'예: 30분 걸었어'};

let chat = [], openAsk = null, skipped = [];   // openAsk = 마지막으로 물어본 것 (mood·sleep·meal·move), skipped = 「아니」라고 한 질문 (이번에 연 동안만)
const skipAsk = kind => { if (kind) skipped = [...skipped, kind]; openAsk = null; };

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
function drawChat(){
  const log = $('chatLog'), html = chat.map(m => `<p class="msg ${m.me ? 'msg--me' : ''}">${esc(m.t)}</p>`).join('');
  if (log.innerHTML !== html){ log.innerHTML = html; log.scrollTop = log.scrollHeight; }
  const still = openAsk && askNow()?.kind === openAsk;
  $('sayInput').placeholder = still ? HINT[openAsk] : `${state.name || '캐릭터'}에게 말해 주기…`;
}
// 대답이 다 끝나면 다음 질문
const askAfter = ms => setTimeout(chatAsk, ms + ASK_NEXT_MS);

// 홈이 준비되면(첫 시작·복귀 화면 다음) 인사 또는 질문으로 시작
document.addEventListener('haru:ready', () => {
  if (chat.length) return;
  const q = askNow();
  if (q) chatAsk();
  else chatPush(false, pick(lines().hello[timeOf(hourNow())]));
});
