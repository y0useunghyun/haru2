// 방 도트 (100×122칸). 벽 0~57, 바닥 58~. 소품 39개는 ITEM_ART: 칸마다 자리(at)와 크기(w,h), 종류별 그리기.
// 소품 그리기는 (p, x, y) 기준점에서 그린다 → 방 안에서도, 꾸미기 썸네일에서도 같은 함수.

const ROOM_W = 100, ROOM_H = 122, WALL_H = 58;
const WOOD = '#D9A46B', WOOD_D = '#B97A45', WOOD_L = '#EBC28F';
const PX_SKY = {morning:'#CFEBFF', noon:'#A9DBFF', evening:'#FFB98A', night:'#2B3566'};

// 벽지·바닥 무늬: (x, y) → 색
const WALL_PAT = [
  (x, y) => (x % 8 < 4 ? '#FFE0EA' : '#FFF3D6'),
  (x, y) => ((Math.floor(x / 6) + Math.floor(y / 6)) % 2 ? '#DDEEFF' : '#FFF8EC'),
  (x, y) => ((x % 9 === 4 && y % 9 === 4) ? '#FFD23F' : (x % 9 === 0 && y % 9 === 0) ? '#FFFFFF' : '#CDEFE0'),
];
const WALL_BASE = (x, y) => (x % 7 === 3 && y % 7 === 3 ? '#F2DFB6' : '#FFF3D6');
const FLOOR_PAT = [
  (x, y) => (y % 6 === 0 || (x + (Math.floor(y / 6) % 2) * 13) % 26 === 0 ? '#B98450' : (x * 7 + y * 3) % 31 === 0 ? '#D49A62' : '#E2AA72'),
  (x, y) => ((Math.floor(x / 7) + Math.floor(y / 7)) % 2 ? '#F7E3C6' : '#E9C99E'),
  (x, y) => (x % 6 === 2 && y % 6 === 2 ? '#9FD8BF' : '#BDE8D3'),
];
const FLOOR_BASE = (x, y) => (y % 7 === 0 || (x + (Math.floor(y / 7) % 2) * 16) % 32 === 0 ? '#C99260' : '#E6B07A');

// 창문 안 하늘: 시간·날씨
function skyIn(p, glass, x0, y0, w, h, time, weather){
  p.shape(glass, PX_SKY[time], null);
  const dotIn = (x, y, c) => { if (glass(x, y)) p.dot(x, y, c); };
  if (time === 'night'){ dotIn(x0 + w - 7, y0 + 4, '#FFF3C4'); dotIn(x0 + w - 6, y0 + 4, '#FFF3C4'); dotIn(x0 + w - 7, y0 + 5, '#FFF3C4'); [[4, 6], [9, 3], [6, 12]].forEach(([a, b]) => dotIn(x0 + a, y0 + b, '#fff')); }
  else if (weather === 'clear' || weather === 'cloud'){ const sx = time === 'evening' ? x0 + w - 6 : x0 + 5, sy = time === 'evening' ? y0 + h - 7 : y0 + 4;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (Math.abs(a) + Math.abs(b) < 2) dotIn(sx + a, sy + b, time === 'evening' ? '#FFB45C' : '#FFD23F'); }
  if (weather === 'cloud' || weather === 'rain' || weather === 'snow') [[5, 8], [6, 7], [7, 7], [8, 8], [14, 6], [15, 5], [16, 5], [17, 6]].forEach(([a, b]) => { dotIn(x0 + a, y0 + b, '#fff'); dotIn(x0 + a, y0 + b + 1, '#fff'); });
  if (weather === 'rain') for (let i = 0; i < 10; i++) dotIn(x0 + 3 + (i * 7) % (w - 4), y0 + 11 + (i * 5) % (h - 12), '#5D8FD0');
  if (weather === 'snow') for (let i = 0; i < 12; i++) dotIn(x0 + 2 + (i * 5) % (w - 3), y0 + 10 + (i * 3) % (h - 11), '#fff');
}

