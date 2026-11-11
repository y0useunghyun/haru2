// 마을 거리(100×82칸)·공원(100×122칸) 도트. 건물은 그림 위에 투명 버튼(data-place)을 얹어서 누른다.

const PX_SEASON = {
  spring:{far:'#BFE3A6', grass:'#A9D98E', grassD:'#8CC474', grassL:'#C3E8A8', leaf:'#FFC4D6', leafD:'#F29AB6', leafL:'#FFFFFF', ground:'#F3DFB8', bush:'#8CC474'},
  summer:{far:'#8FD4B0', grass:'#86CF8E', grassD:'#66B672', grassL:'#A6E0A8', leaf:'#5FBF7F', leafD:'#3E9C62', leafL:'#9BE0A8', ground:'#EED6A6', bush:'#5FB377'},
  autumn:{far:'#E8B66C', grass:'#C9C46F', grassD:'#A9A452', grassL:'#DCD688', leaf:'#E58A3F', leafD:'#B85C2B', leafL:'#FFD27A', ground:'#EBCB95', bush:'#C99A4E'},
  winter:{far:'#DCE6F0', grass:'#EEF3F8', grassD:'#D6E0EA', grassL:'#FFFFFF', leaf:'#FFFFFF', leafD:'#D6E0EA', leafL:'#FFFFFF', ground:'#E2E8EF', bush:'#CBD6E2'},
};
const SKY_BANDS = {
  morning:['#BFE3FA', '#CBE9FA', '#D8EEF8', '#E6F2F2', '#F6EED8'],
  noon:   ['#8FCBEA', '#A2D5EE', '#B5DEF1', '#C9E6F2', '#E3EEE6'],
  evening:['#F2A47A', '#F7B48A', '#FAC59A', '#FCD6AC', '#FDE3BE'],
  night:  ['#1F2650', '#26305E', '#2E396B', '#374478', '#404E82'],
};
function pxSky(p, w, h, time, season){
  const bands = SKY_BANDS[time], bh = Math.ceil(h / bands.length);
  bands.forEach((c, i) => p.rect(0, i * bh, w, bh, c));
  if (time === 'night'){ p.shape(ell(w - 14, 9, 4), '#FFF3C4', '#E8D9A0'); p.shape(ell(w - 12, 8, 3.2), bands[0], null); [[10, 6], [30, 12], [52, 5], [66, 14], [20, 20]].forEach(([x, y]) => p.dot(x, y, '#fff')); }
  else { const [sx, sy] = time === 'morning' ? [16, 12] : time === 'evening' ? [w - 16, h - 10] : [w - 22, 9]; p.shape(ell(sx, sy, 4.5), time === 'evening' ? '#FFB45C' : '#FFE08A', time === 'evening' ? '#E8904A' : '#F2B84B');
    [[w * .18, 10], [w * .58, 18]].forEach(([x, y]) => p.shape(any(ell(x, y, 5, 2.6), ell(x + 4, y - 1.5, 3.6, 2.6), ell(x - 4, y + .5, 3, 2)), '#FFFFFF', null)); }
  if (season === 'winter') for (let i = 0; i < 18; i++) p.dot((i * 37) % w, (i * 23) % h, '#fff');
}
function pxTree(p, cx, base, k, season){
  const s = PX_SEASON[season];
  p.shape(box(Math.round(cx - 3 * k), Math.round(base - 22 * k), Math.round(cx + 3 * k), base), (x, y) => (x < cx ? '#9A6440' : '#7A4C2E'));
  if (season === 'winter'){
    [[0, -18, -9, -30], [0, -20, 8, -32], [0, -14, 10, -22], [0, -12, -10, -20]].forEach(([a, b, c, d]) => { p.line(cx + a * k, base + b * k, cx + c * k, base + d * k, OUT); p.dot(Math.round(cx + c * k), Math.round(base + d * k) - 1, '#fff'); p.dot(Math.round(cx + c * k) + 1, Math.round(base + d * k) - 1, '#fff'); });
    return;
  }
  // 둥근 덩어리 여러 개 + 왼쪽 위에서 빛 (밝은 쪽·어두운 쪽·잎 점)
  const C = [[0, -30, 12], [-10, -27, 9], [10, -27, 9], [-13, -18, 8], [13, -18, 8], [0, -17, 10], [-5, -39, 8], [6, -38, 8]];
  const crown = any(...C.map(([a, b, r]) => ell(cx + a * k, base + b * k, r * k)));
  const mid = base - 28 * k;
  p.shape(crown, (x, y) => { const d = (x - cx) * .8 + (y - mid);
    if ((x * 7 + y * 3) % 17 === 0) return s.leafL;
    return d > 8 * k ? s.leafD : d < -9 * k ? shade(s.leaf, .14) : s.leaf; });
}
// 잔디 디더링 + 풀포기
function pxGrass(p, y0, w, h, s, seed){
  const r = rng(seed);
  for (let y = y0; y < h; y++) for (let x = 0; x < w; x++){ const v = r(); p.dot(x, y, v < .07 ? s.grassD : v < .14 ? s.grassL : s.grass); }
  for (let i = 0; i < 30; i++){ const x = Math.floor(r() * w), y = y0 + 3 + Math.floor(r() * (h - y0 - 3)); p.dot(x, y, s.grassD); p.dot(x - 1, y + 1, s.grassD); p.dot(x + 1, y + 1, s.grassD); }
}
function pxLitter(p, x0, y0, w, h, season, n, seed){
  const r = rng(seed);
  for (let i = 0; i < n; i++){ const x = x0 + Math.floor(r() * w), y = y0 + Math.floor(r() * h);
    if (season === 'autumn') p.dot(x, y, ['#E58A3F', '#FFD27A', '#B85C2B'][i % 3]);
    if (season === 'spring') p.dot(x, y, '#FFB3C7');
    if (season === 'winter'){ p.dot(x, y, '#fff'); p.dot(x + 1, y, '#fff'); }
    if (season === 'summer' && i % 3 === 0){ [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([a, b]) => p.dot(x + a, y + b, i % 2 ? '#FFD23F' : '#fff')); p.dot(x, y, '#E8835F'); } }
}
function pxLamp(p, x, top, bottom, lit){
  p.shape(box(x, top + 4, x + 2, bottom), '#5A4A40');
  p.shape((a, b) => b >= top && b < top + 5 && a >= x - 2 + (b === top ? 1 : 0) && a < x + 4 - (b === top ? 1 : 0), lit ? '#FFE27A' : '#FFD23F');
}

