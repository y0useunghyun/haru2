// 하루 2 화면. 저장은 이 브라우저(localStorage), 캐릭터 페이지에서 파일로 백업·복원.
// 주소 옵션: ?demo 예시 데이터 · ?start 처음부터 · ?away=3 며칠 뒤 복귀 · ?time=night · ?weather=rain · ?p=playful
// 세 옵션(demo·start·away)은 저장하지 않는다.

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo'), START = params.has('start'), AWAY = params.has('away');
const NO_SAVE = DEMO || START || AWAY;
const TIME_HOURS = {morning:8, noon:14, evening:19, night:23};
const hourNow = () => TIME_HOURS[params.get('time')] ?? new Date().getHours();
const dayNow = () => new Date(Date.now() - 4*3600*1000);   // 하루 경계 = 새벽 4시
const TODAY = iso(dayNow());
const KEY = 'haru2';
const EMPTY_DAY = {mood:null, rest:false, sleep:null, moves:[], meals:[]};

// ── 저장 형식 검사: 저장값과 불러온 파일 모두 여기를 지난다 (공용 검사는 life.js) ──
function cleanDay(d){
  const mood = MOODS.some(([k]) => k === d?.mood) ? d.mood : null;
  const sleep = typeof d?.sleep === 'number' && d.sleep >= 0 && d.sleep <= 14 ? d.sleep : null;
  const moves = (Array.isArray(d?.moves) ? d.moves : []).filter(m => MOVE_TYPES[m?.type] && m.min > 0).map(m => ({type:m.type, min:+m.min}));
  const meals = (Array.isArray(d?.meals) ? d.meals : []).filter(m => MEALS.includes(m?.when) && typeof m.name === 'string').map(m => ({when:m.when, name:m.name.slice(0, 40)}));
  return {mood, rest:d?.rest === true, sleep, moves, meals, ...(d?.goals ? {goals:cleanGoals(d.goals)} : {})};
}
const cleanGoals = g => ({meals:MEAL_COUNTS.includes(g?.meals) ? g.meals : DEFAULT_GOALS.meals, aim:inRange(g?.aim, AIMS.length) ? g.aim : DEFAULT_GOALS.aim});
// v1 → v2: 칸 단위로 열리던 소품을 종류 단위로. 그때 열려 있던 칸은 3종 모두 가진 걸로 옮긴다
function oldGot(raw, days){
  if (raw.v !== 1 || !isDateKey(raw.born)) return [];
  const n = together({born:raw.born, visitDays:Number.isInteger(raw.visitDays) ? raw.visitDays : 1, days}, TODAY);
  return PROPS.filter(p => n >= (OLD_NEED[p.id] ?? Infinity)).flatMap(p => p.kinds.map((_, k) => `${p.id}:${k}`));
}
const cleanList = (raw, max, fn) => (Array.isArray(raw) ? raw : []).map(fn).filter(Boolean).slice(-max);
// 친구는 받은 코드 그대로 저장하고, 읽을 때마다 같은 검사를 지난다
function cleanFriend(f){ const r = readCode(f?.code); return r?.type === 'room' && isDateKey(f.at) ? {code:f.code, at:f.at, room:r.data} : null; }
function cleanMail(m){
  if (!Number.isInteger(m?.id) || !isDateKey(m.date) || !inRange(m.greet, GREETS.length)) return null;
  return {id:m.id, from:cleanName(m.from, '친구'), greet:m.greet, item:ALL_ITEMS.includes(m.item) ? m.item : null, date:m.date};
}
function normalize(raw){
  const days = Object.fromEntries(Object.entries(raw.days && typeof raw.days === 'object' ? raw.days : {}).filter(([k]) => isDateKey(k)).map(([k, d]) => [k, cleanDay(d)]));
  const got = [...new Set([...(Array.isArray(raw.got) ? raw.got.filter(k => ALL_ITEMS.includes(k)) : []), ...oldGot(raw, days)])];
  return {
    v:2,
    seed:Number.isInteger(raw.seed) ? raw.seed : Math.floor(Math.random()*1e9),
    name:cleanName(raw.name, '하루'),
    personality:PERSONALITIES[raw.personality] ? raw.personality : 'calm',
    born:isDateKey(raw.born) ? raw.born : TODAY,
    lastVisit:isDateKey(raw.lastVisit) ? raw.lastVisit : TODAY,
    visitDays:Number.isInteger(raw.visitDays) && raw.visitDays > 0 ? raw.visitDays : 1,
    visits:[...new Set([...(Array.isArray(raw.visits) ? raw.visits.filter(k => typeof k === 'string' && isDateKey(k)) : []), isDateKey(raw.lastVisit) ? raw.lastVisit : TODAY])].sort(),   // 복귀율 계산용. 화면에는 안 보임
    met:raw.met === true,
    look:cleanLook(raw.look),
    goals:cleanGoals(raw.goals),
    hiddenProps:Array.isArray(raw.hiddenProps) ? raw.hiddenProps.filter(id => PROPS.some(p => p.id === id)) : [],
    propKinds:cleanKinds(raw.propKinds),
    got,
    seenItems:Number.isInteger(raw.seenItems) ? raw.seenItems : raw.v === 1 ? -1 : 0,   // -1 = 예전 저장값, 지금 가진 걸 이미 본 걸로
    interests:cleanList(raw.interests, MAX_INTERESTS, x => INTERESTS[x?.id] && isDateKey(x.on) ? {id:x.id, on:x.on} : null),
    friends:cleanList(raw.friends, 30, cleanFriend),
    mail:cleanList(raw.mail, 100, cleanMail),
    shopDay:isDateKey(raw.shopDay) ? raw.shopDay : null,
    picks:cleanList(raw.picks, 400, x => PICK_BY_ID[x?.id] && isDateKey(x.date) ? {id:x.id, date:x.date} : null),   // 공원에서 주운 것 → 책상 위 병
    parkDay:isDateKey(raw.parkDay) ? raw.parkDay : null,   // 오늘 공원에서 골랐는지
    days,
  };
}
function loadSaved(){
  if (START) return null;
  try { const raw = JSON.parse(localStorage.getItem(KEY)); return raw && typeof raw === 'object' ? raw : null; }
  catch (err){ console.warn('저장된 기록을 읽지 못함', err); return null; }
}
// undo 가 있으면 「되돌리기」 버튼을 같이 보여준다
function showToast(text, undo = null){
  $('toastText').textContent = text; $('toast').hidden = false;
  $('toastUndo').hidden = !undo;
  $('toastUndo').onclick = () => { $('toast').hidden = true; undo?.(); };
  clearTimeout(showToast.t); showToast.t = setTimeout(() => { $('toast').hidden = true; }, undo ? 7000 : 5000);
}
function save(){
  if (NO_SAVE) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (err){ console.warn('저장 실패', err); showToast('저장하지 못했어요. 캐릭터 페이지에서 기록을 파일로 저장해 주세요'); }
}

