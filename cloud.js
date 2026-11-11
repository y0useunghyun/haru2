// 서버 저장 (Supabase). 가입 없이 익명으로 시작하고, 다른 기기로 옮길 때만 이메일을 연결한다
// 서버·인터넷이 안 되면 지금처럼 이 브라우저(localStorage)에만 저장 → index.html 더블클릭도 그대로 동작
// 표 하나(saves: 사람마다 한 줄, 저장값 통째로 jsonb). 행 단위 권한(RLS)으로 본인 줄만 읽고 씀 — supabase.sql
// ponytail: 두 기기에서 동시에 쓰면 나중에 저장한 쪽이 이김. 실시간 병합이 필요해지면 날짜별로 나눠 저장

// 프로젝트 주소와 publishable(anon) 키. 공개돼도 되는 키라 코드에 둠 (막는 건 RLS)
const CLOUD = {url:'https://bkzmrhcpkloycggkrwhi.supabase.co', key:'sb_publishable_QENJ13EFWMBHk1AC6xeR_w_CsnUlRKK'};
const CLOUD_PUSH_MS = 2000;

let sb = null, cloudUser = null, cloudTimer = null, cloudNote = '';
const cloudOn = () => !!(CLOUD.url && CLOUD.key && window.supabase && !NO_SAVE);

async function cloudStart(){
  if (!cloudOn()) return;
  sb = window.supabase.createClient(CLOUD.url, CLOUD.key);
  let {data:{session}} = await sb.auth.getSession();   // 이메일 링크로 돌아왔으면 여기서 그 계정
  if (!session){
    const r = await sb.auth.signInAnonymously();
    if (r.error) throw r.error;
    session = r.data.session;
  }
  cloudUser = session.user;
  await cloudPull();
  document.dispatchEvent(new Event('haru:cloud'));   // 친구 실시간 (friends.js)
}
// 서버 것과 이 기기 것 중 하나 고르기
// 다른 계정으로 쓰던 기기(새 기기·이메일로 불러옴)면 서버 것, 같은 계정이면 더 최근에 저장한 것
async function cloudPull(){
  const {data, error} = await sb.from('saves').select('data, updated_at').eq('user_id', cloudUser.id).maybeSingle();
  if (error) throw error;
  const takeRemote = data && (state.cloudUid !== cloudUser.id || data.updated_at > (state.savedAt ?? ''));
  if (!takeRemote) return cloudPush();
  state = normalize({...data.data, cloudUid:cloudUser.id});
  markSaved();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err){ console.warn('저장 실패', err); }
  // 이 기기에서 첫 시작 중이었는데 서버에 기록이 있으면 바로 방으로
  if (state.met && ($('title').open || $('first').open)){ $('title').open && $('title').close(); $('first').open && $('first').close(); homeReady(); }
  render();
}
async function cloudPush(){
  if (!sb || !cloudUser) return;
  state = {...state, cloudUid:cloudUser.id};
  const {error} = await sb.from('saves').upsert({user_id:cloudUser.id, data:state, updated_at:state.savedAt ?? new Date().toISOString()});
  if (error) console.warn('서버 저장 실패', error);
  if (typeof friendSyncRoom === 'function') friendSyncRoom();   // 방이 바뀌었으면 친구에게도
}
// save() 가 부를 때마다 2초 모아서 한 번
function cloudQueue(){
  if (!sb || !cloudUser) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => cloudPush(), CLOUD_PUSH_MS);
}

// ── 캐릭터 페이지: 다른 기기에서도 쓰기 ──
function cloudSection(){
  if (!cloudUser) return '';
  const email = cloudUser.email;
  return `<p class="sec">다른 기기에서도 쓰기</p>
    ${email
      ? `<p class="sub">${esc(email)}로 연결됐어요. 다른 기기에서 이 이메일로 불러오면 이어서 쓸 수 있어요.</p>`
      : `<p class="sub">기록은 서버에도 저장돼요. 이메일을 연결하면 폰·컴퓨터에서 이어서 쓸 수 있어요.</p>
        <input class="field" id="cloudEmail" type="email" inputmode="email" autocomplete="email" placeholder="이메일" aria-label="이메일">
        <div class="chips"><button type="button" class="chip" id="cloudLink">이 기록에 연결</button><button type="button" class="chip" id="cloudLogin">다른 기기 기록 불러오기</button></div>`}
    <p class="sub">기분·잠·식사 기록은 나만 볼 수 있어요. 친구에게는 방과 캐릭터만 보여요.</p>
    ${cloudNote ? `<p class="sub" role="status">${esc(cloudNote)}</p>` : ''}`;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
$('charBody').addEventListener('click', async e => {
  const link = e.target.closest('#cloudLink'), login = e.target.closest('#cloudLogin');
  if (!link && !login) return;
  const email = $('cloudEmail').value.trim();
  if (!EMAIL_RE.test(email)){ cloudNote = '이메일을 다시 확인해 주세요'; return drawCharPage(); }
  const back = location.origin + location.pathname;
  const {error} = link
    ? await sb.auth.updateUser({email}, {emailRedirectTo:back})                                  // 지금 익명 계정에 이메일을 붙임
    : await sb.auth.signInWithOtp({email, options:{emailRedirectTo:back, shouldCreateUser:false}});   // 이미 연결한 이메일로 들어가기
  if (error) console.warn('이메일 연결 실패', error);
  cloudNote = error ? '보내지 못했어요. 잠시 뒤에 다시 해 주세요'
    : link ? '메일함에서 확인 링크를 눌러 주세요' : '메일함의 링크를 이 기기에서 열어 주세요';
  drawCharPage();
});