const ITEM_ART = {
  window:{at:[37, 7], w:26, h:24, kinds:[
    (p, x, y, o) => { p.shape(rbox(x, y, x + 26, y + 24), WOOD_L); const gl = box(x + 2, y + 2, x + 24, y + 22); skyIn(p, gl, x + 2, y + 2, 22, 20, o.time, o.weather); p.shape(box(x + 12, y + 2, x + 14, y + 22), OUT, null); p.shape(box(x + 2, y + 11, x + 24, y + 12), OUT, null); p.rect(x - 1, y + 23, 28, 2, WOOD); },
    (p, x, y, o) => { p.shape(ell(x + 13, y + 12, 12, 12), WOOD_L); const gl = ell(x + 13, y + 12, 10, 10); skyIn(p, gl, x + 3, y + 2, 20, 20, o.time, o.weather); p.shape((a, b) => gl(a, b) && (a === x + 12 || a === x + 13 || b === y + 11), OUT, null); },
    (p, x, y, o) => { const out = any(ell(x + 13, y + 12, 12, 12), box(x + 1, y + 12, x + 25, y + 24)); p.shape(minus(out, box(0, 0, 200, y + 1)), WOOD_L); const gl = any(ell(x + 13, y + 12, 10, 10), box(x + 3, y + 12, x + 23, y + 22));
      skyIn(p, gl, x + 3, y + 2, 20, 20, o.time, o.weather); p.shape((a, b) => gl(a, b) && (a === x + 12 || a === x + 13 || b === y + 13), OUT, null); p.rect(x - 1, y + 23, 28, 2, WOOD); },
  ]},
  curtain:{at:[33, 4], w:34, h:29, kinds:[0, 1, 2].map(k => (p, x, y) => {
    const col = ['#FF9EB8', '#FFD23F', '#8EC9FF'][k], dk = shade(col, -.15);
    const drape = x0 => (a, b) => b >= y + 2 && b < y + 28 && a >= x0 && a < x0 + 8 + (b > y + 18 ? (x0 < x + 10 ? -1 : 1) : 0) - (b > y + 18 && x0 < x + 10 ? 0 : 0);
    [x + 1, x + 25].forEach(x0 => p.shape(drape(x0), (a, b) => (k === 1 && (b - y) % 5 === 0) ? '#fff' : (k === 2 && (a + b) % 5 === 0 && (b - y) % 3 === 0) ? '#fff' : (a - x0) % 3 === 1 ? dk : col));
    p.rect(x, y, 34, 2, WOOD_D); p.rect(x, y + 1, 34, 1, OUT);
    p.rect(x + 1, y + 18, 8, 1, OUT); p.rect(x + 25, y + 18, 8, 1, OUT);
  })},
  frame:{at:[9, 12], w:12, h:14, kinds:[
    (p, x, y) => { p.line(x + 3, y + 2, x + 6, y, OUT); p.line(x + 6, y, x + 9, y + 2, OUT); p.shape(box(x, y + 2, x + 12, y + 14), '#FFD23F'); p.shape((a, b) => b >= y + 7 && b < y + 13 && a > x && a < x + 11 && b >= y + 13 - (6 - Math.abs(a - x - 5)), '#86D9B9', null); p.dot(x + 8, y + 5, '#fff'); },
    (p, x, y) => { p.line(x + 3, y + 2, x + 6, y, OUT); p.line(x + 6, y, x + 9, y + 2, OUT); p.shape(box(x, y + 2, x + 12, y + 14), '#FF9EB8'); p.shape(any(ell(x + 4.5, y + 6.5, 1.8), ell(x + 7.5, y + 6.5, 1.8), (a, b) => b >= y + 7 && b <= y + 11 && Math.abs(a + .5 - x - 6) <= y + 11 - b), '#fff', null); },
    (p, x, y) => { p.line(x + 3, y + 2, x + 6, y, OUT); p.line(x + 6, y, x + 9, y + 2, OUT); p.shape(box(x, y + 2, x + 12, y + 14), '#8EC9FF'); p.shape(any(ell(x + 6, y + 9, 3.5, 3), box(x + 3, y + 5, x + 4, y + 7), box(x + 8, y + 5, x + 9, y + 7)), '#fff', null); p.dot(x + 5, y + 8, OUT); p.dot(x + 7, y + 8, OUT); },
  ]},
  clock:{at:[81, 11], w:10, h:11, kinds:[
    (p, x, y) => { p.shape(ell(x + 5, y + 5.5, 5, 5), '#FFFFFF'); p.line(x + 5, y + 5, x + 5, y + 2, OUT); p.line(x + 5, y + 5, x + 7, y + 6, OUT); },
    (p, x, y) => { p.shape(rbox(x, y, x + 10, y + 10), '#FFD23F'); p.line(x + 5, y + 5, x + 5, y + 2, OUT); p.line(x + 5, y + 5, x + 7, y + 5, OUT); },
    (p, x, y) => { p.shape((a, b) => b >= y + Math.abs(a + .5 - x - 5) && b < y + 11 && a >= x && a < x + 10, WOOD); p.shape(ell(x + 5, y + 7, 2.6), '#fff'); p.dot(x + 5, y + 6, OUT); p.dot(x + 5, y + 3, '#FF9EB8'); },
  ]},
  garland:{at:[6, 1], w:88, h:11, thumbW:46, kinds:[0, 1, 2].map(k => (p, x, y) => {
    const sag = t => Math.round(y + 1 + 5 * Math.sin(t * Math.PI));
    for (let i = 0; i <= 87; i++) p.dot(x + i, sag(i / 87), OUT);
    const cols = ['#FF9EB8', '#FFD23F', '#86D9B9', '#8EC9FF'];
    for (let j = 1; j < 8; j++){ const cx = x + Math.round(j * 87 / 8), cy = sag(j / 8) + 1, c = cols[j % 4];
      if (k === 0) p.shape((a, b) => b >= cy && b < cy + 4 && Math.abs(a - cx) <= (cy + 3 - b), c);
      if (k === 1){ p.dot(cx, cy, OUT); p.shape(ell(cx + .5, cy + 2.5, 1.6, 2), c); }
      if (k === 2){ p.line(cx, cy, cx, cy + 1, OUT); p.shape((a, b) => Math.abs(a - cx) + Math.abs(b - cy - 3) <= 2, j % 2 ? '#FFD23F' : '#FF9EB8'); } }
  })},
  desktop:{at:[85, 37], w:10, h:9, kinds:[
    (p, x, y) => { p.shape(any(ell(x + 5, y + 5, 5, 4), box(x + 2, y + 1, x + 8, y + 3)), (a, b) => (b < y + 3 ? '#E3F4FF' : '#8EC9FF')); p.shape(any(ell(x + 4.5, y + 5.5, 1.6, 1), box(x + 6, y + 5, x + 7, y + 6)), '#FF9EB8', null); },
    (p, x, y) => { p.line(x + 3, y + 3, x + 7, y, OUT); p.shape(rbox(x, y + 3, x + 10, y + 9), '#FF9EB8'); p.shape(ell(x + 3.5, y + 6, 1.6), '#fff'); p.line(x + 6, y + 5, x + 8, y + 5, OUT); p.line(x + 6, y + 7, x + 8, y + 7, OUT); },
    (p, x, y) => { p.shape(rbox(x + 2, y + 3, x + 8, y + 9), '#FFD23F'); p.shape(minus(box(x + 7, y + 4, x + 10, y + 8), box(x + 8, y + 5, x + 9, y + 7)), OUT, null); p.dot(x + 4, y, '#C9C3BA'); p.dot(x + 5, y + 1, '#C9C3BA'); p.dot(x + 4, y + 2, '#C9C3BA'); },
  ]},
  chair:{at:[64, 54], w:13, h:18, kinds:[
    (p, x, y) => { p.shape(rbox(x + 2, y, x + 11, y + 9), WOOD); p.line(x + 3, y + 3, x + 9, y + 3, WOOD_D); p.shape(box(x + 2, y + 13, x + 4, y + 18), WOOD_D); p.shape(box(x + 9, y + 13, x + 11, y + 18), WOOD_D); p.shape(rbox(x, y + 9, x + 13, y + 13), WOOD_D); },
    (p, x, y) => { p.shape(ell(x + 6.5, y + 5, 5, 5), '#86D9B9'); p.shape(box(x + 2, y + 13, x + 4, y + 18), '#5FC79F'); p.shape(box(x + 9, y + 13, x + 11, y + 18), '#5FC79F'); p.shape(rbox(x, y + 9, x + 13, y + 13), '#5FC79F'); },
    (p, x, y) => { p.shape(any(ell(x + 6.5, y + 12, 6.5, 6), ell(x + 6.5, y + 8, 4.5, 4)), (a, b) => (b > y + 13 ? '#A890D8' : '#C9B6F2')); p.dot(x + 5, y + 9, '#E6DCFA'); },
  ]},
  rug:{at:[25, 95], w:50, h:13, kinds:[
    (p, x, y) => { p.shape(ell(x + 25, y + 6.5, 25, 6.5), '#FFB3C7'); p.shape((a, b) => ell(x + 25, y + 6.5, 18, 3.6)(a, b) && !ell(x + 25, y + 6.5, 17, 2.6)(a, b) && a % 3 !== 0, '#fff', null); },
    (p, x, y) => { p.shape(rbox(x + 1, y, x + 49, y + 13), (a, b) => ((a - x) % 8 < 2 || (b - y) % 6 < 1 ? '#fff' : '#8EC9FF')); },
    (p, x, y) => { p.shape(any(ell(x + 10, y + 7, 10, 6), ell(x + 25, y + 6, 13, 6.5), ell(x + 40, y + 7, 10, 6)), (a, b) => (b > y + 9 ? '#A890D8' : '#C9B6F2')); },
  ]},
  plant:{at:[3, 89], w:13, h:23, kinds:[
    (p, x, y) => { p.shape(any(ell(x + 4, y + 7, 3, 7), ell(x + 9, y + 6, 3, 6)), (a, b) => (a < x + 6 ? '#86D9B9' : '#5FC79F')); p.shape((a, b) => b >= y + 14 && b < y + 23 && a >= x + 1 + Math.floor((b - y - 14) / 4) && a < x + 12 - Math.floor((b - y - 14) / 4), (a, b) => (b === y + 15 ? '#F0A07E' : '#E8835F')); },
    (p, x, y) => { p.shape(any(rbox(x + 4, y + 2, x + 9, y + 15), rbox(x + 1, y + 6, x + 4, y + 10), rbox(x + 9, y + 4, x + 12, y + 9)), (a, b) => ((a + b) % 4 === 0 ? '#5FC79F' : '#86D9B9')); p.dot(x + 6, y + 1, '#FF9EB8');
      p.shape((a, b) => b >= y + 14 && b < y + 23 && a >= x + 1 + Math.floor((b - y - 14) / 4) && a < x + 12 - Math.floor((b - y - 14) / 4), '#C9B6F2'); },
    (p, x, y) => { p.line(x + 6, y + 6, x + 6, y + 14, '#3E8C5E'); p.shape(ell(x + 4, y + 11, 2.4, 1.5), '#5FC79F'); p.shape((a, b) => b >= y + 1 && b < y + 7 && a >= x + 3 && a < x + 10 && !(b === y + 1 && (a === x + 4 || a === x + 6 || a === x + 8)), '#FF9EB8');
      p.shape((a, b) => b >= y + 14 && b < y + 23 && a >= x + 1 + Math.floor((b - y - 14) / 4) && a < x + 12 - Math.floor((b - y - 14) / 4), '#FFD23F'); },
  ]},
  lamp:{at:[85, 70], w:11, h:40, kinds:[
    (p, x, y) => { p.shape((a, b) => b >= y && b < y + 9 && a >= x + 2 - Math.floor((b - y) / 3) && a < x + 9 + Math.floor((b - y) / 3), '#FFD23F'); p.shape(box(x + 5, y + 9, x + 7, y + 37), '#6B5A4E'); p.shape(ell(x + 6, y + 38, 5, 2), OUT); },
    (p, x, y) => { p.shape(rbox(x + 3, y + 30, x + 9, y + 40), '#FFF3D6'); p.shape(ell(x + 6, y + 29, 6, 4.5), (a, b) => (b > y + 29 ? '#E07F98' : '#FF9EB8')); p.dot(x + 4, y + 27, '#fff'); p.dot(x + 8, y + 28, '#fff'); },
    (p, x, y) => { p.shape(rbox(x + 3, y + 30, x + 9, y + 40), '#FFFFFF'); p.dot(x + 6, y + 29, OUT); p.shape(ell(x + 6.5, y + 26, 2, 3), (a, b) => (b > y + 26 ? '#FFB45C' : '#FFE27A'), null); },
  ]},
  books:{at:[69, 102], w:12, h:10, kinds:[
    (p, x, y) => { p.shape(rbox(x, y + 7, x + 12, y + 10), '#8EC9FF'); p.shape(rbox(x + 1, y + 4, x + 11, y + 7), '#FF9EB8'); p.shape(rbox(x + 1, y + 1, x + 10, y + 4), '#FFD23F'); },
    (p, x, y) => { p.shape(any(ell(x + 6, y + 7.5, 4.5, 2.5), ell(x + 6, y + 4, 3.5, 3), ell(x + 3, y + 1.5, 1.5), ell(x + 9, y + 1.5, 1.5)), '#C98B5A'); p.dot(x + 5, y + 4, OUT); p.dot(x + 7, y + 4, OUT); p.dot(x + 6, y + 5, '#F1D7BD'); },
    (p, x, y) => { p.shape(rbox(x, y + 3, x + 12, y + 10), '#8EC9FF'); p.dot(x + 3, y + 6, OUT); p.dot(x + 2, y + 6, OUT); p.dot(x + 4, y + 6, OUT); p.dot(x + 3, y + 5, OUT); p.dot(x + 3, y + 7, OUT); p.dot(x + 8, y + 5, '#FF9EB8'); p.dot(x + 9, y + 7, '#FFD23F'); },
  ]},
};
const PLANE_PAT = {wallpaper:WALL_PAT, floor:FLOOR_PAT};