// ── 예시 데이터 (?demo) ──
function demoState(){
  let x = 7; const r = () => (x = (x*9301+49297)%233280)/233280;
  const foods = ['닭가슴살 밥','비빔밥','샐러드','김밥','제육 덮밥','된장찌개 밥','계란 샌드위치','연어 덮밥','파스타'];
  const types = Object.keys(MOVE_TYPES), born = addDays(TODAY, -45);
  const days = Object.fromEntries(Array.from({length:45}, (_, i) => i + 1).filter(() => r() > .3).map(i => {
    const meals = ['아침','점심','저녁'].filter(() => r() < .75).map(when => ({when, name:foods[Math.floor(r()*foods.length)]}));
    const moves = r() < .5 ? [{type:types[Math.floor(r()*types.length)], min:[20,30,40,60][Math.floor(r()*4)]}] : [];
    return [addDays(TODAY, -i), {mood:MOODS[Math.floor(r()*3)][0], rest:false, sleep:[5,5.5,6,6.5,7,7.5,8][Math.floor(r()*7)], moves, meals, goals:DEFAULT_GOALS}];
  }));
  return normalize({seed:2026, name:'콩이', personality:params.get('p') ?? 'curious', born, lastVisit:TODAY, visitDays:30, met:true, seenItems:-1, got:ALL_ITEMS.filter((_, i) => i % 4),
    days:{...days, [TODAY]:{mood:'good', sleep:7, moves:[{type:'달리기', min:30}], meals:[{when:'아침', name:'계란 샌드위치'}, {when:'점심', name:'비빔밥'}]}}});
}

// ── 상태 ──
const saved = loadSaved();
let state = DEMO ? demoState() : normalize(saved ?? {});
if (params.get('p') && PERSONALITIES[params.get('p')]) state = {...state, personality:params.get('p')};
if (AWAY){
  const n = Math.max(1, parseInt(params.get('away'), 10) || 3);
  state = {...state, met:true, lastVisit:addDays(TODAY, -n), born:state.met ? state.born : addDays(TODAY, -(n + 10))};
}
state = {...state, interests:growInterests(state, TODAY)};
const gapDays = daysBetween(state.lastVisit, TODAY);
const awayEntries = state.met && gapDays >= 2 ? awayLog(state, state.lastVisit, TODAY) : [];
const markVisit = s => ({...s, lastVisit:TODAY, visits:[...new Set([...s.visits, TODAY])].sort()});
if (state.lastVisit !== TODAY) state = {...markVisit(state), visitDays:state.visitDays + 1};

const todayRec = () => state.days[TODAY] ?? EMPTY_DAY;
const hasRecord = d => !!d && (d.mood || d.rest || d.sleep != null || d.moves.length || d.meals.length);
function setToday(patch){
  const next = {...todayRec(), goals:state.goals, ...patch};
  const {[TODAY]:_, ...rest} = state.days;
  state = {...state, days:hasRecord(next) ? {...rest, [TODAY]:next} : rest};
}
const lines = () => LINES[state.personality];
const pastLines = () => PAST[PERSONALITIES[state.personality].register];

// ── 점수 (v3 로직 유지. hits 는 life.js) ──
const scoreFood = name => hits(name).reduce((s, k) => s.map((v, i) => v + FOOD[k][0][i]), [0,0,0]);
const moveMinOf = moves => moves.reduce((a, m) => a + m.min, 0);
const proteinUpOf = moves => moveMinOf(moves) >= 60 || moves.some(m => m.type === '근력');
function dayScore(d, goals){
  const goal = goalBase(goals); if (proteinUpOf(d.moves)) goal[0]++;
  const got = d.meals.reduce((s, m) => s.map((v, i) => v + scoreFood(m.name)[i]), [0,0,0]);
  const fill = got.map((v, i) => Math.min(1, v/goal[i]));
  const nutri = Math.round(fill.reduce((a, b) => a + b)/3*100);
  const lack = Math.min(...fill) >= 1 ? -1 : fill.indexOf(Math.min(...fill));   // -1 = 다 채움
  const energy = d.sleep == null ? null : Math.round(Math.min(1, d.sleep/7.5)*80 + Math.min(moveMinOf(d.moves), 60)/60*20);
  return {nutri, energy, fill, lack, got, goal};
}
const today = () => dayScore(todayRec(), state.goals);

// ── 방 그리기 ──
const WEATHER_CODES = [[[0,1],'clear'], [[2,3,45,48],'cloud'], [[71,73,75,77,85,86],'snow']];
let weather = ['clear','cloud','rain','snow'].includes(params.get('weather')) ? params.get('weather') : 'clear';
async function loadWeather(){
  if (params.get('weather')) return;
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=weather_code', {signal:AbortSignal.timeout(4000)});
    if (!res.ok) throw new Error(`날씨 응답 ${res.status}`);
    const code = (await res.json()).current?.weather_code;
    if (!Number.isInteger(code)) throw new Error('날씨 코드 없음');
    weather = WEATHER_CODES.find(([codes]) => codes.includes(code))?.[1] ?? 'rain';
    render();
  } catch (err){ console.warn('날씨를 받지 못해 시간대만 반영', err); }   // 창문은 맑은 하늘로 유지
}
const owned = () => ownedItems(state, TODAY);
const ownedKinds = p => { const o = owned(); return p.kinds.map((_, k) => k).filter(k => o.has(`${p.id}:${k}`)); };
// 방에 놓인 것: 칸 → 종류. 고른 종류가 없으면 가진 것 중 첫 번째. 친구 코드에도 이 값이 들어간다
function myKinds(){
  return Object.fromEntries(PROPS.flatMap(p => {
    const ks = ownedKinds(p), pick = ks.includes(state.propKinds[p.id]) ? state.propKinds[p.id] : ks[0];
    return ks.length && (p.id === 'window' || !state.hiddenProps.includes(p.id)) ? [[p.id, pick]] : [];
  }));
}
// 방 그림은 도트 한 장 (pixel-room.js). 밤 어둠은 위에 덮는 층
function sceneBase({bare = false, kinds = myKinds()} = {}){
  const time = timeOf(hourNow());
  const jar = bare ? [] : state.picks.map(p => PICK_BY_ID[p.id].c);
  return `${pxImg(roomImage(kinds, time, weather, bare, jar), 'scene-img')}<div class="night" data-time="${time}" data-lamp="${!bare && kinds.lamp != null}"></div>`;
}

// ── 캐릭터 생활 ──
const SPOTS = {   // 발 위치 (scene 기준 %), by = 말풍선 높이 보정
  window:{x:50, y:62}, wander:{x:34, y:80}, wander2:{x:62, y:76}, center:{x:50, y:89}, desk:{x:71, y:65}, plant:{x:25, y:92}, bed:{x:15, y:46, lying:true},   // 누우면 머리만 베개 위, 몸은 이불 속
};
let tick = Math.floor(Date.now()/60000), talk = hash(Date.now()) % 100, greeted = false;
let poke = null, reply = null, newProp = null, replyTimer, pokeTimer, propTimer;
let override = null, overrideUntil = 0, gesture = null, gestureTimer;   // 잠깐 다른 일을 하게 할 때 (쪽지, 기록 대답)
const doFor = (act, ms) => { override = act; overrideUntil = Date.now() + ms; };
const pick = arr => arr[hash(talk + arr[0]) % arr.length];   // talk 나머지와 엇갈리게 (talk % 8 === 2 일 때 늘 같은 줄 X)
const nowActivity = () => override ?? activityFor(state, TODAY, hourNow(), tick);

