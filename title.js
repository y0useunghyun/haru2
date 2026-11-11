// 타이틀 화면: 처음 온 사람에게만. 도트 로고 「하루」 + 노을 언덕의 작은 집 + 시작하기 → 첫 시작(drawFirst)
// 로고·그림 모두 코드로 한 칸씩 찍음 (에셋 없음). town.js 보다 먼저 불러옴 (start() 가 town.js 끝에서 실행)

// 글자 모양 18×18 (# = 칠함). 획 2~3칸, 그릴 때 2배로 키워서 외곽선을 둘러도 ㄹ 사이가 막히지 않게
const LOGO_GLYPHS = [
  { color:'#FFD23F', light:'#FFF1A8', dark:'#E8A317', rows:[   // 하
    '....####.....###..', '....####.....###..', '.............###..', '.##########..###..', '.##########..###..', '.............###..',
    '...######....###..', '..########...#####', '.###....###..#####', '.##......##..#####', '.##......##..###..', '.###....###..###..',
    '..########...###..', '...######....###..', '.............###..', '.............###..', '.............###..', '.............###..'] },
  { color:'#FF8FAB', light:'#FFD3DF', dark:'#E0607F', rows:[   // 루
    '.################.', '.################.', '..............###.', '..............###.', '.################.', '.################.',
    '.###..............', '.###..............', '.################.', '.################.', '..................', '##################',
    '##################', '.......####.......', '.......####.......', '.......####.......', '.......####.......', '.......####.......'] },
];
const LOGO_PAD = 5, LOGO_GAP = 5, LOGO_CELL = 2;

function logoImage(){
  const gw = 18 * LOGO_CELL, W = LOGO_PAD * 2 + gw * 2 + LOGO_GAP + 3, H = LOGO_PAD * 2 + gw + 3;
  return pxImage('logo', W, H, p => {
    // 칸마다 어느 글자인지 (없으면 -1)
    const at = (x, y) => LOGO_GLYPHS.findIndex((g, i) => {
      const gx = Math.floor((x - LOGO_PAD - i * (gw + LOGO_GAP)) / LOGO_CELL), gy = Math.floor((y - LOGO_PAD) / LOGO_CELL);
      return g.rows[gy]?.[gx] === '#';
    });
    const near = (x, y, r) => { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (at(x + a, y + b) >= 0) return true; return false; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      if (near(x - 3, y - 3, 1)) p.dot(x, y, 'rgba(59,42,32,.35)');   // 그림자
      if (near(x, y, 1)) p.dot(x, y, OUT);                            // 외곽선
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      const i = at(x, y); if (i < 0) continue;
      const g = LOGO_GLYPHS[i];
      p.dot(x, y, at(x, y - 1) < 0 || at(x - 1, y) < 0 ? g.light : at(x, y + 1) < 0 ? g.dark : g.color);   // 위·왼쪽은 밝게, 아래는 어둡게
    }
    // 「하」 위 새싹, 반짝이
    const sx = LOGO_PAD + 5 * LOGO_CELL, sy = LOGO_PAD - 1;
    [[0, 0], [1, -1], [-1, -2], [-2, -2], [2, -2], [3, -3], [-3, -3]].forEach(([a, b]) => p.dot(sx + a + 2, sy + b, b < -1 ? '#5FC79F' : '#3E8C5E'));
    const star = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => p.dot(x + a, y + b, a || b ? '#FFF1A8' : '#fff'));
    star(W - 4, 4); star(2, H - 6); star(W - 9, H - 3);
  });
}

// 노을 언덕 위 작은 집 (100×80칸)
function titleArt(){
  return pxImage('title-art', 100, 80, p => {
    ['#C9B6F0', '#E1B8EA', '#F5B9CF', '#FFC6AE', '#FFDCA6'].forEach((c, i) => p.rect(0, i * 11, 100, 11, c));   // 계단식 노을
    [[8, 4], [22, 9], [70, 3], [88, 8], [55, 6]].forEach(([x, y]) => p.dot(x, y, '#fff'));
    p.shape(ell(50, 58, 13), '#FFE88A', null);                                                                   // 지는 해
    p.shape(ell(18, 82, 46, 24), (x, y) => ((x * 3 + y) % 11 === 0 ? '#B5E3BC' : '#9FD8A8'));                     // 뒤 언덕
    p.shape(ell(84, 86, 50, 26), (x, y) => ((x * 5 + y) % 13 === 0 ? '#9AD8B0' : '#7CC79A'));                     // 앞 언덕
    const roof = (x, y) => y >= 34 && y < 46 && Math.abs(x + .5 - 50) <= (y - 34) + 3;
    p.shape(box(56, 33, 59, 40), '#B97A45');                                                                     // 굴뚝
    p.shape(rbox(40, 45, 61, 64), '#FFF3D6');                                                                    // 집
    p.shape(roof, (x, y) => (y % 3 === 0 ? '#C9573F' : '#E07A5F'));                                              // 지붕
    p.shape(rbox(43, 50, 50, 57), '#FFD23F'); p.line(46, 50, 46, 56, OUT); p.line(43, 53, 49, 53, OUT);          // 불 켜진 창
    p.shape(rbox(53, 53, 58, 64), '#B97A45'); p.dot(56, 58, '#FFD23F');                                          // 문
    for (let y = 64; y < 80; y++) for (let x = 54 - (y - 64) / 3; x < 58 + (y - 64) / 2; x++) p.dot(Math.round(x), y, '#F3E3C3');   // 길
    [[20, 66, '#FFB3C7'], [28, 70, '#FFD23F'], [76, 70, '#fff'], [86, 74, '#FFB3C7'], [12, 74, '#fff']].forEach(([x, y, c]) => { p.dot(x, y, c); p.dot(x + 1, y + 1, c); });
    [[34, 22], [36, 21], [38, 22]].forEach(([x, y]) => p.dot(x, y, OUT));                                        // 새
  });
}

function openTitle(){
  $('titleArt').innerHTML = `${pxImg(titleArt(), 'scene-img')}<div class="actor actor--static" style="--x:30;--y:97"><div class="char">${avatar(DEFAULT_LOOK)}</div></div>`;
  $('titleLogo').innerHTML = pxImg(logoImage(), 'title__logo-img');
  $('title').showModal();
}
$('titleGo').onclick = () => { $('title').close(); drawFirst(); $('first').showModal(); $('firstBody').querySelector('.vn__t')?.focus(); };   // showModal 이 「건너뛰기」에 포커스를 주지 않게
$('title').oncancel = e => e.preventDefault();   // Esc 로 닫으면 빈 화면이 되니 막음