function drawBed(p){
  p.shape(rbox(1, 40, 8, 71), WOOD);
  p.shape(rbox(5, 51, 46, 64), '#FFF3D6');
  p.shape(rbox(18, 50, 46, 64), (x, y) => (y === 51 ? '#FFC4D6' : x % 6 === 0 && y > 54 ? '#F28AA8' : '#FF9EB8'));
  p.shape(rbox(9, 48, 19, 55), '#FFFFFF');
  [[6, 64], [43, 64]].forEach(([x, y]) => p.shape(box(x, y, x + 2, y + 7), WOOD_D));
}
function drawDesk(p){
  [[61, 48], [95, 48]].forEach(([x, y]) => p.shape(box(x, y, x + 2, y + 24), WOOD_D));
  p.shape(rbox(80, 48, 95, 61), WOOD_L); p.line(80, 54, 94, 54, OUT); p.dot(87, 51, OUT); p.dot(87, 57, OUT);
  p.shape(rbox(59, 44, 99, 48), WOOD);
  p.shape(rbox(63, 38, 68, 44), '#8EC9FF'); p.line(64, 37, 63, 34, OUT); p.line(66, 37, 67, 33, OUT);
  p.shape(rbox(70, 41, 79, 44), '#FFD23F');
}
// 방 한 장: kinds = {칸: 종류}. bare = 빈 방 (첫 시작)
// 공원에서 주운 것을 담는 병: 책상 위 책과 소품 사이 (79~85). 아래부터 차고 최근 20개만
function drawJar(p, colors){
  const x = 79, y = 35;
  p.shape(rbox(x, y + 2, x + 6, y + 9), '#EAF6FF');
  colors.slice(-20).forEach((c, i) => p.dot(x + 1 + i % 4, y + 7 - Math.floor(i / 4), c));
  p.rect(x + 1, y + 1, 4, 2, WOOD);
}
function roomImage(kinds, time, weather, bare = false, jar = []){
  const on = bare ? {window:kinds.window ?? 0} : kinds;
  return pxImage(`room|${JSON.stringify(on)}|${time}|${weather}|${bare}|${jar.slice(-20).join()}`, ROOM_W, ROOM_H, p => {
    const wall = on.wallpaper != null ? WALL_PAT[on.wallpaper] : WALL_BASE, floor = on.floor != null ? FLOOR_PAT[on.floor] : FLOOR_BASE;
    for (let y = 0; y < WALL_H; y++) for (let x = 0; x < ROOM_W; x++) p.dot(x, y, wall(x, y));
    for (let y = WALL_H; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) p.dot(x, y, floor(x, y));
    p.rect(0, WALL_H - 3, ROOM_W, 3, WOOD_L); p.rect(0, WALL_H - 3, ROOM_W, 1, OUT); p.rect(0, WALL_H, ROOM_W, 1, OUT);   // 걸레받이
    const item = id => { const a = ITEM_ART[id]; if (on[id] != null) a.kinds[on[id]](p, a.at[0], a.at[1], {time, weather}); };
    ['window', 'curtain', 'frame', 'clock', 'garland'].forEach(item);
    if (!bare){ drawBed(p); item('chair'); drawDesk(p); if (jar.length) drawJar(p, jar); }
    ['desktop', 'rug', 'plant', 'lamp', 'books'].forEach(item);
  });
}
// 꾸미기 카드용 소품 그림
function kindArt(prop, k){
  if (prop.plane) return pxImg(pxImage(`kind|${prop.id}|${k}`, 16, 12, p => { for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) p.dot(x, y, PLANE_PAT[prop.id][k](x, y)); p.shape(box(0, 0, 16, 12), c => null); }), 'kind');
  const a = ITEM_ART[prop.id];
  return pxImg(pxImage(`kind|${prop.id}|${k}`, (a.thumbW ?? a.w) + 2, a.h + 2, p => a.kinds[k](p, 1, 1, {time:'noon', weather:'clear'})), 'kind');   // 가로로 긴 장식은 반만 보여 크게
}