function statusLine(){
  const d = todayRec(), t = today(), L = lines();
  if (timeOf(hourNow()) === 'night') return null;
  if ((t.energy != null && t.energy < 45) || (d.sleep != null && d.sleep < 6)) return {t:pick(L.sleepy)};
  if (!d.meals.length) return hourNow() >= 8 ? {t:pick(L.hungry), go:'meal'} : null;
  if (proteinUpOf(d.moves) && t.fill[0] < 1) return {t:pick(L.moved), go:'meal'};
  if (t.lack >= 0) return {t:pick(L.crave[t.lack]), go:'meal'};
  return {t:pick(L.full)};
}
function worldLines(){   // 날씨·계절. 밤에 맑음·흐림이면 계절
  const W = WORLD[register()];
  return timeOf(hourNow()) === 'night' && (weather === 'clear' || weather === 'cloud') ? W.season[seasonOf(TODAY)] : Math.floor(talk / 8) % 2 ? W.weather[weather] : W.season[seasonOf(TODAY)];
}
function askNow(){   // 아직 안 남긴 것: 기분 → 잠 → 식사 → 운동 순 (대화창 chat.js 도 씀)
  const d = todayRec(), A = ASK[register()], time = timeOf(hourNow()), no = k => skipped.includes(k);
  if (!d.mood && !no('mood')) return {kind:'mood', t:A.mood};
  if (d.sleep == null && time !== 'night' && !no('sleep')) return {kind:'sleep', t:A.sleep};
  if (!d.meals.length && !no('meal')) return {kind:'meal', t:A.meal[time]};
  if (!d.moves.length && !d.rest && time !== 'morning' && !no('move')) return {kind:'move', t:A.move};
  return null;
}
function speech(act){
  const L = lines();
  if (poke) return {t:poke};
  if (newProp) return {t:newProp};
  if (reply) return {t:reply};
  if (!ACTIVITIES[act].spot) return {t:pick(L.doing[act]), go:'park'};   // 나가 있을 땐 인사 대신 쪽지 글
  const q = askNow();   // 대화창에 물어본 게 남아 있으면 방 말풍선도 같은 말 (chat.js)
  if (q && q.kind === openAsk) return {t:q.t, go:'say'};
  if (!greeted){
    if (state.visitDays <= 2 && !hasRecord(todayRec())) return {t:pick(L.shy)};
    return {t:pick(L.hello[timeOf(hourNow())])};
  }
  if (talk % 3 === 0){ const q = askNow(); if (q) return {t:q.t, go:'say'}; }
  const met = recentMeets(3)[0];   // 친구 캐릭터와 만난 이야기 (town.js)
  if (talk % 7 === 6 && met) return {t:meetLine(met)};
  if (talk % 8 === 2) return {t:pick(worldLines())};
  if (talk % 9 === 5) return {t:pick(DEEP[register()][deepStage(daysBetween(state.born, TODAY))])};
  if (talk % 3 === 1){ const s = statusLine(); if (s) return s; }
  return {t:pick(L.doing[act])};
}
const josa = (w, pair) => { const c = w.charCodeAt(w.length-1) - 0xAC00; return w + (c >= 0 && c % 28 ? pair[0] : pair[1]); };
function say(text, ms = 3500){
  reply = text; clearTimeout(replyTimer);
  replyTimer = setTimeout(() => { reply = null; render(); }, ms);
}

let lastSceneKey = '', lastCharKey = '', currentGo = null;
function drawScene(){
  const key = JSON.stringify([timeOf(hourNow()), weather, myKinds(), state.picks.length]);
  if (key !== lastSceneKey){ $('sceneBase').innerHTML = sceneBase(); lastSceneKey = key; }
}
function drawActor(act){
  const t = today(), info = ACTIVITIES[act];
  const key = info.spot === 'wander' && tick % 2 ? 'wander2' : info.spot;
  const spot = SPOTS[key];
  const scene = $('scene');
  $('note').hidden = !!info.spot;
  $('actor').hidden = !info.spot;
  $('actor').classList.toggle('is-lying', !!spot?.lying);
  if (spot){ scene.style.setProperty('--x', spot.x); scene.style.setProperty('--y', spot.y); }
  else { scene.style.setProperty('--x', 50); scene.style.setProperty('--y', 74); }
  const yawning = gesture === 'yawn';
  const sleepy = act === 'nap' || yawning || (t.energy != null && t.energy < 45);
  const look = yawning ? {...state.look, mouth:4} : state.look;
  const lying = !!spot?.lying;
  const charKey = JSON.stringify([look, sleepy, Math.round(t.nutri/10), lying]);
  if (charKey !== lastCharKey){
    $('char').innerHTML = avatar(look, {sleepy, cheek:.15 + t.nutri/100*.6, crop:lying ? 'head' : ''});
    lastCharKey = charKey;
  }
  $('char').style.setProperty('--breath', (4.5 - (t.energy ?? 50)/100*2.2).toFixed(1) + 's');
  $('held').innerHTML = heldArt(info.held);
  if (!$('note').innerHTML) $('note').innerHTML = NOTE;
}
// 새로 생긴 소품 알리기. 칸이 처음 채워지면 방에 바로 놓이고, 이미 있던 칸이면 방 꾸미기에서 바꿀 수 있다
function announceItem(key){
  const {p} = itemOf(key), first = ownedKinds(p).length === 1;
  newProp = first ? `방에 ${josa(p.name, '이가')} 생겼어요!` : `새 ${josa(p.name, '이가')} 생겼어요! 방 꾸미기에서 바꿔 봐요`;
  clearTimeout(propTimer);
  propTimer = setTimeout(() => { newProp = null; render(); }, 4000);
}
// 시간이 지나 생긴 것. 가게·선물로 받은 건 gainItem 이 바로 알린다
function checkNewProp(){
  const n = owned().size;
  if (state.seenItems < 0 || !state.met){ if (state.seenItems !== n) state = {...state, seenItems:n}; return; }
  if (n <= state.seenItems) return;
  state = {...state, seenItems:n};
  announceItem(ITEM_ORDER[Math.min(ITEM_ORDER.length, Math.floor(together(state, TODAY)/ITEM_STEP) + 1) - 1]);
}
function gainItem(key){
  if (owned().has(key)) return false;
  state = {...state, got:[...state.got, key]};
  state = {...state, seenItems:owned().size};
  announceItem(key);
  return true;
}
function drawPanel(){
  if (typeof drawChat === 'function') drawChat();   // 질문이 바뀌면 입력칸 예시도 (chat.js)
}
function render(){
  const act = nowActivity();
  checkNewProp();
  drawScene(); drawActor(act); drawPanel();
  const s = speech(act);
  currentGo = s.go ?? null;
  $('bubble').textContent = s.t;
  $('bubble').classList.toggle('is-link', !!s.go);
  Object.keys(PAGES).forEach(id => { if ($(id).open) PAGES[id](); });
  if ($('rec').open) drawRec();
  save();
}
const hop = () => [$('char'), $('bubble')].forEach(el => { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); });
$('bubble').onanimationend = () => $('bubble').classList.remove('hop');
$('char').onanimationend = e => { if (e.animationName === 'hop') $('char').classList.remove('hop'); if (e.animationName === 'reach') $('char').classList.remove('reach'); };
$('char').onclick = () => {
  talk++; poke = pick(lines().poke); render(); hop();
  clearTimeout(pokeTimer); pokeTimer = setTimeout(() => { poke = null; talk++; render(); }, 2000);
};
$('bubble').onclick = () => { if (currentGo === 'meal') openMeal(-1); else if (currentGo === 'park') openPark(); else if (currentGo === 'say') $('sayInput').focus(); else { talk++; render(); } };
$('note').onclick = () => openPark();   // 쪽지 = 공원에 나가 있어요 → 공원에서 만남 (town.js)
setInterval(() => { greeted = true; talk++; tick = Math.floor(Date.now()/60000); if (Date.now() >= overrideUntil) override = null; render(); }, 15000);

