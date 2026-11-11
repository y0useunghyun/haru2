// 캐릭터의 생활 계산. 서버 없이 날짜와 고유값만으로 그날 한 일을 정한다.
// 화면을 건드리지 않는 순수 함수만 둔다 (data.js 다음에 불러옴). 확인: node check.js

const iso = d => d.toLocaleDateString('sv-SE');   // YYYY-MM-DD (현지 날짜)
const dayMs = 86400000;
const toUtc = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((toUtc(b) - toUtc(a)) / dayMs);
const addDays = (key, n) => new Date(toUtc(key) + n * dayMs).toISOString().slice(0, 10);

function hash(s){   // FNV-1a
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// spot = 방 안 자리. null 이면 잠깐 나가 있음 (방에 쪽지만 남음, 공원에서 만날 수 있음)
const ACTIVITIES = {
  window:  {spot:'window', held:null},
  wander:  {spot:'wander', held:null},
  nap:     {spot:'bed',    held:null},
  read:    {spot:'desk',   held:'book'},
  draw:    {spot:'desk',   held:'pencil'},
  plant:   {spot:'plant',  held:'can'},
  music:   {spot:'center', held:'music'},
  collect: {spot:'center', held:'star'},
  stretch: {spot:'center', held:null},
  walk:    {spot:null,     held:null},
};
const BASE_ACTS = ['window', 'wander'];
const INTERESTS = {
  read:    {label:'책 읽기',   acts:['read']},
  plant:   {label:'식물 돌보기', acts:['plant']},
  walk:    {label:'산책',     acts:['walk', 'stretch']},
  music:   {label:'음악 듣기', acts:['music']},
  collect: {label:'모으기',    acts:['collect']},
  draw:    {label:'그림 그리기', acts:['draw']},
};
// 성격은 경향만 준다. 어떤 성격이든 어떤 관심사든 가질 수 있다 (성격과 성장 방향 분리)
const LEAN = {
  active:  {walk:12, collect:6},
  calm:    {read:12, music:6},
  playful: {collect:12, draw:6},
  curious: {plant:12, read:6},
};
const DAYS_PER_INTEREST = 3, MAX_INTERESTS = 4;

// 사용자의 기록은 계기만 된다: 순서가 조금 앞당겨질 뿐 정해지지는 않는다
function recordHints(days){
  const list = Object.values(days ?? {});
  return {
    walk:  list.filter(d => d.moves.length).length * 8,
    plant: list.filter(d => d.meals.length).length * 3,
    read:  list.filter(d => d.rest).length * 8,
    music: list.filter(d => d.sleep != null).length * 2,
  };
}
function rankInterests(c){
  const hints = recordHints(c.days), lean = LEAN[c.personality] ?? {};
  const rank = id => hash(`${c.seed}|${id}`) % 40 - (hints[id] ?? 0) - (lean[id] ?? 0);
  return Object.keys(INTERESTS).sort((a, b) => rank(a) - rank(b));
}
const interestCount = (c, today) => Math.min(MAX_INTERESTS, Math.floor(daysBetween(c.born, today) / DAYS_PER_INTEREST) + 1);

// 관심사는 생긴 날에 저장한다. 이미 생긴 건 기록이 늘어도 바뀌지 않는다
function growInterests(c, today){
  const have = Array.isArray(c.interests) ? c.interests : [];
  const target = interestCount(c, today);
  if (have.length >= target) return have;
  const next = rankInterests(c).filter(id => !have.some(x => x.id === id));
  const added = next.slice(0, target - have.length).map((id, i) => {
    const on = addDays(c.born, (have.length + i) * DAYS_PER_INTEREST);
    return {id, on: on > today ? today : on};
  });
  return [...have, ...added];
}
// 그날 가지고 있던 관심사. 저장된 게 없으면(예전 형식) 계산
const interestsOn = (c, date) => Array.isArray(c.interests)
  ? c.interests.filter(x => x.on <= date).map(x => x.id)
  : rankInterests(c).slice(0, interestCount(c, date));

const timeOf = h => h >= 6 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'noon' : h >= 17 && h < 22 ? 'evening' : 'night';

function activityFor(c, date, hour, tick = 0){
  const slot = timeOf(hour);
  if (slot === 'night') return 'nap';
  const pool = [...BASE_ACTS, ...interestsOn(c, date).flatMap(i => [...INTERESTS[i].acts, ...INTERESTS[i].acts])];
  if (slot === 'noon' && c.personality !== 'active') pool.push('nap');
  return pool[hash(`${c.seed}|${date}|${slot}|${tick}`) % pool.length];
}

// 안 온 동안 캐릭터가 한 일. 가까운 날 3개까지, 같은 일이 이어지지 않게
function awayLog(c, lastVisit, today, limit = 3){
  const gap = daysBetween(lastVisit, today);
  const log = [];
  for (let n = Math.min(gap - 1, limit); n >= 1; n--){
    const date = addDays(today, -n);
    let tick = 0, id = activityFor(c, date, 14, tick);
    while (id === 'nap' || id === log.at(-1)?.id) id = activityFor(c, date, 14, ++tick);
    log.push({date, id});
  }
  return log;
}

// ── 소품 ──
// 함께한 정도: 시간이 지나도, 들어와도, 기록해도 늘어난다 (기록만이 방법이 아님)
const together = (c, today) => daysBetween(c.born, today) + c.visitDays + Object.keys(c.days).length;
const ITEM_STEP = 3;   // 함께한 정도 3마다 하나 (매일 오고 남기면 하루 하나)
const ALL_ITEMS = PROPS.flatMap(p => p.kinds.map((_, k) => `${p.id}:${k}`));
const ownedItems = (c, today) => new Set([...ITEM_ORDER.slice(0, Math.floor(together(c, today) / ITEM_STEP) + 1), ...(c.got ?? [])]);
// 가게의 오늘의 물건: 아직 없는 것 중 날짜로 하나. 다 있으면 null
function shopItem(c, today){
  const owned = ownedItems(c, today), left = ALL_ITEMS.filter(k => !owned.has(k));
  return left.length ? left[hash(`${c.seed}|shop|${today}`) % left.length] : null;
}
const itemOf = key => { const [id, k] = key.split(':'); const p = PROPS.find(x => x.id === id); return {p, k:+k, name:p.kinds[+k]}; };

// ── 공원에서 줍는 것: 계절마다 둘, 날짜로 하나 (미연시처럼 「주워 간다/그냥 둔다」) ──
const PICKS = {
  spring:[{id:'petal', name:'벚꽃잎', c:'#FFB3C7', see:'벤치 위에 벚꽃잎이 내려앉아 있다.'}, {id:'dandelion', name:'민들레', c:'#FFD23F', see:'길가에 민들레가 피어 있다.'}],
  summer:[{id:'clover', name:'네잎클로버', c:'#5FC79F', see:'잔디 사이에 잎이 네 개인 클로버가 보인다.'}, {id:'pebble', name:'조약돌', c:'#C9C2B8', see:'연못가에 매끈한 조약돌이 있다.'}],
  autumn:[{id:'maple', name:'단풍잎', c:'#F2945C', see:'발밑에 빨간 단풍잎이 떨어져 있다.'}, {id:'acorn', name:'도토리', c:'#A0663A', see:'나무 아래 도토리가 굴러다닌다.'}],
  winter:[{id:'pinecone', name:'솔방울', c:'#8A5A3A', see:'눈 위에 솔방울이 하나 떨어져 있다.'}, {id:'snowstone', name:'하얀 조약돌', c:'#F4F7FB', see:'눈 사이로 하얀 조약돌이 보인다.'}],
};
const PICK_BY_ID = Object.fromEntries(Object.values(PICKS).flat().map(p => [p.id, p]));
const pickOn = (c, date) => { const list = PICKS[seasonOf(date)]; return list[hash(`${c.seed}|pick|${date}`) % list.length]; };
const seasonOf = key => { const m = +key.slice(5, 7); return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; };

// ── 음식 이름 → 아는 음식 ──
// 한 글자 음식(밥·국·면·떡·탕…)은 조사를 뗀 단어의 끝에 올 때만: 「밥을」「김치국」은 O, 「어떡해」「면접」은 X
const JOSA = /(이랑|하고|으로|을|를|랑|은|는|도|만|이|가|로)$/;
const hits = name => name.split(/\s+/).flatMap(w => {
  const found = [];
  for (const k of FOOD_KEYS){
    if (k.length > 1){ while (w.includes(k)) { found.push(k); w = w.replace(k, ' '); } continue; }
    if (w.trim().replace(JOSA, '').endsWith(k)){ found.push(k); w = ' '; }
  }
  return found;
});

// ── 한 줄 입력 → 기록 ──
// 「점심에 김밥하고 라면, 7시간 자고 30분 걸었어」 → 식사·잠·운동. 모르는 건 그냥 넘긴다
const WHEN_WORDS = [[/아침/, '아침'], [/점심|브런치/, '점심'], [/저녁/, '저녁'], [/간식|야식|디저트/, '간식']];
const MOOD_WORDS = [[/힘들|피곤|지쳤|지친|우울|별로|짜증|속상|안\s*좋/, 'hard'], [/좋았|좋아|행복|신났|최고|즐거|재밌|재미있/, 'good'], [/보통|그냥 그래|무난|그럭저럭/, 'soso']];
const HOURS_RE = /(\d+(?:\.\d+)?)\s*시간(\s*반)?/;
const FILLER = /^(오늘|그리고|좀|많이|조금|맛있게|든든하게|간단히|대충|했어|했다|함)$/;
function mealName(s){
  const words = s.replace(/(아침|점심|저녁|간식|야식|브런치|디저트)(으로|으론|에는|에|은|는|엔|로)?/g, ' ')
    .replace(/(을|를)?\s*(먹|마셨|마시|마심)\S*/g, ' ')
    .split(/\s+/).map(w => w.replace(/(이랑|랑|하고|으로|에|은|는|을|를)$/, m => w.length > m.length ? '' : m))
    .filter(w => w && !FILLER.test(w));
  return words.join(' ').slice(0, 40);
}
function parseRecord(text, fallbackWhen = '간식'){
  let sleep = null, mood = null, rest = false, when = null;
  const moves = [], meals = [];   // 이 함수 안에서만 쌓는 목록
  for (const raw of String(text).slice(0, 200).split(/[,.\n!?~]+|\s*그리고\s*|(?<=고)\s+/)){
    const s = raw.trim(); if (!s) continue;
    if (/아무것도\s*안/.test(s)){ rest = true; continue; }
    when = WHEN_WORDS.find(([re]) => re.test(s))?.[1] ?? when;
    mood = MOOD_WORDS.find(([re]) => re.test(s))?.[1] ?? mood;
    const h = s.match(HOURS_RE), hours = h ? +h[1] + (h[2] ? .5 : 0) : null;
    // 「6시간」만 쓰면 잠 (캐릭터가 「몇 시간 잤어요?」 하고 묻기 때문)
    if ((/잤|자고|수면|잠(?!깐)/.test(s) && !/낮잠/.test(s)) || /^\d+\s*시간\s*반?\s*(정도|쯤)?$/.test(s)){
      sleep = Math.min(14, hours ?? (/푹|꿀잠|늦잠|많이/.test(s) ? 9 : /못|조금|적게|설쳤|뒤척/.test(s) ? 5 : 7));
      continue;
    }
    const move = MOVE_WORDS.find(([re]) => re.test(s));
    if (move){
      const min = +(s.match(/(\d+)\s*분/)?.[1] ?? 0) || (hours ? hours * 60 : 30);
      moves.push({type:move[1], min:Math.max(5, Math.min(300, Math.round(min)))});
      continue;
    }
    const found = hits(s);
    if (!found.length && !/먹|마셨|마시|마심/.test(s)) continue;
    const name = mealName(s) || found.join(' ');
    if (!name) continue;
    const at = when ?? fallbackWhen, prev = meals.at(-1);
    if (prev && prev.when === at) meals[meals.length - 1] = {when:at, name:`${prev.name} ${name}`.slice(0, 40)};   // 「김밥하고 라면」 = 한 끼
    else meals.push({when:at, name});
    when = at;
  }
  return {sleep, moves, meals, mood, rest};
}
// 캐릭터가 물어본 것(kind)에 대한 대답. 못 알아들으면 질문 종류로 받는다
// 「6」→ 잠 6시간 / 식사 질문에 처음 보는 말 → 그 이름으로 식사 / 운동 질문에 「클라이밍」→ 운동 30분
// 「아니」「안 먹었어」 같은 대답은 skip (그 질문은 오늘 다시 안 물음)
const NO_ANSWER = /^(아니|아뇨|못|없어|글쎄|몰라)|안\s*(먹|했|움직|잤)|굶/;   // 「안 좋아」는 기분이라 넣지 않음
function parseAnswer(text, kind, when){
  const r = parseRecord(text, when), s = String(text).trim().slice(0, 40);
  if (kind && NO_ANSWER.test(s)) return {...r, meals:[], skip:true};   // 「안 먹었어」가 식사로 남지 않게 먼저
  if (!isEmptyParse(r) || !kind) return {...r, skip:false};
  const n = s.match(/^(\d+(?:\.\d+)?)/);
  if (kind === 'sleep' && n) return {...r, sleep:Math.min(14, +n[1]), skip:false};
  if (kind === 'meal') return {...r, meals:[{when, name:mealName(s) || s}], skip:false};
  if (kind === 'move') return {...r, moves:[{type:'운동', min:Math.max(5, Math.min(300, +(s.match(/(\d+)\s*분/)?.[1] ?? 30)))}], skip:false};
  return {...r, skip:false};
}
const isEmptyParse = r => r.sleep == null && !r.moves.length && !r.meals.length && !r.mood && !r.rest;

// ── 형식 검사 (저장값·불러온 파일·친구 코드) ──
const inRange = (v, n) => Number.isInteger(v) && v >= 0 && v < n;
const partSize = p => p.colors ? p.colors.length : p.n;
const cleanLook = raw => Object.fromEntries(PARTS.map(p => [p.k, inRange(raw?.[p.k], partSize(p)) ? raw[p.k] : DEFAULT_LOOK[p.k]]));
const isDateKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(Date.parse(k));
const cleanName = (s, fallback) => typeof s === 'string' && s.trim() ? s.trim().slice(0, 12) : fallback;
const cleanKinds = raw => Object.fromEntries(PROPS.filter(p => inRange(raw?.[p.id], p.kinds.length)).map(p => [p.id, raw[p.id]]));

// ── 친구 코드: 서버 없이 방을 글자로 주고받는다. 기록(잠·식사 등)은 넣지 않는다 ──
const b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
const CODE_RE = /([HG])2\.([A-Za-z0-9_-]{8,3000})/;
const toCode = (type, data) => `${type === 'room' ? 'H' : 'G'}2.${b64(JSON.stringify(data))}`;
const roomData = (c, kinds) => ({n:c.name, p:c.personality, l:PARTS.map(p => c.look[p.k]), s:c.seed, b:c.born, i:(c.interests ?? []).map(x => x.id), k:kinds});
function cleanRoom(raw){
  if (!Number.isInteger(raw?.s) || !Array.isArray(raw.l)) return null;
  const born = isDateKey(raw.b) ? raw.b : '2026-01-01';
  const ids = [...new Set(Array.isArray(raw.i) ? raw.i : [])].filter(id => INTERESTS[id]).slice(0, MAX_INTERESTS);
  return {seed:raw.s, name:cleanName(raw.n, '친구'), personality:PERSONALITIES[raw.p] ? raw.p : 'calm',
    look:cleanLook(Object.fromEntries(PARTS.map((p, i) => [p.k, raw.l[i]]))), born,
    interests:ids.map(id => ({id, on:born})), kinds:{window:0, ...cleanKinds(raw.k)}};
}
function cleanGift(raw){
  if (!Number.isInteger(raw?.s) || !Number.isInteger(raw.t) || !inRange(raw.g, GREETS.length) || !isDateKey(raw.d)) return null;
  return {from:cleanName(raw.f, '친구'), fromSeed:raw.s, to:raw.t, greet:raw.g, item:ALL_ITEMS.includes(raw.it) ? raw.it : null, date:raw.d};
}
function readCode(text){
  const m = String(text ?? '').match(CODE_RE);
  if (!m) return null;
  try {
    const raw = JSON.parse(unb64(m[2]));
    const data = m[1] === 'H' ? cleanRoom(raw) : cleanGift(raw);
    return data ? {type:m[1] === 'H' ? 'room' : 'gift', data, id:hash(m[0])} : null;
  } catch (err){ return null; }   // 잘못된 코드는 「못 읽음」으로만 처리 (호출한 쪽이 안내)
}

// ── 캐릭터끼리 만남: 두 고유값과 날짜로만 정한다 → 서로 코드를 가진 두 기기에서 같은 결과 ──
const MEET_PERCENT = 40;   // 친구 한 명과 어떤 날 만날 확률
function meetingOn(a, b, date){
  if (date < a.born || date < b.born || a.seed === b.seed) return null;
  const h = hash(`${Math.min(a.seed, b.seed)}|${Math.max(a.seed, b.seed)}|meet|${date}`);
  return h % 100 < MEET_PERCENT ? MEET_EVENTS[Math.floor(h / 100) % MEET_EVENTS.length] : null;
}
const meetsNow = hour => ['noon', 'evening'].includes(timeOf(hour));   // 오늘 만남은 낮부터
const withRang = n => { const c = n.charCodeAt(n.length - 1) - 0xAC00; return n + (c >= 0 && c % 28 ? '이랑' : '랑'); };
