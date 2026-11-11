// 계산 확인: node check.js  (브라우저처럼 data.js → life.js 를 같은 공간에 불러온 뒤 검사)
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const ctx = vm.createContext({btoa, atob, TextEncoder, TextDecoder, console});
for (const f of ['data.js', 'talk.js', 'life.js']) vm.runInContext(fs.readFileSync(`${__dirname}/${f}`, 'utf8'), ctx, {filename:f});
const run = code => vm.runInContext(code, ctx);
const L = run('({activityFor, interestsOn, growInterests, together, awayLog, daysBetween, addDays, ownedItems, shopItem, ITEM_ORDER, ALL_ITEMS, parseRecord, isEmptyParse, toCode, readCode, roomData, seasonOf, cleanLook, DEFAULT_LOOK, meetingOn, withRang})');
const eq = (a, b) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b);

const c = {seed:12345, personality:'calm', born:'2026-10-01', visitDays:1, days:{}};
const today = '2026-11-04';
// 같은 날짜면 언제 다시 열어도 같은 일을 한다. 새벽에는 잔다
assert.strictEqual(L.activityFor(c, today, 14, 3), L.activityFor(c, today, 14, 3));
assert.strictEqual(L.activityFor(c, today, 2), 'nap');
// 기록이 없어도 시간이 지나면 관심사가 생긴다. 첫날엔 하나
assert.ok(L.interestsOn(c, today).length >= 2);
assert.strictEqual(L.interestsOn({...c, born:today}, today).length, 1);
// 운동을 많이 기록하면 산책이 앞당겨지지만, 그 외 관심사도 남는다
const moved = {...c, personality:'curious', days:Object.fromEntries(Array.from({length:6}, (_, i) =>
  [L.addDays(today, -i), {moves:[{type:'걷기', min:20}], meals:[], sleep:null, rest:false}]))};
assert.ok(L.interestsOn(moved, today).includes('walk'));
// 관심사 저장: 한 번 생긴 건 기록이 바뀌어도 그대로, 날짜는 3일 간격
const grown = L.growInterests(c, today);
assert.strictEqual(grown.length, 4);
eq(grown.map(x => x.on), ['2026-10-01', '2026-10-04', '2026-10-07', '2026-10-10']);
eq(L.growInterests({...moved, interests:grown}, today), JSON.parse(JSON.stringify(grown)));
assert.strictEqual(L.growInterests({...c, born:today, interests:[]}, today).length, 1);
// 저장된 관심사로 과거 날짜를 보면 그날까지 생긴 것만
assert.strictEqual(L.interestsOn({...c, interests:grown}, '2026-10-05').length, 2);
// 복귀 기록: 낮잠 없음, 연속 중복 없음, 3개까지. 어제까지 왔으면 비어 있음
const log = L.awayLog(c, '2026-10-20', today);
assert.strictEqual(log.length, 3);
assert.ok(log.every((x, i) => x.id !== 'nap' && x.id !== log[i - 1]?.id));
assert.strictEqual(L.awayLog(c, L.addDays(today, -1), today).length, 0);
assert.strictEqual(L.daysBetween('2026-10-31', '2026-11-02'), 2);

// 소품: 첫날엔 창문 + 고른 화분, 매일 오고 남기면 하루에 하나씩, 가게는 없는 것만
const day0 = {...c, born:today, visitDays:1, days:{}, got:['plant:2']};
eq([...L.ownedItems(day0, today)], ['window:0', 'plant:2']);
const day3 = {...day0, visitDays:4, days:{a:1, b:1, c:1}};
assert.strictEqual(L.ownedItems(day3, L.addDays(today, 3)).size, 5);
assert.ok(!L.ownedItems(day0, today).has(L.shopItem(day0, today)));
assert.strictEqual(L.shopItem({...day0, got:L.ALL_ITEMS}, today), null);
assert.strictEqual(new Set(L.ITEM_ORDER).size, L.ALL_ITEMS.length - 1);   // 화분 첫 종류만 첫 시작에서

// 한 줄 입력
const P = t => L.parseRecord(t, '간식');
eq(P('점심에 김밥, 30분 걸었어'), {sleep:null, moves:[{type:'걷기', min:30}], meals:[{when:'점심', name:'김밥'}], mood:null, rest:false});
eq(P('7시간 자고 아침에 계란 토스트 먹었어').sleep, 7);
eq(P('7시간 자고 아침에 계란 토스트 먹었어').meals, [{when:'아침', name:'계란 토스트'}]);
eq(P('점심에 김밥하고 라면 먹었어').meals, [{when:'점심', name:'김밥 라면'}]);
eq(P('헬스 1시간 했어').moves, [{type:'근력', min:60}]);
eq(P('6시간 반 잤어').sleep, 6.5);
eq(P('푹 잤어').sleep, 9);
eq(P('저녁에 마라탕 먹음').meals, [{when:'저녁', name:'마라탕'}]);
eq(P('오늘 너무 힘들었어').mood, 'hard');
assert.ok(P('아무것도 안 했어').rest);
assert.ok(L.isEmptyParse(P('ㅋㅋㅋ')));
assert.ok(L.isEmptyParse(P('잠깐 낮잠')));   // 낮잠은 밤잠 기록이 아님
eq(P('자전거 타고 저녁은 닭가슴살 샐러드').moves, [{type:'자전거', min:30}]);
eq(P('자전거 타고 저녁은 닭가슴살 샐러드').meals, [{when:'저녁', name:'닭가슴살 샐러드'}]);