// ── 한 줄 입력: 「점심에 김밥, 30분 걸었어」 → 잠·운동·식사·기분으로 나눠 남긴다 ──
const register = () => PERSONALITIES[state.personality].register;
const summary = r => [
  ...(r.mood ? [MOODS.find(([k]) => k === r.mood)[1]] : []), ...(r.rest ? ['아무것도 안 한 날'] : []),
  ...(r.sleep != null ? [`잠 ${r.sleep}시간`] : []), ...r.moves.map(m => `${m.type} ${m.min}분`), ...r.meals.map(m => `${m.when} ${m.name}`),
].join(' · ');
// 기록 전후를 비교해 캐릭터가 차례로 대답 (시트·한 줄 입력 공용)
function reactAfter(before, after, first = []){
  reactionTimers.forEach(clearTimeout);
  const walked = !before.moves.length && after.moves.length && state.parkDay !== TODAY;   // 오늘 첫 운동이면 공원으로 초대
  const list = [...first, ...reactionsAfterRecord(before, after, state.personality), ...(walked ? [{t:PARK_TALK[register()].invite, go:'park'}] : [])];
  reactionTimers = list.map((r, i) => setTimeout(() => playReaction(r), i*REACTION_GAP_MS));
  reactionTimers.push(askAfter(list.length*REACTION_GAP_MS));   // 다 대답하면 다음 질문
}
$('sayForm').onsubmit = e => {
  e.preventDefault();
  const text = $('sayInput').value.trim(); if (!text) return;
  chatPush(true, text);
  const r = parseAnswer(text, openAsk, guessWhen());
  if (r.skip){ $('sayInput').value = ''; const t = pick(lines().rest); skipAsk(openAsk); say(t); chatPush(false, t); askAfter(0); render(); return; }
  if (isEmptyParse(r)){ $('sayInput').value = ''; say(WHAT[register()], 5000); chatPush(false, WHAT[register()]); render(); hop(); return; }
  const before = todayRec(), L = lines();
  setToday({
    ...(r.mood ? {mood:r.mood} : {}), ...(r.rest ? {rest:true} : {}), ...(r.sleep != null ? {sleep:r.sleep} : {}),
    moves:[...before.moves, ...r.moves], meals:[...before.meals, ...r.meals],
  });
  $('sayInput').value = '';
  window.clarity?.('event', 'record_line');   // Clarity Smart Event 후보: 알아들은 한 줄만
  if (r.mood) window.clarity?.('event', 'mood');
  const t = today(), food = r.meals.flatMap(m => hits(m.name));
  const first = [
    ...(r.mood && r.mood !== before.mood ? [{t:pick(L.mood[r.mood])}] : []),
    ...(r.meals.length ? [{t:pick(L.ate) + (!food.length ? L.unknown : t.lack < 0 ? pick(L.full) : pick(L.crave[t.lack]))}] : []),
  ];
  reactAfter(before, todayRec(), first);
  chatUndo(before);   // 되돌리기는 내 말풍선 밑에 (chat.js). 위 알림은 대화창과 겹쳐서 안 띄움
  render();
};

// ── 기록 시트 (2단계). 칩으로 고르고, 자세히는 3단계로 ──
const REACTION_GAP_MS = 3600;
const SLEEP_QUICK = [['적게', 5], ['보통', 7], ['푹', 9]];
const MOVE_QUICK = [['가볍게', {type:'걷기', min:20}], ['땀 흘렸어요', {type:'달리기', min:40}]];
function drawRec(){
  const d = todayRec();
  const quick = SLEEP_QUICK.some(([, v]) => v === d.sleep);
  $('recSleep').innerHTML = SLEEP_QUICK.map(([label, v]) => `<button type="button" class="chip" data-sq="${v}" aria-pressed="${d.sleep === v}">${label}</button>`).join('')
    + `<button type="button" class="chip" data-open="sleep" aria-pressed="${d.sleep != null && !quick}">${d.sleep != null && !quick ? d.sleep + '시간' : '자세히'}</button>`;
  const single = d.moves.length === 1 ? d.moves[0] : null;
  $('recMove').innerHTML = MOVE_QUICK.map(([label, m], i) => `<button type="button" class="chip" data-mq="${i}" aria-pressed="${single?.type === m.type && single?.min === m.min}">${label}</button>`).join('')
    + `<button type="button" class="chip" data-page="movePage">${d.moves.length ? moveMinOf(d.moves) + '분 · 자세히' : '자세히'}</button>`;
  $('recMeal').innerHTML = `<button type="button" class="chip" data-newmeal>먹은 거 적기</button><button type="button" class="chip" data-page="nutriPage">${d.meals.length ? d.meals.length + '번 · 영양 보기' : '영양 보기'}</button>`;
  $('recRest').setAttribute('aria-pressed', d.rest);
}
// 시트가 방을 가리므로 대답은 닫을 때 한다
let recBefore = EMPTY_DAY, ateLine = null, reactionTimers = [];
function openRec(){ recBefore = todayRec(); ateLine = null; drawRec(); $('rec').returnValue = ''; $('rec').showModal(); }
function reactionsAfterRecord(before, after, personality){
  const A = AFTER_RECORD[personality], list = [];
  if (after.rest && !before.rest) return [{t:pick(LINES[personality].rest)}];
  if (after.sleep != null && after.sleep !== before.sleep){
    const level = after.sleep < 6 ? 'low' : after.sleep < 8 ? 'ok' : 'good';
    list.push({t:A[level], gesture:level === 'low' ? 'yawn' : 'reach'});
  }
  if (after.moves.length && JSON.stringify(after.moves) !== JSON.stringify(before.moves)) list.push({t:A.move, act:'stretch'});
  return list;
}
function playReaction(r){
  const current = nowActivity();
  say(r.t); chatPush(false, r.t, r.go);
  if (r.act) doFor(r.act, 8000);
  else if (current === 'nap' || current === 'walk') doFor('wander', 8000);   // 자거나 나가 있으면 먼저 나타난다
  clearTimeout(gestureTimer);
  gesture = r.gesture === 'yawn' ? 'yawn' : null;
  if (gesture) gestureTimer = setTimeout(() => { gesture = null; render(); }, 2500);
  render();
  const el = $('char');
  if (r.gesture === 'reach'){ el.classList.remove('reach'); void el.offsetWidth; el.classList.add('reach'); }
}
$('rec').onclose = () => {
  reactAfter(recBefore, todayRec(), ateLine ? [{t:ateLine}] : []);
  ateLine = null;
  if ($('calPage').open) drawCal();   // 달력에서 열었으면 바로 반영
};
$('rec').addEventListener('click', e => {
  const sq = e.target.closest('[data-sq]');
  if (sq){ const v = +sq.dataset.sq; setToday({sleep:todayRec().sleep === v ? null : v}); render(); }
  const mq = e.target.closest('[data-mq]');
  if (mq){ const m = MOVE_QUICK[+mq.dataset.mq][1], single = todayRec().moves.length === 1 ? todayRec().moves[0] : null;
    setToday({moves:single?.type === m.type && single?.min === m.min ? [] : [m]}); render(); }
  if (e.target.closest('[data-newmeal]')) openMeal(-1);
});
$('recRest').onclick = () => {
  const on = !todayRec().rest; setToday({rest:on});
  render();
};