// 작은 생명: 자는 고양이(10×6), 새(4×3)
function pxCat(p, x, y, fur = '#E8A86A'){
  p.shape(any(ell(x + 4, y + 4, 4, 2.4), ell(x + 8, y + 3, 2.2, 2), box(x + 7, y, x + 8, y + 2), box(x + 9, y, x + 10, y + 2)), (a, b) => ((a + b) % 3 === 0 ? shade(fur, -.15) : fur));
  p.dot(x + 8, y + 3, OUT); p.line(x, y + 5, x - 2, y + 3, OUT);
}
const pxBird = (p, x, y, c = '#8EC9FF') => { p.shape(any(ell(x + 2, y + 2, 2, 1.5), box(x + 3, y, x + 4, y + 2)), c); p.dot(x + 4, y + 1, '#F2B84B'); };

// ── 마을 거리 ──
const TOWN_PX_W = 100, TOWN_PX_H = 82;
// 건물 버튼 자리 (%): 그림과 같이 움직인다
const TOWN_HOTSPOTS = [   // box = 누르는 자리, sign = 간판 글자 자리 (%)
  {place:'shop', label:'가게', box:[1, 25, 39, 50], sign:[20, 32]},
  {place:'board', label:'게시판', box:[41, 35, 23, 40], sign:[52.5, 36]},
  {place:'park', label:'공원', box:[65, 22, 35, 53], sign:[83, 37]},
];
function townImage(season, time){
  return pxImage(`town|${season}|${time}`, TOWN_PX_W, TOWN_PX_H, p => {
    const s = PX_SEASON[season], W = TOWN_PX_W, lit = time === 'night' || time === 'evening', snow = season === 'winter';
    pxSky(p, W, 50, time, season);
    p.shape((x, y) => y >= 40 + Math.round(3 * Math.sin(x / 9)) && y < 62, s.far, null);
    // 공원 입구
    pxTree(p, 75, 50, .85, season); pxTree(p, 91, 50, .95, season);
    p.shape(rbox(64, 49, 100, 62), (x, y) => ((x + y) % 5 === 0 ? shade(s.bush, .1) : s.bush));
    [[68, 72], [93, 97]].forEach(([a, b]) => p.shape(box(a, 37, b, 62), '#FFF3D6'));
    p.shape((x, y) => { const v = ((x + .5 - 82.5) / 14) ** 2 + ((y + .5 - 41) / 9) ** 2; return v <= 1 && v >= .62 && y <= 39; }, '#86D9B9');
    p.shape(rbox(76, 28, 90, 33), '#FFFFFF');
    // 가게
    p.shape(rbox(4, 30, 36, 62), (x, y) => ((x + y * 3) % 17 === 0 ? '#F5DCB6' : '#FFE8C7'));
    p.shape((x, y) => y >= 21 && y < 31 && x >= 1 + Math.floor((30 - y) / 2) && x < 39 - Math.floor((30 - y) / 2), (x, y) => (snow && y < 24 ? '#FFFFFF' : y % 3 === 0 ? '#C9663F' : '#E8835F'));
    p.shape(rbox(12, 24, 28, 29), '#FFFFFF');
    p.shape(box(3, 32, 37, 36), (x, y) => (Math.floor(x / 4) % 2 ? '#FFFFFF' : '#FF9EB8'));
    for (let x = 3; x < 37; x++) if (x % 4 !== 0) p.dot(x, 36, Math.floor(x / 4) % 2 ? '#FFFFFF' : '#FF9EB8');
    for (let x = 3; x < 37; x++) if (x % 4 === 0) p.dot(x, 36, OUT);
    p.shape(rbox(7, 40, 21, 53), '#BFE3FF'); p.line(8, 49, 20, 49, OUT);
    p.shape(rbox(9, 45, 12, 49), '#FFD23F'); p.shape(ell(16.5, 47.5, 2.5, 2), '#FF9EB8'); p.dot(10, 42, '#fff'); p.dot(11, 41, '#fff');
    p.shape(rbox(24, 42, 33, 62), '#8EC9FF'); p.shape(rbox(26, 44, 31, 50), '#E3F4FF'); p.dot(31, 54, OUT);
    p.shape(any(ell(35, 52, 2, 3.5), ell(37.5, 51.5, 2, 3)), '#5FC79F'); p.shape(rbox(33, 56, 39, 62), '#E8835F');
    // 게시판
    p.shape((x, y) => y >= 29 && y < 35 && Math.abs(x + .5 - 52.5) <= (y - 29) * 2 + 2, (x, y) => (snow && y < 31 ? '#FFFFFF' : '#E8835F'));
    p.shape(box(46, 49, 48, 62), WOOD_D); p.shape(box(57, 49, 59, 62), WOOD_D);
    p.shape(rbox(43, 34, 62, 51), WOOD); p.shape(box(45, 36, 60, 49), '#F7D8A8', null);
    p.shape(box(46, 37, 51, 42), '#FFFFFF'); p.shape(box(53, 38, 59, 42), '#FFD23F'); p.shape(box(48, 44, 55, 48), '#86D9B9'); p.shape(box(56, 44, 59, 48), '#FFB3C7');
    [[48, 37], [56, 38], [51, 44]].forEach(([x, y]) => p.dot(x, y, '#D9583F'));
    pxLamp(p, 39, 36, 62, lit);
    // 길
    p.rect(0, 61, W, 13, s.ground); p.rect(0, 61, W, 1, OUT);
    for (let x = 4; x < W; x += 10) p.line(x, 62, x - 2, 73, shade(s.ground, -.08));
    p.rect(0, 73, W, 9, '#CFC4B6'); p.rect(0, 73, W, 1, OUT);
    for (let x = 2; x < W; x += 8) p.rect(x, 77, 4, 1, '#FFFFFF');
    pxLitter(p, 0, 63, W, 9, season, 16, 3);
    pxCat(p, 6, 63, season === 'winter' ? '#B9B2AA' : '#E8A86A');
    if (time !== 'night'){ pxBird(p, 77, 33); pxBird(p, 86, 31, '#FF9EB8'); }
  });
}
const townScene = (season, time) => pxImg(townImage(season, time), 'scene-img')
  + TOWN_HOTSPOTS.map(h => `<button type="button" class="hot" data-place="${h.place}" aria-label="${h.label}" style="left:${h.box[0]}%;top:${h.box[1]}%;width:${h.box[2]}%;height:${h.box[3]}%"></button><span class="sign" style="left:${h.sign[0]}%;top:${h.sign[1]}%">${h.label}</span>`).join('');