// 친구 코드: 주고받아도 같고, 기록은 안 들어가고, 망가진 코드는 null
const me = {...c, name:'콩이', look:{...L.DEFAULT_LOOK, hair:3}, interests:grown, days:{[today]:{meals:[{when:'점심', name:'비밀'}]}}};
const code = L.toCode('room', L.roomData(me, {window:1, rug:2, bogus:9}));
const back = L.readCode(`이 링크로 와: https://x.io/?code=${code}`);
assert.strictEqual(back.type, 'room');
assert.strictEqual(back.data.name, '콩이');
assert.strictEqual(back.data.look.hair, 3);
eq(back.data.kinds, {window:1, rug:2});
assert.ok(!code.includes('비밀') && !Buffer.from(code.slice(3), 'base64').toString().includes('비밀'));
assert.strictEqual(L.readCode('H2.abcdefghijk'), null);
assert.strictEqual(L.readCode('아무 글'), null);
const evil = L.readCode(L.toCode('room', {s:1, l:[99, -1], n:'<img src=x onerror=alert(1)>aaaaaaaaaa', p:'nope', k:{rug:7}}));
assert.strictEqual(evil.data.look.hair, L.DEFAULT_LOOK.hair);
assert.strictEqual(evil.data.personality, 'calm');
assert.strictEqual(evil.data.name.length, 12);   // 이름은 12자, 화면에서는 esc로 그림
eq(evil.data.kinds, {window:0});
const gift = L.readCode(L.toCode('gift', {f:'콩이', s:1, t:2, g:1, it:'rug:1', d:today, r:5}));
eq(gift.data, {from:'콩이', fromSeed:1, to:2, greet:1, item:'rug:1', date:today});
assert.strictEqual(L.readCode(L.toCode('gift', {f:'a', s:1, t:2, g:99, d:today})), null);

assert.strictEqual(L.seasonOf('2026-11-08'), 'autumn');
assert.strictEqual(L.seasonOf('2027-01-02'), 'winter');
// 만남: 양쪽에서 같은 결과, 만나기 전 날짜엔 없음, 열흘이면 몇 번은 만남
const A = {seed:11, born:'2026-10-01'}, B = {seed:9999, born:'2026-10-20'};
const days10 = Array.from({length:10}, (_, i) => L.addDays('2026-11-01', i));
assert.ok(days10.every(d => L.meetingOn(A, B, d) === L.meetingOn(B, A, d)));
assert.strictEqual(L.meetingOn(A, B, '2026-10-10'), null);
const met = days10.filter(d => L.meetingOn(A, B, d)).length;
assert.ok(met >= 1 && met <= 8, `만난 날 ${met}`);
assert.strictEqual(L.withRang('콩이'), '콩이랑');
assert.strictEqual(L.withRang('하늘'), '하늘이랑');
// 질문에 대한 짧은 대답: 「6시간」만 쓰면 잠, 「2시간 걸었어」는 운동
assert.strictEqual(P('6시간').sleep, 6);
assert.strictEqual(P('7시간 반').sleep, 7.5);
assert.strictEqual(P('2시간 걸었어').sleep, null);
// 대사: 원래 대사는 남고 덧붙은 것이 뒤에. 모든 행동·시간대·날씨·계절·단계에 빈 칸이 없음
const T = run('({LINES, WORLD, DEEP, deepStage, ACTIVITIES})');
assert.strictEqual(T.LINES.calm.doing.plant[0], '잎이 조금 자란 것 같아요');
assert.strictEqual(T.LINES.calm.doing.plant.length, 5);
assert.strictEqual(T.LINES.calm.unknown, '이건 처음 보는 음식이에요');
for (const P of Object.values(T.LINES)){
  for (const a of Object.keys(T.ACTIVITIES)) assert.ok(P.doing[a].length >= 3, a);
  for (const t of ['morning','noon','evening','night']) assert.ok(P.hello[t].length >= 4, t);
}
for (const W of Object.values(T.WORLD)){
  for (const w of ['clear','cloud','rain','snow']) assert.ok(W.weather[w].length, w);
  for (const s of ['spring','summer','autumn','winter']) assert.ok(W.season[s].length, s);
}
eq([0, 6, 7, 20, 21, 59, 60, 400].map(T.deepStage), [0, 0, 1, 1, 2, 2, 3, 3]);
for (const D of Object.values(T.DEEP)) assert.strictEqual(D.length, 4);
console.log('check.js ok');