// ── 수면 ──
let sleepDraft = 7;
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) openSheet(o.dataset.open);
  const m = e.target.closest('[data-meal]'); if (m) openMeal(+m.dataset.meal);
  const pg = e.target.closest('[data-page]'); if (pg) openPage(pg.dataset.page);
});
function openSheet(id){
  if (id === 'sleep'){ sleepDraft = todayRec().sleep ?? 7; $('sleepStep').textContent = sleepDraft + '시간'; }
  $(id).returnValue = ''; $(id).showModal();
}
document.querySelectorAll('[data-step]').forEach(b => b.onclick = () => {
  sleepDraft = Math.max(0, Math.min(14, sleepDraft + +b.dataset.step));
  $('sleepStep').textContent = sleepDraft + '시간';
});
$('sleep').onclose = () => { if ($('sleep').returnValue === 'ok'){ setToday({sleep:sleepDraft}); render(); } };

// ── 운동 ──
let moveType = '걷기', moveMinDraft = 30;
function drawMoveSheet(){
  $('moveTypes').innerHTML = Object.keys(MOVE_TYPES).map(k => `<button type="button" class="chip" aria-pressed="${k === moveType}" data-mt="${k}">${k}</button>`).join('');
  $('moveStep').textContent = moveMinDraft + '분';
}
function openMove(){ moveType = '걷기'; moveMinDraft = 30; drawMoveSheet(); $('move').returnValue = ''; $('move').showModal(); }
$('moveTypes').onclick = e => { const b = e.target.closest('[data-mt]'); if (b){ moveType = b.dataset.mt; drawMoveSheet(); } };
document.querySelectorAll('[data-mstep]').forEach(b => b.onclick = () => { moveMinDraft = Math.max(10, Math.min(240, moveMinDraft + +b.dataset.mstep)); drawMoveSheet(); });
$('move').onclose = () => { if ($('move').returnValue === 'ok'){ setToday({moves:[...todayRec().moves, {type:moveType, min:moveMinDraft}]}); render(); } };
function drawMovePage(){
  const d = todayRec(), min = moveMinOf(d.moves);
  $('movePageBody').innerHTML = `
    <p class="big">${min ? `오늘 ${min}분` : '오늘 운동을<br>기록해 보세요'}</p>
    ${min && proteinUpOf(d.moves) ? '<p class="sub">단백질 목표가 1 늘었어요</p>' : ''}
    ${d.moves.length ? '<p class="sec">오늘 한 운동</p>' : ''}
    ${d.moves.map((m, i) => `<div class="row">
      <div class="row__h"><span>${esc(m.type)} <span class="num">${m.min}분</span></span><button type="button" class="del" data-delmove="${i}">삭제</button></div>
      <p class="sub">${MOVE_TYPES[m.type]}</p></div>`).join('')}`;
}
$('movePageBody').onclick = e => { const b = e.target.closest('[data-delmove]'); if (b){ setToday({moves:todayRec().moves.filter((_, i) => i !== +b.dataset.delmove)}); render(); } };
$('addMove').onclick = openMove;

// ── 영양 (숫자는 여기에만) ──
const byMealOrder = (a, b) => MEALS.indexOf(a.when) - MEALS.indexOf(b.when);
const fromFoods = (meals, i) => [...meals].sort(byMealOrder).flatMap(m => hits(m.name)).filter(k => FOOD[k][0][i] > 0).map(k => `${k} +${FOOD[k][0][i]}`).join(' · ');
function drawNutriPage(){
  const t = today(), meals = todayRec().meals;
  $('nutriPageBody').innerHTML = `
    ${meals.length
      ? `<p class="big">영양 ${t.nutri}<button type="button" class="q" popovertarget="howScore" aria-label="점수 계산 방법">?</button></p>
         <p class="sub">${t.lack < 0 ? '오늘 든든해요' : `${josa(NUT[t.lack], '이가')} 당겨요. ${NUT_TIP[t.lack]}`}</p>`
      : '<p class="big">오늘 먹은 걸<br>기록해 보세요</p>'}
    <div class="sec sec--row"><span>오늘 채운 영양</span><button type="button" class="link" id="editGoals">목표 수정</button></div>
    ${NUT.map((n, i) => `<div class="row n${i}">
      <div class="row__h"><span><i class="nut-dot"></i>${n}</span><span class="num">${t.got[i]} / ${t.goal[i]}</span></div>
      <div class="bar"><i style="width:${t.fill[i]*100}%"></i></div>
      <p class="sub"><b>${fromFoods(meals, i) || '아직 채운 음식 없음'}</b></p></div>`).join('')}
    ${meals.length ? '<p class="sec">오늘 먹은 것</p>' : ''}
    ${meals.map((m, i) => ({m, i})).sort((a, b) => byMealOrder(a.m, b.m)).map(({m, i}) => { const hs = hits(m.name);
      return `<div class="row">
        <div class="row__h"><span class="when">${m.when}</span><button type="button" class="link" data-meal="${i}" aria-label="${m.when} ${esc(m.name)} 수정">수정</button></div>
        <p class="food">${esc(m.name)}</p>
        ${hs.length ? hs.map(k => `<p class="sub"><b>${k}</b> · ${FOOD[k][1]}</p>`).join('') : '<p class="sub">아직 모르는 음식이에요</p>'}</div>`; }).join('')}`;
}
$('nutriPageBody').addEventListener('click', e => { if (e.target.closest('#editGoals')) openGoals(); });
$('addMeal').onclick = () => openMeal(-1);

// ── 목표 (첫 시작에서 빼고 영양·캐릭터 페이지에서) ──
let goalDraft = DEFAULT_GOALS;
function drawGoals(){
  $('goalMeals').innerHTML = MEAL_COUNTS.map(n => `<button type="button" class="chip" aria-pressed="${n === goalDraft.meals}" data-gm="${n}">${n}끼${n === 4 ? ' (간식 포함)' : ''}</button>`).join('');
  $('goalAim').innerHTML = AIMS.map((a, i) => `<button type="button" class="chip" aria-pressed="${i === goalDraft.aim}" data-ga="${i}">${a.label}</button>`).join('');
  $('goalSum').innerHTML = '하루 목표 · ' + goalBase(goalDraft).map((v, i) => `${NUT[i]} <b>${v}</b>`).join(' · ');
}
function openGoals(){ goalDraft = state.goals; drawGoals(); $('goals').returnValue = ''; $('goals').showModal(); }
$('goalMeals').onclick = e => { const b = e.target.closest('[data-gm]'); if (b){ goalDraft = {...goalDraft, meals:+b.dataset.gm}; drawGoals(); } };
$('goalAim').onclick = e => { const b = e.target.closest('[data-ga]'); if (b){ goalDraft = {...goalDraft, aim:+b.dataset.ga}; drawGoals(); } };
$('goals').onclose = () => { if ($('goals').returnValue === 'ok'){ state = {...state, goals:goalDraft}; render(); } };

