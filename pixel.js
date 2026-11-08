// 도트 그림 공통 도구 + 캐릭터. 모든 장면은 가로 100칸 기준 (캐릭터 1칸 = 장면 1칸).
// 그린 결과는 data URL 로 캐시해서 <img> 로 쓴다 (image-rendering: pixelated).

const OUT = '#3B2A20';   // 외곽선: 검정 대신 짙은 갈색
const PX_CACHE = new Map();
function pxImage(key, w, h, draw){
  if (PX_CACHE.has(key)) return PX_CACHE.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(pen(c.getContext('2d'), w, h));
  const url = c.toDataURL();
  PX_CACHE.set(key, url);
  return url;
}
const pxImg = (src, cls = '') => `<img class="px ${cls}" src="${src}" alt="" draggable="false">`;

function pen(g, W, H){
  const dot = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H || !c) return; g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // 모양 칠하기: 안쪽은 color, 바깥과 닿은 칸은 외곽선 (outline = null 이면 선 없음)
  function shape(inside, color, outline = OUT){
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      if (!inside(x, y)) continue;
      const edge = outline && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1));
      dot(x, y, edge ? outline : typeof color === 'function' ? color(x, y) : color);
    }
  }
  function line(x0, y0, x1, y1, c){
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) dot(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
  }
  return {W, H, g, dot, rect, shape, line};
}
// 모양 함수 (칸 중심 기준)
const ell = (cx, cy, rx, ry = rx) => (x, y) => ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1;
const box = (x0, y0, x1, y1) => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
const rbox = (x0, y0, x1, y1) => (x, y) => box(x0, y0, x1, y1)(x, y) && !((x === x0 || x === x1 - 1) && (y === y0 || y === y1 - 1));
const any = (...fs) => (x, y) => fs.some(f => f(x, y));
const minus = (f, h) => (x, y) => f(x, y) && !h(x, y);
const rng = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + k))))).map(v => v.toString(16).padStart(2, '0')).join('');

// ── 캐릭터 (20×26칸) ──
const AV_W = 20, AV_H = 26;
const HEAD = ell(10, 10.5, 7, 6.5);
const HEAD_OUT = ell(10, 10.5, 8, 7.5);   // 머리카락은 머리보다 한 칸 크게
const SPIKE_TIPS = [5, 8, 11, 14];
// 앞머리: 머리 윗부분(fringe 위) + 옆머리(side 아래까지) + 덧붙는 모양
const HAIR_FRONT = [
  {fringe:() => 7, side:10},                                         // 짧은 머리
  {fringe:() => 8, side:12},                                         // 앞머리
  {fringe:x => 8.4 - Math.max(0, x - 5) * .4, side:11},             // 가르마
  {fringe:() => 7, side:15, wide:true},                              // 단발
  {fringe:() => 7, side:14, wide:true},                              // 긴 머리
  {fringe:() => 6, side:9},                                          // 포니테일
  {fringe:() => 8, side:11, extra:any(ell(4, 4.5, 3), ell(16, 4.5, 3))},   // 양갈래(머리 위 두 개)
  {fringe:() => 8, side:12, extra:any(...[150, 180, 210, 240, 270, 300, 330, 360, 30].map(a => ell(10 + 8 * Math.cos(a * Math.PI / 180), 10 + 7.5 * Math.sin(a * Math.PI / 180), 2.4)))},   // 곱슬
  {fringe:() => 7, side:10, extra:(x, y) => y < 5 && SPIKE_TIPS.some(t => y >= 1 + Math.abs(x - t) * 1.6)},   // 삐죽
  null,                                                               // 민머리
];
const HAIR_BACK = {3:rbox(2, 9, 18, 17), 4:rbox(3, 8, 17, 22), 5:any(ell(17.5, 9.5, 2.5, 3.5), ell(18, 14.5, 2, 3.5))};