// ── 공원 ──
const PARK_PX_W = 100, PARK_PX_H = 122;
// 그네: 오른쪽 (기둥 77·97, 가로대 57~60, 앉는 판 82~85). 캐릭터 20칸이 기둥 사이에 들어가게
function drawSwing(p, season){
  [77, 97].forEach(x => p.shape(box(x, 59, x + 2, 93), '#C9573F'));
  p.shape(rbox(76, 57, 100, 60), '#E07A5F');
  [81, 94].forEach(x => p.line(x, 60, x, 82, '#6B5E4E'));
  p.shape(rbox(79, 82, 97, 85), season === 'winter' ? '#FFFFFF' : WOOD);
}
function parkImage(season, time){
  return pxImage(`park|${season}|${time}`, PARK_PX_W, PARK_PX_H, p => {
    const s = PX_SEASON[season], W = PARK_PX_W, H = PARK_PX_H, winter = season === 'winter';
    pxSky(p, W, 48, time, season);
    p.rect(0, 42, W, 6, shade(s.bush, -.15));
    p.shape(any(...Array.from({length:9}, (_, i) => ell(i * 12 + 4, 44 - (i % 2) * 2, 7, 6))), (x, y) => (y > 44 ? shade(s.bush, -.15) : (x + y) % 6 === 0 ? shade(s.bush, .12) : s.bush));
    pxGrass(p, 47, W, H, s, 11); p.rect(0, 47, W, 1, OUT);
    // 길
    const pathAt = t => [28 + 72 * t, 122 - 62 * Math.sin(t * Math.PI / 2)];
    const onPath = (x, y) => { for (let t = 0; t <= 1; t += .008){ const [a, b] = pathAt(t); if ((x + .5 - a) ** 2 + (y + .5 - b) ** 2 <= 20) return true; } return false; };
    p.shape(onPath, (x, y) => ((x * 7 + y * 13) % 23 === 0 ? shade(s.ground, -.15) : (x * 5 + y) % 17 === 0 ? shade(s.ground, .06) : s.ground), shade(s.ground, -.3));
    // 연못
    const pond = ell(76, 104, 17, 6.5);
    p.shape(pond, (x, y) => (winter ? ((x + y) % 9 === 0 ? '#FFFFFF' : '#DCEBFA') : y < 101 ? '#7CC3DD' : (y === 104 && x % 7 < 3) ? '#BFE6F5' : '#5DA9C9'), '#3E7FA0');
    if (!winter){ p.shape(ell(81, 102, 2.2, 1.3), '#5FC79F', '#3E8C5E'); p.shape(ell(70, 106, 2, 1.2), '#5FC79F', '#3E8C5E'); p.line(60, 100, 60, 94, OUT); p.line(62, 101, 62, 92, OUT); p.dot(62, 91, '#8A5A3A'); p.dot(62, 92, '#8A5A3A'); }
    [[59, 106], [62, 110], [92, 108], [88, 111]].forEach(([x, y]) => p.shape(ell(x, y, 1.8, 1.4), '#A89C8C', '#6B5E4E'));
    // 나무·가로등·울타리·벤치
    drawSwing(p, season);
    pxTree(p, 18, 82, 1, season);
    pxLamp(p, 40, 52, 81, time === 'night' || time === 'evening');
    [80, 86, 92, 98].forEach(x => p.shape(box(x, 53, x + 2, 63), WOOD));
    [55, 59].forEach(y => p.rect(79, y, 21, 2, WOOD_D));
    // 벤치 (그네 자리 때문에 왼쪽으로 4칸)
    [[50, 78], [68, 78]].forEach(([x, y]) => p.shape(box(x, y, x + 2, y + 7), WOOD_D));
    [[51, 68], [69, 68]].forEach(([x, y]) => p.shape(box(x, y, x + 2, y + 8), WOOD_D));
    p.shape(rbox(48, 65, 73, 69), WOOD); p.shape(rbox(48, 69, 73, 73), WOOD);
    p.shape(rbox(46, 75, 75, 79), (x, y) => (winter && y === 76 ? '#FFFFFF' : WOOD_D));
    for (let x = 47; x < 75; x++) if (x % 3) p.dot(x, 85, 'rgba(59,42,32,.25)');
    // 계절 장식
    pxLitter(p, 2, 56, 96, 62, season, 26, 7);
    if (winter){ p.shape(ell(10, 112, 5), '#FFFFFF'); p.shape(ell(10, 104, 3.6), '#FFFFFF'); p.dot(9, 103, OUT); p.dot(11, 103, OUT); p.dot(12, 104, '#E8835F'); }
    if (time !== 'night') pxBird(p, 87, 50, '#FF9EB8');
    if (season === 'autumn') p.shape(any(ell(7, 100, 2.4, 1.6), box(6, 100, 9, 103)), (x, y) => (y < 101 ? '#D9583F' : '#F2EBDD'));
  });
}
const parkScene = (season, time) => pxImg(parkImage(season, time), 'scene-img');