// ── 식사 ──
let mealIdx = -1, whenDraft = '아침';
const guessWhen = () => { const h = hourNow(),   // 캐릭터 질문과 같은 시계
 k = h < 4 ? '간식' : h < 10 ? '아침' : h < 15 ? '점심' : h < 21 ? '저녁' : '간식';
  return todayRec().meals.some(m => m.when === k) ? '간식' : k; };
function frequentFoods(){   // 자주 먹은 음식 먼저. 앱이 추측해서 단정하지 않고 고르게만 한다
  const counts = Object.values(state.days).flatMap(d => d.meals).reduce((acc, m) => ({...acc, [m.name]:(acc[m.name] ?? 0) + 1}), {});
  const mine = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return [...new Set([...mine, ...SUGGEST])].slice(0, 6);
}
function drawWhen(){ $('whenChips').innerHTML = MEALS.map(k => `<button type="button" class="chip" aria-pressed="${k === whenDraft}" data-when="${k}">${k}</button>`).join(''); }
$('whenChips').onclick = e => { const b = e.target.closest('[data-when]'); if (b){ whenDraft = b.dataset.when; drawWhen(); } };
function openMeal(i){
  mealIdx = i; const m = todayRec().meals[i];
  whenDraft = m ? m.when : guessWhen(); drawWhen();
  $('mealInput').value = m?.name || ''; $('mealSave').disabled = !m;
  $('mealSave').textContent = m ? '고치기' : '기록';
  $('mealDel').hidden = !m;
  $('mealChips').innerHTML = frequentFoods().map(s => `<button type="button" class="chip" data-sg="${esc(s)}">${esc(s)}</button>`).join('');
  $('meal').returnValue = ''; $('meal').showModal();
}
$('mealInput').oninput = () => $('mealSave').disabled = !$('mealInput').value.trim();
$('mealChips').onclick = e => { const b = e.target.closest('[data-sg]'); if (b){ $('mealInput').value = b.dataset.sg; $('mealSave').disabled = false; } };
$('meal').onclose = () => {
  const meals = todayRec().meals;
  if ($('meal').returnValue === 'del'){ setToday({meals:meals.filter((_, i) => i !== mealIdx)}); render(); return; }
  const name = $('mealInput').value.trim();
  if ($('meal').returnValue !== 'ok' || !name) return;
  const meal = {when:whenDraft, name};
  setToday({meals:mealIdx < 0 ? [...meals, meal] : meals.map((m, i) => i === mealIdx ? meal : m)});
  const t = today(), L = lines();
  const after = !hits(name).length ? L.unknown : t.lack < 0 ? pick(L.full) : pick(L.crave[t.lack]);
  const line = pick(L.ate) + after;
  if ($('rec').open){ ateLine = line; render(); return; }   // 시트를 닫을 때 말한다
  say(line);
  render(); hop();
};