function drawBody(p, L, sk, sh, shD){
  const SHOE = '#3A2E2A';
  if (L.outfit === 2){   // 원피스
    p.shape(any(box(4, 19, 6, 21), box(14, 19, 16, 21)), sk);
    p.shape(any(box(7, 22, 9, 25), box(11, 22, 13, 25)), sk);
    p.shape(any((x, y) => y >= 15 && y < 23 && x >= 6 - Math.floor((y - 15) / 3) && x < 14 + Math.floor((y - 15) / 3), box(4, 16, 6, 19), box(14, 16, 16, 19)),
      (x, y) => (y >= 21 || x <= 5 || x >= 14 ? shD : sh));
    p.shape(any(box(6, 24, 9, 26), box(11, 24, 14, 26)), SHOE);
    return;
  }
  const sleeve = L.outfit === 1 ? 20 : 18;   // 후드 = 긴팔
  p.shape(any(box(4, sleeve, 6, sleeve + 2), box(14, sleeve, 16, sleeve + 2)), sk);
  p.shape(rbox(6, 21, 14, 25), '#56607A');
  [[9, 23], [10, 23], [9, 24], [10, 24]].forEach(([x, y]) => p.dot(x, y, OUT));
  p.shape(any(rbox(6, 15, 14, 22), box(4, 16, 6, sleeve), box(14, 16, 16, sleeve)), (x, y) => (y >= 20 || x <= 5 || x >= 14 ? shD : sh));   // 몸통과 소매 한 덩어리
  if (L.outfit === 1){ p.dot(8, 17, '#fff'); p.dot(11, 17, '#fff'); for (let x = 7; x < 13; x++) p.dot(x, 16, shD); }
  else { p.dot(9, 16, shD); p.dot(10, 16, shD); }
  p.shape(any(box(6, 24, 9, 26), box(11, 24, 14, 26)), SHOE);
}
const EYE = '#2B2B3A';
const EYE_ART = [
  p => [[7, 11], [7, 12], [12, 11], [12, 12]].forEach(([x, y]) => p.dot(x, y, EYE)),
  p => { [[6, 10], [7, 10], [6, 11], [7, 11], [12, 10], [13, 10], [12, 11], [13, 11]].forEach(([x, y]) => p.dot(x, y, EYE));
         [[6, 12], [7, 12], [12, 12], [13, 12]].forEach(([x, y]) => p.dot(x, y, '#5A6FC0')); p.dot(7, 10, '#fff'); p.dot(13, 10, '#fff'); },
  p => [[5, 12], [6, 11], [7, 12], [12, 12], [13, 11], [14, 12]].forEach(([x, y]) => p.dot(x, y, EYE)),
  p => { [[6, 12], [7, 12], [12, 12], [13, 12]].forEach(([x, y]) => p.dot(x, y, EYE)); [[5, 11], [14, 11]].forEach(([x, y]) => p.dot(x, y, EYE)); },
];
function drawAvatar(p, L, {sleepy = false, cheek = .5, yawn = false} = {}){
  const [sk, skD] = PX_SKIN[L.skin], [hc, hcL] = PX_HAIR[L.hairColor], [sh, shD] = PX_SHIRT[L.shirt];
  const hairShade = (x, y) => (y <= 6 && x >= 6 && x <= 9 && (x + y) % 2 === 0 ? hcL : y >= 12 ? shade(hc, -.18) : hc);
  if (HAIR_BACK[L.hair]) p.shape(HAIR_BACK[L.hair], shade(hc, -.12));
  drawBody(p, L, sk, sh, shD);
  p.shape(HEAD, (x, y) => (y >= 15 || x >= 15 ? skD : sk));
  if (sleepy) [[6, 12], [7, 12], [12, 12], [13, 12]].forEach(([x, y]) => p.dot(x, y, OUT));
  else EYE_ART[L.eyes]?.(p);
  const ck = cheek > .45 ? '#F29A86' : '#F3B8A4';
  [[5, 13], [6, 13], [13, 13], [14, 13]].forEach(([x, y]) => p.dot(x, y, ck));
  if (yawn) [[9, 13], [10, 13], [9, 14], [10, 14]].forEach(([x, y]) => p.dot(x, y, '#9A3F3A'));
  else { p.dot(9, 14, '#B5524A'); p.dot(10, 14, '#B5524A'); }
  const H = HAIR_FRONT[L.hair];
  if (!H){ p.dot(7, 6, shade(sk, .12)); p.dot(8, 5, shade(sk, .12)); return; }
  const side = (x, y) => (x <= (H.wide ? 4 : 3) || x >= (H.wide ? 15 : 16)) && y <= H.side;
  p.shape((x, y) => (HEAD_OUT(x, y) && (y <= H.fringe(x) || side(x, y))) || (H.wide && (x === 2 || x === 17) && y >= 8 && y <= H.side) || !!H.extra?.(x, y), hairShade);
}
// crop: '' 전신 / 'face' 얼굴(위 18칸) / 'body' 옷(아래 14칸). 예전 SVG 버전과 같은 이름으로 부른다
function avatar(L, {sleepy = false, cheek = .5, crop = ''} = {}){
  const look = cleanLook(L), yawn = L?.mouth === 4;
  const full = pxImage(`av|${JSON.stringify(look)}|${sleepy}|${cheek > .45}|${yawn}`, AV_W, AV_H, p => drawAvatar(p, look, {sleepy, cheek, yawn}));
  if (!crop || crop === 'full') return pxImg(full, 'av');
  const [y0, h] = {face:[0, 18], head:[0, 16], body:[12, 14]}[crop] ?? [0, 18];   // head = 베개에 누운 머리
  return `<span class="av av--crop" style="aspect-ratio:${AV_W}/${h}"><img class="px" src="${full}" alt="" style="top:${-y0 / h * 100}%;height:${AV_H / h * 100}%"></span>`;
}

// ── 들고 있는 것 (7×7) · 쪽지 ──
const HELD_ART = {
  book:  p => p.shape(box(0, 1, 7, 6), (x, y) => (x === 3 ? '#5A8FD0' : '#8EC9FF')),
  pencil:p => { p.line(1, 6, 5, 2, '#FFD23F'); p.line(1, 5, 5, 1, OUT); p.dot(6, 0, '#F29A86'); p.dot(1, 6, OUT); },
  can:   p => { p.shape(rbox(2, 2, 6, 7), '#86D9B9'); p.line(0, 1, 2, 3, OUT); },
  music: p => { p.line(2, 1, 2, 5, OUT); p.line(2, 1, 5, 0, OUT); p.line(5, 0, 5, 4, OUT); p.shape(any(ell(1.5, 5.5, 1.5), ell(4.5, 4.5, 1.5)), '#FF9EB8'); },
  star:  p => p.shape((x, y) => Math.abs(x - 3) + Math.abs(y - 3) <= 3 && (Math.abs(x - 3) <= 1 || Math.abs(y - 3) <= 1), '#FFD23F'),
};
const heldArt = id => id ? pxImg(pxImage(`held|${id}`, 7, 7, HELD_ART[id])) : '';
const NOTE = pxImg(pxImage('note', 9, 8, p => { p.shape(box(0, 0, 9, 8), '#FFF3C4'); p.line(2, 2, 6, 2, '#C9A86A'); p.line(2, 4, 6, 4, '#C9A86A'); }));
