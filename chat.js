// 대화창: 캐릭터가 묻고, 내가 한 줄로 대답하고, 캐릭터가 이어서 묻는다 (app.js 다음에 불러옴)
// 대화 기록은 저장하지 않는다. 남긴 내용은 기록(state.days)에 들어가고, 새로 열면 지금 필요한 질문부터

const CHAT_MAX = 30;
const ASK_NEXT_MS = 1500;
// 질문마다 입력칸에 보이는 예시 (모두 알아듣는 말, check.js 에서 확인)
const HINT = {mood:'예: 좋아, 그냥 그래', sleep:'예: 7시간', meal:'예: 김밥, 마라탕', move:'예: 30분 걸었어'};

// openAsk = 마지막으로 물어본 것 (mood·sleep·meal·move), skipped = 「아니」라고 한 질문 (이번에 연 동안만)
// undo = {id, before}: 마지막으로 남긴 내 말. 되돌리면 그 전 기록으로
let chat = [], openAsk = null, skipped = [], msgId = 0, undo = null;
const skipAsk = kind => { if (kind) skipped = [...skipped, kind]; openAsk = null; };

function chatPush(me, t, go = null){   // go = 'park' 이면 메시지 안에 「공원 가기」
  if (!t) return;
  chat = [...chat.slice(1 - CHAT_MAX), {id:++msgId, me, t, go}];
  drawChat();
}
// 지금 물어볼 게 있으면 묻는다. 방금 물어본 것과 같으면 다시 묻지 않음
function chatAsk(){
  const q = askNow();
  openAsk = q?.kind ?? null;
  if (!q && typeof proposePlay === 'function') proposePlay();   // 오늘 질문이 다 끝나면 놀이 제안 (play.js)
  if (!q || chat.at(-1)?.t === q.t) return drawChat();   // 바로 앞 줄이 같은 질문이면 다시 묻지 않음 (되돌린 뒤 등)
  chatPush(false, q.t);
}
function drawChat(){
  const log = $('chatLog'), html = chat.map(m => `<p class="msg ${m.me ? 'msg--me' : ''}">${esc(m.t)}${m.go === 'park' ? '<button type="button" class="msg__go" data-go="park">공원 가기 ›</button>' : ''}${m.go?.startsWith('play:') && typeof playButtons === 'function' ? playButtons(m) : ''}</p>${undo?.id === m.id ? '<button type="button" class="msg__undo" data-undo>되돌리기</button>' : ''}`).join('');
  if (log.innerHTML !== html){ log.innerHTML = html; log.scrollTop = log.scrollHeight; }
  const still = openAsk && askNow()?.kind === openAsk;
  $('sayInput').placeholder = still ? HINT[openAsk] : `${state.name || '캐릭터'}에게 말해 주기…`;
}
$('chatLog').onclick = e => {
  if (e.target.closest('[data-go="park"]')) return openPark();
  if (!e.target.closest('[data-undo]') || !undo) return;
  reactionTimers.forEach(clearTimeout);   // 아직 안 한 대답도 취소
  setToday(undo.before);
  chat = chat.filter(m => m.id < undo.id); undo = null; openAsk = null;
  render(); chatAsk();
};
// 방금 남긴 내 말에 되돌리기 (다음에 남기면 그쪽으로 옮겨 감)
function chatUndo(before){ undo = {id:chat.findLast(m => m.me)?.id, before}; drawChat(); }
// 대답이 다 끝나면 다음 질문
const askAfter = ms => setTimeout(chatAsk, ms + ASK_NEXT_MS);

// 홈이 준비되면(첫 시작·복귀 화면 다음) 인사 또는 질문으로 시작
document.addEventListener('haru:ready', () => {
  if (chat.length) return;
  const q = askNow();
  if (q) chatAsk();
  else chatPush(false, pick(lines().hello[timeOf(hourNow())]));
});

// 잡담: 기록이 아닌 말에 캐릭터가 대답 (talk.js 의 CHITCHAT)
function chitchatLine(text){
  const rest = text.trim().replace(/^[ㅋㅎ]+[\s!~.]*/, '');   // 「ㅋㅋ 너는 뭐했어?」는 웃음 뒤의 말을 먼저 봄
  const hit = CHITCHAT.find(([re]) => re.test(rest || text.trim()));
  if (!hit) return null;
  return hit[1][register()].replace('{n이야}', josa(state.name, ['이야', '야'])).replace('{n이에요}', josa(state.name, ['이에요', '예요']))
    .replace('{doing}', pick(lines().doing[nowActivity()])).replace('{past}', pastLines()[activityFor(state, TODAY, 11)]);
}

// ── AI 대답 (api/talk.js, Haiku 5.5). 로그인(cloud.js)돼 있고 인터넷이 될 때만, 아니면 null → 단어 표 대답 ──
const AI_URL = 'https://my-haru2.vercel.app/api/talk';   // GitHub Pages·파일로 열어도 이 주소
const AI_TIMEOUT_MS = 8000;
let aiBusy = false;
async function askAI(text){
  if (!sb || !cloudUser) return null;
  aiBusy = true; $('sayInput').placeholder = '생각하는 중…';
  try {
    const {data:{session}} = await sb.auth.getSession();
    if (!session) return null;
    const res = await fetch(AI_URL, {
      method:'POST', signal:AbortSignal.timeout(AI_TIMEOUT_MS),
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({text, ask:openAsk, name:state.name, personality:PERSONALITIES[state.personality].label, register:register(),
        recent:chat.slice(-5, -1).map(m => ({me:m.me, t:m.t}))}),
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out.fallback || typeof out.reply !== 'string' ? null : out;
  } catch (err){ console.warn('AI 대답 안 됨, 단어 표로', err); return null; }
  finally { aiBusy = false; drawChat(); }
}
// AI가 뽑은 기록을 남기고, AI 대답을 캐릭터가 말함 (단어 표 반응은 겹치니 안 함)
function applyAI(ai){
  const before = todayRec(), when = guessWhen();
  const meals = ai.meals.map(m => ({when, name:String(m.name).slice(0, 40)})).filter(m => m.name);
  const moves = ai.moves.filter(m => MOVE_TYPES[m.type]).map(m => ({type:m.type, min:Math.max(5, Math.min(300, Math.round(m.min) || 30))}));
  const sleep = typeof ai.sleep_hours === 'number' && ai.sleep_hours > 0 && ai.sleep_hours <= 14 ? ai.sleep_hours : null;
  const mood = ['good', 'soso', 'hard'].includes(ai.mood) ? ai.mood : null;
  const recorded = mood || sleep != null || meals.length || moves.length;
  if (ai.skip && openAsk) skipAsk(openAsk);
  if (recorded){
    setToday({...(mood ? {mood} : {}), ...(sleep != null ? {sleep} : {}), meals:[...before.meals, ...meals], moves:[...before.moves, ...moves]});
    window.clarity?.('event', 'record_line');
  }
  const reply = ai.reply.slice(0, 80);
  say(reply); chatPush(false, reply);
  if (recorded) chatUndo(before);
  askAfter(0); render(); hop();
}