// ── 꾸미기 ──
let draft = state.look, tab = 'hair', onEditClose = null;
function drawEdit(){
  $('preview').innerHTML = avatar(draft);
  $('tabs').innerHTML = PARTS.map(p => `<button type="button" class="tab" role="tab" aria-selected="${p.k === tab}" data-tab="${p.k}">${p.label}</button>`).join('');
  const p = PARTS.find(x => x.k === tab), n = partSize(p);
  $('opts').innerHTML = Array.from({length:n}, (_, i) => `<button type="button" class="opt ${p.colors ? '' : 'thumb'}" aria-pressed="${draft[p.k] === i}" data-opt="${i}" aria-label="${p.label} ${i + 1}">
      ${p.colors ? `<span class="swatch" style="background:${p.colors[i]}"></span>` : avatar({...draft, [p.k]:i}, {crop:p.crop || 'face'})}
    </button>`).join('');
}
$('tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b){ tab = b.dataset.tab; drawEdit(); } };
$('opts').onclick = e => { const b = e.target.closest('[data-opt]'); if (b){ draft = {...draft, [tab]:+b.dataset.opt}; drawEdit(); } };
$('rand').onclick = () => { draft = Object.fromEntries(PARTS.map(p => [p.k, Math.floor(Math.random()*partSize(p))])); drawEdit(); };
function openEdit(title, then = null){
  draft = state.look; onEditClose = then; $('editTitle').textContent = title;
  $('edit').returnValue = ''; drawEdit(); $('edit').showModal();
}
$('edit').onclose = () => {
  if ($('edit').returnValue === 'ok'){ state = {...state, look:draft}; render(); if (!onEditClose) hop(); }
  const then = onEditClose; onEditClose = null; if (then) then();
};

// ── 달력: 안 남긴 날에도 캐릭터의 하루는 있다 ──
let calMonth = new Date(dayNow().getFullYear(), dayNow().getMonth(), 1), calSel = TODAY;
const WEEK = ['일','월','화','수','목','금','토'];
const pad = n => String(n).padStart(2, '0');
function drawCal(){
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), last = new Date(y, m + 1, 0).getDate();
  const keys = Array.from({length:last}, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`);
  const isThisMonth = TODAY.startsWith(`${y}-${pad(m + 1)}`);
  $('calBody').innerHTML = `
    <div class="cal-nav">
      <button type="button" class="cal-arrow" data-cm="-1" aria-label="이전 달">‹</button>
      <h3>${y}년 ${m + 1}월</h3>
      <button type="button" class="cal-arrow" data-cm="1" aria-label="다음 달" ${isThisMonth ? 'disabled' : ''}>›</button>
    </div>
    <div class="cal">
      ${WEEK.map(w => `<span class="cal__w">${w}</span>`).join('')}
      ${'<span></span>'.repeat(new Date(y, m, 1).getDay())}
      ${keys.map((k, i) => { const d = state.days[k];
        const dots = d ? [[d.sleep != null, 'sleep'], [d.moves.length, 'move'], [d.meals.length, 'meal']].filter(([on]) => on).map(([, c]) => `<i class="dot-${c}"></i>`).join('') : '';
        return `<button type="button" class="cday ${k === TODAY ? 'cday--today' : ''}" data-day="${k}" aria-pressed="${k === calSel}" ${k > TODAY ? 'disabled' : ''}>
          ${i + 1}<span class="cday__dots">${dots}</span></button>`; }).join('')}
    </div>
    <p class="cal-legend"><span><i class="dot-sleep"></i>수면</span><span><i class="dot-move"></i>운동</span><span><i class="dot-meal"></i>식사</span></p>
    ${calSel ? dayDetail(calSel) : ''}`;
}
function dayDetail(key){
  const d = state.days[key], [y, mo, da] = key.split('-').map(Number);
  const title = `<p class="sec">${mo}월 ${da}일 ${WEEK[new Date(y, mo - 1, da).getDay()]}요일</p>`;
  const met = key >= state.born;
  const life = met ? `<p class="life">${esc(state.name)}: ${pastLines()[activityFor(state, key, 14)]}</p>` : '';
  const edit = key === TODAY ? `<button type="button" class="chip cal-edit" data-edit>${hasRecord(d) ? '오늘 기록 고치기' : '오늘 기록 남기기'}</button>` : '';
  if (!hasRecord(d)) return title + life + edit;
  const row = (k, v) => `<div class="row"><div class="row__h"><span>${k}</span><span class="num">${v}</span></div></div>`;
  return title + life
    + (d.mood ? row('기분', MOODS.find(([k]) => k === d.mood)[1]) : '')
    + (d.rest ? row('그날', '아무것도 안 한 날') : '')
    + (d.sleep != null ? row('수면', d.sleep + '시간') : '')
    + (d.moves.length ? row('운동', d.moves.map(m => `${m.type} ${m.min}분`).join(' · ')) : '')
    + [...d.meals].sort(byMealOrder).map(m => row(esc(m.name), m.when)).join('') + edit;
}
$('calBtn').onclick = () => { calSel = TODAY; calMonth = new Date(dayNow().getFullYear(), dayNow().getMonth(), 1); drawCal(); $('calPage').showModal(); };
$('calBody').onclick = e => {
  const nav = e.target.closest('[data-cm]'); if (nav){ calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +nav.dataset.cm, 1); calSel = null; drawCal(); return; }
  if (e.target.closest('[data-edit]')){ openRec(); return; }
  const day = e.target.closest('[data-day]'); if (day){ calSel = calSel === day.dataset.day ? null : day.dataset.day; drawCal(); }
};

// ── 방 꾸미기 ──
function drawRoomPage(){
  $('roomPreview').innerHTML = `<div class="scene__base">${sceneBase()}</div><div class="actor actor--static" style="--x:50;--y:88"><div class="char">${avatar(state.look, {shadow:false})}</div></div>`;
  const on = myKinds();
  $('roomBody').innerHTML = `
    <p class="sub">함께 지내다 보면, 가게에 들르면, 친구가 보내 주면 소품이 생겨요</p>
    <div class="props-grid">${PROPS.map(p => { const ks = ownedKinds(p), k = on[p.id];
      return `<button type="button" class="pcard ${ks.length ? '' : 'is-locked'}" data-prop="${p.id}" ${ks.length ? `aria-pressed="${k != null}"` : 'disabled'}>
        <span class="pcard__img">${kindArt(p, k ?? ks[0] ?? 0)}</span><b>${p.name}</b>
        <span class="pcard__st">${!ks.length ? '아직 없어요' : k == null ? '빼 뒀어요' : `${p.kinds[k]} · ${ks.length}/${p.kinds.length}`}</span></button>`; }).join('')}</div>`;
}
let propSel = null;
function drawPropSheet(){
  const p = PROPS.find(x => x.id === propSel), k = myKinds()[p.id] ?? -1, ks = ownedKinds(p);
  $('propTitle').textContent = p.name;
  $('propKinds').innerHTML = p.kinds.map((name, i) => ks.includes(i)
      ? `<button type="button" class="pcard" data-kind="${i}" aria-pressed="${i === k}"><span class="pcard__img">${kindArt(p, i)}</span><b>${name}</b></button>`
      : `<button type="button" class="pcard is-locked" disabled><span class="pcard__img">${kindArt(p, i)}</span><b>아직 없어요</b></button>`).join('')
    + (p.id === 'window' ? '' : `<button type="button" class="pcard" data-kind="-1" aria-pressed="${k === -1}"><span class="pcard__none">–</span><b>없음</b></button>`);
}
$('roomBtn').onclick = () => { drawRoomPage(); $('roomPage').showModal(); };
$('roomBody').onclick = e => { const b = e.target.closest('[data-prop]:not(:disabled)'); if (!b) return;
  propSel = b.dataset.prop; drawPropSheet(); $('propSheet').showModal(); };
$('propKinds').onclick = e => { const b = e.target.closest('[data-kind]'); if (!b) return;
  const k = +b.dataset.kind, rest = state.hiddenProps.filter(x => x !== propSel);
  state = k < 0 ? {...state, hiddenProps:[...rest, propSel]} : {...state, propKinds:{...state.propKinds, [propSel]:k}, hiddenProps:rest};
  render(); $('propSheet').close(''); };

// ── 캐릭터 페이지: 알아가는 곳 + 백업 ──
function memoriesOf(){
  const fmt = key => { const [, m, d] = key.split('-').map(Number); return `${m}월 ${d}일`; };
  const firstRec = Object.keys(state.days).sort()[0];
  const firstGift = new Map([...state.mail].reverse().map(m => [m.from, m.date]));   // 친구마다 처음 받은 날
  return [
    [state.born, '처음 만난 날'],
    ...(firstRec ? [[firstRec, '하루를 처음 나눈 날']] : []),
    ...state.interests.slice(1).filter(x => x.on <= TODAY).map(x => [x.on, `${INTERESTS[x.id].label}에 관심이 생긴 날`]),
    ...state.friends.map(f => [f.at, `${esc(f.room.name)}네 방에 처음 놀러 간 날`]),
    ...state.friends.map(f => [firstMeet(f), `${esc(withRang(f.room.name))} 마을에서 처음 만난 날`]).filter(([d]) => d),
    ...[...firstGift].map(([from, d]) => [d, `${esc(from)}에게 인사를 받은 날`]),
  ].sort((a, b) => b[0].localeCompare(a[0])).map(([k, t]) => [fmt(k), t]);
}
function drawCharPage(){
  const P_ = PERSONALITIES[state.personality];
  $('charBody').innerHTML = `
    <div class="me"><div class="me__av thumb">${avatar(state.look, {crop:'face'})}</div>
      <div class="me__t"><label class="me__label" for="nameInput">이름</label><input class="field" id="nameInput" maxlength="12" value="${esc(state.name)}"><p class="sub">${P_.label}</p></div></div>
    <p class="sec">요즘 좋아하는 것</p>
    <div class="chips">${interestsOn(state, TODAY).map(id => `<span class="tag">${INTERESTS[id].label}</span>`).join('')}</div>
    <p class="sub" style="margin-top:8px">소품 ${owned().size} / ${ALL_ITEMS.length}</p>
    <p class="sec">기억</p>
    ${memoriesOf().map(([d, t]) => `<div class="row"><div class="row__h"><span>${t}</span><span class="num">${d}</span></div></div>`).join('')}
    <p class="sec">설정</p>
    <div class="chips"><button type="button" class="chip" id="decoBtn">꾸미기</button><button type="button" class="chip" id="goalBtn">하루 목표</button></div>
    <p class="sec">기록 보관</p>
    <p class="sub">기록은 이 브라우저에만 있어요. 브라우저 데이터를 지우면 함께 사라져요.</p>
    <div class="chips"><button type="button" class="chip" id="exportBtn">파일로 저장</button><label class="chip chip--file">파일에서 불러오기<input type="file" id="importInput" accept="application/json,.json" hidden></label></div>`;
}
$('charBtn').onclick = () => { drawCharPage(); $('charPage').showModal(); };
$('charBody').addEventListener('click', e => {
  if (e.target.closest('#decoBtn')) openEdit('캐릭터 꾸미기');
  if (e.target.closest('#goalBtn')) openGoals();
  if (e.target.closest('#exportBtn')) exportData();
});
$('charBody').addEventListener('change', e => {
  if (e.target.id === 'nameInput'){ state = {...state, name:e.target.value.trim().slice(0, 12) || '하루'}; save(); }
  if (e.target.id === 'importInput') importData(e.target.files[0]);
});
function exportData(){
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}));
  const a = document.createElement('a');
  a.href = url; a.download = `하루2-기록-${TODAY}.json`; a.click();
  URL.revokeObjectURL(url);
}
async function importData(file){
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    if (![1, 2].includes(raw?.v) || typeof raw.days !== 'object' || raw.days === null) throw new Error('하루 2 기록 파일이 아님');
    if (!confirm('지금 기록을 이 파일 내용으로 바꿀까요?')) return;
    const next = markVisit(normalize(raw));
    state = {...next, interests:growInterests(next, TODAY)};
    render(); drawCharPage(); showToast('기록을 불러왔어요');
  } catch (err){
    console.warn('기록 불러오기 실패', err);
    showToast('이 파일은 불러올 수 없어요. 하루 2에서 저장한 파일을 골라 주세요');
  }
}
const PAGES = {movePage:drawMovePage, nutriPage:drawNutriPage, roomPage:drawRoomPage, charPage:drawCharPage};
function openPage(id){ PAGES[id](); $(id).showModal(); }

// ── 첫 시작: 1~2분, 언제든 건너뛰기 ──
let firstStep = 0, firstDraft = {personality:'calm', name:'', plant:0};
function firstActor(look, line, {shadow = false} = {}){
  return `<div class="actor actor--static" style="--x:50;--y:88"><div class="char ${shadow ? 'char--shade' : ''}">${avatar(look, {shadow:false})}</div></div>
    ${line ? `<p class="bubble bubble--static" style="--x:50;--y:88">${esc(line)}</p>` : ''}`;
}
function firstFrame(scene, body){
  return `<div class="first__top"><button type="button" class="text-btn" data-first="skip">건너뛰기</button></div>
    <div class="scene scene--first">${scene}</div><div class="first__body">${body}</div>`;
}
function drawFirst(){
  const bare = `<div class="scene__base">${sceneBase({bare:true})}</div>`, full = `<div class="scene__base">${sceneBase()}</div>`;
  const casual = PERSONALITIES[firstDraft.personality].register === 'casual';
  // 미연시처럼: 그림 위, 아래 대화창에 장면 한 줄 + 고르기 (공원·대화창과 같은 말투)
  const vn = (text, inner) => `<div class="vn vn--first"><p class="vn__t" tabindex="-1">${text}</p>${inner}</div>`;
  const opt = (act, label) => `<div class="vn__opts"><button type="button" class="vn__opt" data-first="${act}">${label}</button></div>`;
  const views = [
    () => firstFrame(bare, vn('작은 방이 하나 있다.<br>아직 아무것도 없다.', opt('next', '들어가 본다'))),
    () => firstFrame(bare + firstActor(state.look, '여기… 있어도 되는 거야?', {shadow:true}), vn('…방 한가운데 누군가 서 있다.', opt('edit', '어떤 모습인지 본다'))),
    () => firstFrame(bare + firstActor(state.look, PERSONALITIES[firstDraft.personality].sample), vn('이 아이는 어떤 성격일까?<br>이름도 지어 줄까?', `
        <div class="vn__opts">${Object.entries(PERSONALITIES).map(([k, p]) => `<button type="button" class="vn__opt" data-pers="${k}" aria-pressed="${k === firstDraft.personality}">${p.label}</button>`).join('')}</div>
        <input class="field first__name" id="firstName" maxlength="12" placeholder="이름 (안 지어도 돼요)" aria-label="캐릭터 이름" value="${esc(firstDraft.name)}">
        ${opt('next', '이렇게 부를게')}`)),
    () => firstFrame(full + firstActor(state.look, ''), vn('창가가 조금 허전하다.<br>화분을 하나 둘까?', `
        <div class="props-grid">${PROPS[0].kinds.map((n, i) => `<button type="button" class="pcard" data-kind="${i}" data-plant="${i}" aria-pressed="${i === firstDraft.plant}"><span class="pcard__img">${kindArt(PROPS[0], i)}</span><b>${n}</b></button>`).join('')}</div>
        ${opt('next', '여기 둔다')}`)),
    () => firstFrame(full + firstActor(state.look, casual ? '앞으로 여기서 같이 지내는 거야?' : '앞으로 여기서 같이 지내는 거예요?'), vn(`${esc(josa(state.name, ['이가', '가']))} 나를 바라본다.`, opt('done', '응, 같이 지내자'))),
  ];
  $('firstBody').innerHTML = views[firstStep]();
  $('firstBody').querySelector('.vn__t').focus();   // 화면이 바뀌면 장면 문장부터 읽히게
}
function commitFirst(){
  const name = $('firstName')?.value ?? firstDraft.name;
  firstDraft = {...firstDraft, name};
  state = {...state, personality:firstDraft.personality, name:name.trim().slice(0, 12) || '하루',
    propKinds:{...state.propKinds, plant:firstDraft.plant}, got:[...state.got.filter(k => !k.startsWith('plant:')), `plant:${firstDraft.plant}`]};
}
function endFirst(){
  commitFirst(); reply = null;
  state = {...state, met:true, seenItems:owned().size};
  if ($('first').open) $('first').close();
  render();
  homeReady();
}
$('firstBody').addEventListener('click', e => {
  const act = e.target.closest('[data-first]')?.dataset.first;
  if (act === 'skip' || act === 'done') return endFirst();
  if (act === 'edit') return openEdit('어떤 모습일까요?', () => { firstStep = 2; drawFirst(); });
  if (act === 'next'){ commitFirst(); firstStep++; return drawFirst(); }
  const pers = e.target.closest('[data-pers]');
  if (pers){ commitFirst(); firstDraft = {...firstDraft, personality:pers.dataset.pers}; return drawFirst(); }
  const plant = e.target.closest('[data-plant]');
  if (plant){ firstDraft = {...firstDraft, plant:+plant.dataset.plant}; commitFirst(); return drawFirst(); }
});
$('first').addEventListener('cancel', e => { e.preventDefault(); endFirst(); });

// ── 복귀 ──
function openBack(){
  const L = lines();
  $('backTitle').textContent = L.back;
  $('backFace').innerHTML = avatar(state.look, {crop:'face'});
  $('backLog').innerHTML = awayEntries.map(({date, id}) => {
    const [y, m, d] = date.split('-').map(Number);
    return `<div class="row"><div class="row__h"><span>${pastLines()[id]}</span><span class="num">${WEEK[new Date(y, m - 1, d).getDay()]}요일</span></div></div>`;
  }).join('');
  $('back').returnValue = ''; $('back').showModal();
}
$('back').onclose = () => { greeted = false; render(); hop(); homeReady(); };
// 홈이 보일 때 한 번: 받은 친구 코드 처리 등 (town.js 가 듣는다)
const homeReady = () => document.dispatchEvent(new Event('haru:ready'));

// ── 공통 시트 동작 ──
document.querySelectorAll('dialog').forEach(d => {
  if (d.id !== 'first') d.addEventListener('click', e => { if (e.target === d) d.close(''); });   // 바깥 누르면 저장 없이 닫기
  const f = d.querySelector('.sheet'); if (!f) return;
  const h = f.querySelector('h2');
  f.insertAdjacentHTML('afterbegin', '<button class="x" value="" aria-label="닫기">✕</button>');
  h.tabIndex = -1; h.autofocus = true;
});

// 날짜가 바뀌면 새 하루로 (켜둔 채 새벽 4시를 넘긴 경우 포함)
const checkDay = () => { if (iso(dayNow()) !== TODAY) location.reload(); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
setInterval(checkDay, 60000);

// 시작은 town.js 를 불러온 뒤 (공원·친구 코드가 거기 있음)
function start(){
  render();
  loadWeather();
  if (!state.met) openTitle();   // 타이틀 → 시작하기 → 첫 시작 (title.js)
  else if (awayEntries.length) openBack();
  else homeReady();
}
