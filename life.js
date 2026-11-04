// 캐릭터의 생활 계산. 서버 없이 날짜와 고유값만으로 그날 한 일을 정한다.
// 화면을 건드리지 않는 순수 함수만 둔다. 확인: node life.js

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

// spot = 방 안 자리. null 이면 잠깐 나가 있음 (방에 쪽지만 남음)
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
  const list = Object.values(days);
  return {
    walk:  list.filter(d => d.moves.length).length * 8,
    plant: list.filter(d => d.meals.length).length * 3,
    read:  list.filter(d => d.rest).length * 8,
    music: list.filter(d => d.sleep != null).length * 2,
  };
}

// ponytail: 저장 없이 매번 계산. 기록이 늘면 순서가 바뀔 수 있음. 정확한 이력이 필요해지면 발견 시점에 저장
function interestsOn(c, today){
  const count = Math.min(MAX_INTERESTS, Math.floor(daysBetween(c.born, today) / DAYS_PER_INTEREST) + 1);
  const hints = recordHints(c.days), lean = LEAN[c.personality] ?? {};
  const rank = id => hash(`${c.seed}|${id}`) % 40 - (hints[id] ?? 0) - (lean[id] ?? 0);
  return Object.keys(INTERESTS).sort((a, b) => rank(a) - rank(b)).slice(0, count);
}

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

// 소품이 열리는 정도: 시간이 지나도, 들어와도, 기록해도 늘어난다 (기록만이 방법이 아님)
const together = (c, today) => daysBetween(c.born, today) + c.visitDays + Object.keys(c.days).length;

if (typeof window === 'undefined'){
  const assert = require('assert');
  const c = {seed:12345, personality:'calm', born:'2026-10-01', visitDays:1, days:{}};
  const today = '2026-11-04';
  // 같은 날짜면 언제 다시 열어도 같은 일을 한다
  assert.strictEqual(activityFor(c, today, 14, 3), activityFor(c, today, 14, 3));
  // 새벽에는 잔다
  assert.strictEqual(activityFor(c, today, 2), 'nap');
  // 기록이 전혀 없어도 시간이 지나면 관심사가 생기고 소품도 열린다
  assert.ok(interestsOn(c, today).length >= 2);
  assert.ok(together(c, today) >= 18);
  // 만난 첫날에는 관심사가 하나뿐이다
  assert.strictEqual(interestsOn({...c, born:today}, today).length, 1);
  // 운동을 많이 기록하면 산책이 앞당겨지지만, 그 외 관심사도 남는다
  const moved = {...c, personality:'curious', days:Object.fromEntries(Array.from({length:6}, (_, i) =>
    [addDays(today, -i), {moves:[{type:'걷기', min:20}], meals:[], sleep:null, rest:false}]))};
  assert.ok(interestsOn(moved, today).includes('walk'));
  assert.ok(interestsOn(moved, today).length > 1);
  // 복귀 기록: 낮잠 없음, 연속 중복 없음, 3개까지. 어제까지 왔으면 비어 있음
  const log = awayLog(c, '2026-10-20', today);
  assert.strictEqual(log.length, 3);
  assert.ok(log.every((x, i) => x.id !== 'nap' && x.id !== log[i - 1]?.id));
  assert.strictEqual(awayLog(c, addDays(today, -1), today).length, 0);
  // 월이 바뀌어도 날짜 계산이 맞다
  assert.strictEqual(daysBetween('2026-10-31', '2026-11-02'), 2);
  console.log('life.js ok');
}
