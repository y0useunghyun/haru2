// 하루 2 데이터. 아바타·음식·소품은 v3에서 그대로 옮김
const INK = '#191A18', MOUTH_IN = '#7A2E22', CHEEK = '#F08C7A';
const mix = (hex, to, k) => '#' + [1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-k) + to*k).toString(16).padStart(2,'0')).join('');
const dark = (h, k=.2) => mix(h, 0, k), light = (h, k=.3) => mix(h, 255, k);
const ln = (d, w=3.5, c=INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const SKIN  = ['#FBE3CF','#F5D2B5','#E9B994','#D19A72','#A86F4C','#7A4E33'];
const HAIRC = ['#22201E','#5A3A26','#A8683A','#D9B26A','#2E6B5E','#E58FA0'];
const SHIRT = ['#B3502A','#2E6B5E','#3D5A99','#E8C547','#F2EDE6','#22201E'];

const H_SHORT = 'M36 98 C34 50 66 26 100 26 C134 26 166 50 164 98 C156 72 140 58 100 56 C60 58 44 72 36 98Z';
const H_BANGS = 'M36 100 C32 48 66 24 100 24 C134 24 168 48 164 100 C160 88 152 80 146 76 L140 80 L128 68 L114 80 L100 68 L86 80 L72 68 L60 80 L54 76 C48 80 40 88 36 100Z';
const H_SIDE  = 'M36 104 C30 50 66 24 104 24 C140 26 168 52 164 100 C150 66 120 60 92 50 C76 70 52 78 36 104Z';
const H_FLAT  = 'M34 108 C30 46 66 26 100 26 C134 26 170 46 166 108 C162 92 156 80 150 76 Q100 70 50 76 C44 80 38 92 34 108Z';
const H_CURLY = 'M36 104 a14 14 0 0 1 4 -26 a16 16 0 0 1 12 -24 a16 16 0 0 1 22 -14 a16 16 0 0 1 26 -6 a16 16 0 0 1 26 6 a16 16 0 0 1 22 14 a16 16 0 0 1 12 24 a14 14 0 0 1 4 26 C156 74 132 64 100 64 C68 64 44 74 36 104Z';
const circle = (cx, cy, r) => `M${cx-r} ${cy} a${r} ${r} 0 1 0 ${2*r} 0 a${r} ${r} 0 1 0 ${-2*r} 0Z`;
// 폭탄 머리: 머리 둘레로 동그라미 9개 + 가운데 큰 원
const H_AFRO = circle(100,68,62) + Array.from({length:9}, (_,i)=>{ const a = (-200 + i*27.5)*Math.PI/180;
  return circle(100+58*Math.cos(a), 72+58*Math.sin(a), 26); }).join(' ');
const backTo = y => `M100 30 C152 30 172 62 172 110 L172 ${y-26} Q172 ${y} 146 ${y} L54 ${y} Q28 ${y} 28 ${y-26} L28 110 C28 62 48 30 100 30Z`;
const HAIR = [
  {front:H_SHORT},
  {front:H_BANGS},
  {front:H_SIDE},
  {front:H_FLAT, back:backTo(166)},
  {front:H_FLAT, back:backTo(214)},
  {front:H_SHORT, back:'M80 22 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0Z'},
  {front:H_SIDE, back:'M146 52 C186 60 194 124 172 168 C166 140 160 110 140 76Z'},               // 포니테일
  {front:H_BANGS, back:'M44 66 C12 76 8 132 22 156 C30 132 38 106 54 86Z M156 66 C188 76 192 132 178 156 C170 132 162 106 146 86Z'}, // 양갈래
  {front:H_CURLY},
  {front:H_CURLY, back:H_AFRO},   // 폭탄 머리
  {front:''},                     // 대머리
  // ── 남자 머리 (저장된 번호가 안 밀리게 맨 뒤에 추가) ──
  // stub = 짧게 민 옆머리(반투명), op = 머리 전체 불투명도, lines = 결 표시 선
  {front:'M42 78 C40 40 70 22 100 22 C130 22 160 40 158 78 C150 70 140 64 128 66 L120 58 L108 66 L96 58 L84 66 L72 60 C60 64 50 70 42 78Z',
   stub:'M37 100 C36 82 40 72 47 66 L54 92Z M163 100 C164 82 160 72 153 66 L146 92Z'},                                   // 투블럭
  {front:'M38 92 C38 52 66 32 100 32 C134 32 162 52 162 92 C150 74 128 66 100 66 C72 66 50 74 38 92Z', op:.6},           // 버즈컷
  {front:'M34 104 C30 46 66 24 100 24 C134 24 170 46 166 104 C160 92 154 86 144 84 Q132 88 120 84 Q108 88 96 84 Q84 88 72 84 Q62 88 56 84 C46 88 40 94 34 104Z'}, // 댄디컷
  {front:'M38 96 C34 56 56 30 84 22 C96 10 130 8 146 24 C162 38 166 62 162 96 C156 78 146 66 132 60 C118 52 96 52 80 56 C62 60 46 74 38 96Z',
   lines:'M86 52 C96 38 118 32 136 38 M98 55 C108 45 124 43 140 49'},                                                    // 포마드
  {front:'M36 100 C30 48 66 24 102 24 C140 26 168 50 164 100 C158 82 148 72 136 66 C116 60 92 62 74 72 C64 78 58 86 60 94 C54 92 50 86 52 80 C46 86 40 92 36 100Z',
   lines:'M124 38 C104 44 84 56 72 74'},                                                                                  // 쉼표머리
  {front:'M38 96 C36 70 40 56 46 48 L44 30 L62 40 L66 18 L82 32 L94 10 L104 30 L120 12 L126 34 L144 22 L142 42 L160 40 L154 56 C160 66 164 80 162 96 C150 72 128 62 100 62 C72 62 50 72 38 96Z'}, // 스파이크
  {front:H_BANGS, back:'M100 30 C150 30 172 60 172 104 L174 150 L162 142 L164 162 L150 150 L148 166 L52 166 L50 150 L36 162 L38 142 L26 150 L28 104 C28 60 50 30 100 30Z'}, // 울프컷
];

// 눈: (x, s) s = 왼쪽 -1, 오른쪽 1
const lash = (x,s) => ln(`M${x-12*s} 97 Q${x} 84 ${x+12*s} 95 l${5*s} -4`, 3.2);
const EYES = [
  x => `<ellipse cx="${x}" cy="103" rx="6.5" ry="8.5" fill="${INK}"/><circle cx="${x+2.5}" cy="99.5" r="2.2" fill="#fff"/>`,
  (x,s) => `<ellipse cx="${x}" cy="104" rx="11" ry="11.5" fill="#fff"/><ellipse cx="${x}" cy="104.5" rx="8.5" ry="10.5" fill="#33408A"/><ellipse cx="${x}" cy="108.5" rx="6" ry="4.5" fill="#6478D8" opacity=".6"/><ellipse cx="${x}" cy="104.5" rx="4" ry="5.5" fill="${INK}"/><circle cx="${x+3}" cy="99.5" r="3" fill="#fff"/><circle cx="${x-3}" cy="109" r="1.4" fill="#fff"/>` + lash(x,s),
  x => ln(`M${x-9} 106 Q${x} 95 ${x+9} 106`),
  x => ln(`M${x-9} 103 L${x+9} 103`),
  x => `<path d="M${x-11} 104 Q${x} 92 ${x+11} 104 Q${x} 112 ${x-11} 104Z" fill="${INK}"/><circle cx="${x+3}" cy="101" r="2.2" fill="#fff"/>`,
  (x,s) => `<ellipse cx="${x}" cy="104" rx="9.5" ry="11.5" fill="#3A2A22"/><ellipse cx="${x}" cy="108.5" rx="6" ry="4.5" fill="#9A6A48" opacity=".7"/><circle cx="${x+3}" cy="99" r="3.4" fill="#fff"/><circle cx="${x-3.5}" cy="108.5" r="1.8" fill="#fff"/>` + lash(x,s),
];
const EYE_SLEEPY = x => ln(`M${x-9} 104 Q${x} 110 ${x+9} 104`);
// 눈썹 색 = 머리색
const BROWS = [
  (x,s,c) => ln(`M${x-10} 85 L${x+10} 85`,3,c),
  (x,s,c) => ln(`M${x-11} 87 Q${x} 79 ${x+11} 87`,3,c),
  (x,s,c) => ln(`M${x+10*s} 88 L${x-10*s} 82`,3,c),
  (x,s,c) => ln(`M${x-11} 87 Q${x} 79 ${x+11} 87`,6,c),
];
const MOUTH = [
  ln('M90 124 Q100 134 110 124',3),
  ln('M88 124 Q94 131 100 124 Q106 131 112 124',3),
  ln('M92 128 L108 128',3),
  `<path d="M88 122 Q100 124 112 122 Q110 140 100 140 Q90 140 88 122Z" fill="${MOUTH_IN}"/><ellipse cx="100" cy="136" rx="6" ry="3.5" fill="#E07A6E"/>`,
  `<ellipse cx="100" cy="128" rx="5" ry="6.5" fill="${MOUTH_IN}"/>`,
  `<path d="M86 122 Q100 126 114 122 Q112 138 100 138 Q88 138 86 122Z" fill="${MOUTH_IN}"/><path d="M88.5 123 Q100 126.5 111.5 123 L110.5 127.5 Q100 130 89.5 127.5Z" fill="#fff"/>`,
];
const NOSE = [
  () => '',
  sk => `<ellipse cx="100" cy="114" rx="2.6" ry="2" fill="${dark(sk,.3)}"/>`,
  sk => ln('M99 108 Q105 114 99 117',2.5,dark(sk,.3)),
  sk => `<ellipse cx="100" cy="114" rx="6" ry="4.5" fill="${dark(sk,.1)}"/><ellipse cx="98" cy="112.5" rx="2" ry="1.3" fill="#fff" opacity=".6"/>`,
];
const EARS = [12, 9, 15];
const lens = (fill, op) => `<g fill="${fill}" fill-opacity="${op}" stroke="${INK}" stroke-width="2.5">`;
const frame = ln('M91 101 Q100 96 109 101',2.5) + ln('M60 99 L42 96',2.5) + ln('M140 99 L158 96',2.5);
const GLASSES = [
  '',
  lens('#fff',.18) + '<circle cx="76" cy="103" r="15"/><circle cx="124" cy="103" r="15"/></g>' + frame,
  lens('#fff',.18) + '<rect x="60" y="91" width="32" height="24" rx="7"/><rect x="108" y="91" width="32" height="24" rx="7"/></g>' + frame,
  lens(INK,.88) + '<rect x="60" y="91" width="32" height="24" rx="7"/><rect x="108" y="91" width="32" height="24" rx="7"/></g>' + frame + ln('M66 99 L72 95',2,'rgba(255,255,255,.5)') + ln('M114 99 L120 95',2,'rgba(255,255,255,.5)'),
];
const MARKS = [
  () => '',
  () => `<circle cx="134" cy="113" r="1.8" fill="${INK}" opacity=".8"/>`,
  sk => [[60,112],[66,116],[72,112],[128,112],[134,116],[140,112]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.4" fill="${dark(sk,.35)}"/>`).join(''),
  () => `<g transform="rotate(-20 134 116)"><rect x="122" y="111" width="24" height="10" rx="5" fill="#F3D2A6" stroke="#D9B285" stroke-width="1.5"/><rect x="130" y="112.5" width="8" height="7" rx="1.5" fill="#E7B987"/></g>`,
];
const OUTFIT_N = 3;   // 티셔츠 / 후드 / 레이어드(긴팔 겹쳐 입기)

// 몸: 레퍼런스 비율(몸 폭 ≈ 머리의 60%) + 짧고 통통한 팔을 살짝 벌림.
// 오른팔은 평소(arm-rest) / 인사(arm-wave) 두 벌 → 점프할 때만 손 흔들기 (CSS .char.hop)
// stroke2 = 외곽선 먼저 굵게 → 채움을 위에 (이음새 없는 한 덩어리)
const stroke2 = (d, w, c, edge) => ln(d, w+4, edge) + ln(d, w, c);
function body(o, sk, sh, grad){
  const edge = dark(sh,.25), pants = '#5B5F66';
  const armC = [sk, sh, light(sh,.55)][o];   // 티셔츠 = 맨팔, 후드 = 옷 색 긴팔, 레이어드 = 밝은 긴팔
  const armEdge = o===0 ? dark(sk,.18) : edge;
  const arm = d => stroke2(d, 12, armC, armEdge);
  const hand = (x,y) => `<circle cx="${x}" cy="${y}" r="7" fill="${sk}" stroke="${dark(sk,.18)}" stroke-width="2"/>`;
  const sleeve = d => `<path d="${d}" fill="${sh}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>`;
  return `
  ${stroke2('M89 204 L89 224 M111 204 L111 224', 13, pants, dark(pants,.3))}
  <ellipse cx="88" cy="229" rx="11" ry="6" fill="${INK}"/><ellipse cx="112" cy="229" rx="11" ry="6" fill="${INK}"/>
  ${arm('M66 179 L57 196')}${hand(56,198)}
  <g class="arm-rest">${arm('M134 179 L143 196')}${hand(144,198)}</g>
  <g class="arm-wave">${arm('M134 166 L150 146')}${hand(152,143)}</g>
  <path d="M75 150 Q100 144 125 150 L130 207 Q100 213 70 207Z" fill="url(#${grad})" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>
  ${o===1
    ? sleeve('M72 154 Q100 134 128 154 L123 165 Q100 152 77 165Z') + ln('M94 162 L93 182',2,light(sh,.6)) + ln('M106 162 L107 182',2,light(sh,.6))
    : ln('M88 153 Q100 162 112 153',2,edge)}
  ${sleeve('M78 151 L61 176 L72 183 L80 168Z')}
  <g class="arm-rest">${sleeve('M122 151 L139 176 L128 183 L120 168Z')}</g>
  <g class="arm-wave">${sleeve('M122 151 L144 158 L138 171 L120 168Z')}</g>`;
}

let uid = 0;   // 썸네일 여러 개가 한 화면에 있어서 그라데이션 id 따로
function avatar(L, {sleepy=false, cheek=.5, crop='', shadow=true}={}){
  const id = 'av' + uid++;
  const H = HAIR[L.hair], hc = HAIRC[L.hairColor], sk = SKIN[L.skin], sh = SHIRT[L.shirt], R = EARS[L.ears];
  const sides = [[76,-1],[124,1]], eye = sleepy ? EYE_SLEEPY : EYES[L.eyes];
  const skinLine = `stroke="${dark(sk,.18)}" stroke-width="2"`;
  const hairLine = `stroke="${dark(hc,.3)}" stroke-width="2" stroke-linejoin="round"`;
  const box = {face:'26 6 148 156', body:'30 118 140 132'}[crop] || '0 0 200 250';
  return `<svg class="av" viewBox="${box}" aria-hidden="true">
    <defs>
      <radialGradient id="${id}s" cx=".4" cy=".32" r=".75"><stop offset="0" stop-color="${light(sk,.3)}"/><stop offset="1" stop-color="${dark(sk,.06)}"/></radialGradient>
      <radialGradient id="${id}h" cx=".4" cy=".25" r=".8"><stop offset="0" stop-color="${light(hc,.2)}"/><stop offset="1" stop-color="${dark(hc,.1)}"/></radialGradient>
      <radialGradient id="${id}c"><stop offset="0" stop-color="${CHEEK}" stop-opacity=".9"/><stop offset="1" stop-color="${CHEEK}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}t" x2="0" y2="1"><stop offset="0" stop-color="${light(sh,.08)}"/><stop offset="1" stop-color="${dark(sh,.14)}"/></linearGradient>
      <clipPath id="${id}f"><path d="${H.front}"/></clipPath>
    </defs>
    ${crop || !shadow ? '' : `<ellipse cx="100" cy="234" rx="34" ry="5" fill="${INK}" opacity=".1"/>`}
    <g class="av-body">
      ${H.back ? `<path d="${H.back}" fill="none" ${hairLine.replace('2"','3.5"')}/><path d="${H.back}" fill="url(#${id}h)"/>` : ''}
      ${crop==='face' ? '' : body(L.outfit, sk, sh, id+'t')}
      ${[[38,1],[162,-1]].map(([cx,d])=>`<circle cx="${cx}" cy="104" r="${R}" fill="${sk}" ${skinLine}/><ellipse cx="${cx-d*R*.1}" cy="105" rx="${R*.45}" ry="${R*.6}" fill="${dark(sk,.1)}"/>`).join('')}
      <ellipse cx="100" cy="94" rx="64" ry="60" fill="url(#${id}s)" ${skinLine}/>
      <g opacity="${cheek}"><ellipse cx="64" cy="118" rx="15" ry="10" fill="url(#${id}c)"/><ellipse cx="136" cy="118" rx="15" ry="10" fill="url(#${id}c)"/></g>
      ${MARKS[L.marks](sk)}
      ${sides.map(([x,s])=>BROWS[L.brows](x,s,dark(hc,.1))).join('')}
      <g class="av-eyes">${sides.map(([x,s])=>eye(x,s)).join('')}</g>
      ${NOSE[L.nose](sk)}
      ${MOUTH[L.mouth]}
      ${GLASSES[L.glasses]}
      ${H.stub ? `<path d="${H.stub}" fill="${hc}" opacity=".45"/>` : ''}
      <path d="${H.front}" fill="url(#${id}h)" ${hairLine} opacity="${H.op ?? 1}"/>
      ${H.lines ? ln(H.lines, 2, dark(hc,.35)) : ''}
      <path d="M58 46 Q100 24 142 46" clip-path="url(#${id}f)" fill="none" stroke="${light(hc,.45)}" stroke-width="4" stroke-dasharray="10 7" stroke-linecap="round" opacity=".6"/>
      ${sleepy && !crop ? '<text class="zzz" x="158" y="40">z z</text>' : ''}
    </g></svg>`;
}
// 꾸미기 탭: 모양은 미리보기 썸네일, 색은 동그라미
const PARTS = [
  {k:'hair', label:'헤어', n:HAIR.length},
  {k:'hairColor', label:'머리색', colors:HAIRC},
  {k:'eyes', label:'눈', n:EYES.length},
  {k:'brows', label:'눈썹', n:BROWS.length},
  {k:'mouth', label:'입', n:MOUTH.length},
  {k:'nose', label:'코', n:NOSE.length},
  {k:'skin', label:'피부', colors:SKIN},
  {k:'ears', label:'귀', n:EARS.length},
  {k:'glasses', label:'안경', n:GLASSES.length},
  {k:'marks', label:'점', n:MARKS.length},
  {k:'outfit', label:'옷', n:OUTFIT_N, crop:'body'},
  {k:'shirt', label:'옷 색', colors:SHIRT},
];
const DEFAULT_LOOK = {skin:1, hair:1, hairColor:0, eyes:1, brows:1, mouth:1, nose:0, ears:0, glasses:0, marks:0, outfit:0, shirt:0};
// ── 음식 데이터 ────────────────────────────
// 음식 → 단백질·탄수·채소 (0~2). ponytail: 키워드 표, 실제 서비스는 AI 추정으로 교체
const FOOD = {
  '닭가슴살':[[2,0,0],'기름기 적은 단백질. 근육 회복을 돕고 오래 배불러요'],
  '계란':[[1,0,0],'흡수가 잘 되는 단백질. 아침에 특히 좋아요'],
  '두부':[[1,0,0],'속이 편한 식물성 단백질'],
  '고기':[[2,0,0],'단백질과 철분. 운동한 날 회복에 좋아요'],
  '생선':[[2,0,0],'단백질에 좋은 지방(오메가3)까지'],
  '연어':[[2,0,0],'단백질 + 오메가3. 피곤한 날 좋아요'],
  '밥':[[0,2,0],'몸과 머리가 바로 쓰는 에너지'],
  '빵':[[0,2,0],'빠른 에너지. 단백질을 곁들이면 더 오래 가요'],
  '면':[[0,2,0],'빠른 에너지. 채소를 곁들이면 균형이 맞아요'],
  '파스타':[[0,2,0],'에너지. 소스에 따라 기름질 수 있어요'],
  '떡':[[0,2,0],'빠른 에너지. 금방 배고플 수 있어요'],
  '고구마':[[0,1,1],'천천히 쓰는 에너지 + 식이섬유'],
  '샐러드':[[0,0,2],'비타민과 식이섬유. 소화를 도와요'],
  '나물':[[0,0,1],'식이섬유와 미네랄'],
  '김치':[[0,0,1],'채소 + 유산균. 짠 편이라 적당히'],
  '브로콜리':[[0,0,2],'비타민C와 식이섬유가 많아요'],
  '국':[[0,0,1],'수분과 채소. 국물은 짤 수 있어요'],
  '비빔밥':[[1,2,1],'밥·채소·계란이 한 그릇에. 균형이 좋아요'],
  '김밥':[[1,2,1],'탄수화물·채소·단백질이 고루'],
  '제육':[[2,0,0],'단백질이 많아요. 조금 기름진 편'],
  '된장찌개':[[1,0,1],'두부 단백질 + 채소, 발효 식품'],
  '샌드위치':[[1,1,1],'빵·채소·단백질이 고루'],
  // 자주 먹는 것 추가 (채소 = 채소·과일)
  '닭':[[2,0,0],'단백질이 많아요'], '치킨':[[2,0,0],'단백질이 많아요. 튀김이라 기름진 편'],
  '삼겹살':[[2,0,0],'단백질 + 지방이 많은 편'], '돈까스':[[2,1,0],'단백질 + 튀김옷 탄수화물'], '돈가스':[[2,1,0],'단백질 + 튀김옷 탄수화물'],
  '스테이크':[[2,0,0],'단백질과 철분'], '새우':[[2,0,0],'기름기 적은 단백질'], '참치':[[2,0,0],'단백질 + 오메가3'],
  '햄':[[1,0,0],'단백질. 짠 편이에요'], '소시지':[[1,0,0],'단백질. 짠 편이에요'], '치즈':[[1,0,0],'단백질과 칼슘'],
  '우유':[[1,0,0],'단백질과 칼슘'], '요거트':[[1,0,0],'단백질 + 유산균'], '두유':[[1,0,0],'식물성 단백질'],
  '만두':[[1,1,1],'고기·채소·밀가루가 고루'], '초밥':[[1,2,0],'생선 단백질 + 밥'], '피자':[[1,2,0],'치즈 단백질 + 빵. 기름진 편'],
  '햄버거':[[1,2,0],'고기 단백질 + 빵'], '버거':[[1,2,0],'고기 단백질 + 빵'],
  '라면':[[0,2,0],'빠른 에너지. 국물은 짠 편'], '국수':[[0,2,0],'빠른 에너지'], '우동':[[0,2,0],'빠른 에너지'],
  '토스트':[[0,2,0],'빠른 에너지'], '시리얼':[[0,2,0],'빠른 에너지'], '오트밀':[[0,2,0],'천천히 쓰는 에너지 + 식이섬유'],
  '죽':[[0,1,0],'속이 편한 에너지'], '감자':[[0,1,0],'에너지 + 칼륨'], '옥수수':[[0,1,0],'에너지 + 식이섬유'],
  '카레':[[0,1,1],'채소가 들어간 소스'], '찌개':[[0,0,1],'채소가 들어간 국물. 짤 수 있어요'],
  '바나나':[[0,1,1],'빠른 에너지 + 칼륨'], '사과':[[0,0,1],'비타민과 식이섬유'], '과일':[[0,0,1],'비타민과 식이섬유'],
  '토마토':[[0,0,1],'비타민과 항산화'], '쌈':[[0,0,1],'잎채소를 듬뿍'], '아보카도':[[0,0,1],'좋은 지방 + 식이섬유'],
};
const FOOD_KEYS = Object.keys(FOOD).sort((a,b)=>b.length-a.length);   // 「비빔밥」이 「밥」보다 먼저 걸리게
const NUT_TIP = ['계란·두부·고기를 곁들여 보세요','밥이나 고구마를 조금 더해 보세요','나물이나 샐러드를 곁들여 보세요'];
// 목표: 영양마다 하루 끼니 수만큼 + 목적에 따라 가감 (최소 1)
const AIMS = [{label:'균형 있게', d:[0,0,0]}, {label:'근육 늘리기', d:[1,0,0]}, {label:'가볍게 먹기', d:[0,-1,1]}];
const MEAL_COUNTS = [2,3,4];
const DEFAULT_GOALS = {meals:3, aim:0};
const goalBase = g => [0,1,2].map(i=>Math.max(1, g.meals + AIMS[g.aim].d[i]));
const MOVE_TYPES = {
  '걷기':'가볍게 몸을 깨워요', '달리기':'심폐 운동 · 에너지를 많이 써요', '근력':'근육 회복에 단백질이 필요해요',
  '자전거':'하체와 심폐를 같이 써요', '요가':'몸을 풀고 긴장을 낮춰요', '수영':'전신 운동 · 에너지를 많이 써요', '구기':'전신 · 순발력',
};
const SUGGEST = ['닭가슴살 밥','비빔밥','샐러드','김밥','제육 덮밥','된장찌개 밥'];
const NUT = ['단백질','탄수화물','채소'];
const MEALS = ['아침','점심','저녁','간식'];
const P = (vb, body) => `<svg viewBox="${vb}" fill="none" stroke="#1E1B18" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
// 장식 줄: 가랜드 곡선 위 점들
const curve = xs => xs.map(x=>{ const t = (x-4)/192; return [x, 6 + 48*t*(1-t)]; });
const PC = ['#FF9EB8','#FFD23F','#86D9B9','#8EC9FF'];
const star = (x,y,r) => `M${x} ${y-r} L${x+r*.3} ${y-r*.3} L${x+r} ${y} L${x+r*.3} ${y+r*.3} L${x} ${y+r} L${x-r*.3} ${y+r*.3} L${x-r} ${y} L${x-r*.3} ${y-r*.3}Z`;
const outlineFill = (shapes, fill) => `<g stroke-width="4">${shapes}</g><g fill="${fill}" stroke="none">${shapes}</g>`;   // 겹친 도형 안쪽 선 없이
const POT = c => `<path d="M16 46 H44 L40 76 H20Z" fill="${c}"/>`;
const FLOOR_DOT = c => `<ellipse cx="25" cy="101" rx="14" ry="5" fill="${c}"/>`;
const PROPS = [
  {need:1, id:'plant', name:'화분', layer:'floor', kinds:[
    ['잎 화분', P('0 0 60 80','<path d="M30 46 C18 34 14 20 20 10 C28 18 30 30 30 46Z" fill="#86D9B9"/><path d="M30 46 C40 36 48 26 46 14 C36 20 32 32 30 46Z" fill="#5FC79F"/>'+POT('#E8835F'))],
    ['선인장', P('0 0 60 80','<path d="M24 34 H18 a4 4 0 0 1 -4 -4 V24 a3 3 0 0 1 6 0 V28 H24" fill="#86D9B9"/><path d="M36 30 H42 a4 4 0 0 0 4 -4 V18 a3 3 0 0 0 -6 0 V24 H36" fill="#86D9B9"/><path d="M24 46 V20 a6 6 0 0 1 12 0 V46Z" fill="#86D9B9"/><circle cx="30" cy="13" r="3" fill="#FF9EB8"/>'+POT('#C9B6F2'))],
    ['튤립', P('0 0 60 80','<path d="M30 46 V22"/><path d="M30 42 C22 38 20 32 22 28 C28 30 30 36 30 42Z" fill="#5FC79F"/><path d="M22 12 L26 18 L30 10 L34 18 L38 12 V22 C38 28 22 28 22 22Z" fill="#FF9EB8"/>'+POT('#FFD23F'))]]},
  {need:3, id:'rug', name:'러그', layer:'floor', kinds:[
    ['줄무늬', P('0 0 200 36','<ellipse cx="100" cy="18" rx="96" ry="15" fill="#FFB3C7"/><ellipse cx="100" cy="18" rx="74" ry="9" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/>')],
    ['체크', P('0 0 200 36','<rect x="8" y="4" width="184" height="28" rx="6" fill="#8EC9FF"/><path d="M38 4 V32 M68 4 V32 M98 4 V32 M128 4 V32 M158 4 V32 M8 18 H192" stroke="#fff" stroke-width="5"/><rect x="8" y="4" width="184" height="28" rx="6"/>')],
    ['구름', P('0 0 200 36', outlineFill('<ellipse cx="44" cy="20" rx="38" ry="12"/><ellipse cx="100" cy="16" rx="46" ry="13"/><ellipse cx="156" cy="20" rx="38" ry="12"/>','#C9B6F2'))]]},
  {need:5, id:'frame', name:'액자', layer:'wall', kinds:[
    ['산', P('0 0 50 60','<path d="M10 14 L25 3 L40 14"/><rect x="4" y="14" width="42" height="42" rx="4" fill="#FFD23F"/><path d="M11 49 L21 33 L29 43 L35 37 L41 49Z" fill="#86D9B9"/><circle cx="35" cy="24" r="4" fill="#fff"/>')],
    ['하트', P('0 0 50 60','<path d="M10 14 L25 3 L40 14"/><rect x="4" y="14" width="42" height="42" rx="4" fill="#FF9EB8"/><path d="M25 47 C12 38 12 27 19 26 C22 26 24 28 25 30 C26 28 28 26 31 26 C38 27 38 38 25 47Z" fill="#fff"/>')],
    ['고양이', P('0 0 50 60','<path d="M10 14 L25 3 L40 14"/><rect x="4" y="14" width="42" height="42" rx="4" fill="#8EC9FF"/><path d="M15 34 L16 23 L23 29Z M35 34 L34 23 L27 29Z" fill="#fff"/><circle cx="25" cy="37" r="11" fill="#fff"/><circle cx="21" cy="36" r="1.6" fill="#1E1B18" stroke="none"/><circle cx="29" cy="36" r="1.6" fill="#1E1B18" stroke="none"/>')]]},
  {need:8, id:'lamp', name:'조명', layer:'floor', kinds:[
    ['스탠드', P('0 0 50 110','<path d="M10 34 L40 34 L34 6 L16 6Z" fill="#FFD23F"/><path d="M25 34 V98" stroke-width="3"/>'+FLOOR_DOT('#1E1B18'))],
    ['버섯 램프', P('0 0 50 110','<rect x="19" y="68" width="12" height="32" rx="5" fill="#FFF3D6"/><path d="M5 70 C5 50 45 50 45 70Z" fill="#FF9EB8"/><circle cx="16" cy="63" r="3" fill="#fff" stroke="none"/><circle cx="32" cy="60" r="2.5" fill="#fff" stroke="none"/>'+FLOOR_DOT('#1E1B18'))],
    ['촛불', P('0 0 50 110','<rect x="17" y="72" width="16" height="28" rx="3" fill="#fff"/><path d="M25 72 V66"/><path d="M25 52 C31 59 31 66 25 66 C19 66 19 59 25 52Z" fill="#FFD23F"/>'+FLOOR_DOT('#C9B6F2'))]]},
  {need:0, id:'window', name:'창문', layer:'wall', kinds:[
    ['네모', P('0 0 60 60','<rect x="4" y="4" width="52" height="52" rx="8" fill="#BFE3FF"/><path d="M30 4 V56 M4 30 H56"/><circle cx="17" cy="17" r="5" fill="#fff" stroke="none"/>')],
    ['동그라미', P('0 0 60 60','<circle cx="30" cy="30" r="26" fill="#BFE3FF"/><path d="M30 4 V56 M4 30 H56"/><circle cx="18" cy="18" r="5" fill="#fff" stroke="none"/>')],
    ['아치', P('0 0 60 60','<path d="M6 56 V28 a24 24 0 0 1 48 0 V56Z" fill="#BFE3FF"/><path d="M30 4 V56 M6 34 H54"/><circle cx="20" cy="20" r="4" fill="#fff" stroke="none"/>')]]},
  {need:12, id:'books', name:'소품', layer:'floor', kinds:[
    ['책', P('0 0 50 44','<rect x="4" y="30" width="42" height="12" rx="2" fill="#8EC9FF"/><rect x="8" y="18" width="36" height="12" rx="2" fill="#FF9EB8"/><rect x="6" y="6" width="38" height="12" rx="2" fill="#FFD23F"/>')],
    ['곰인형', P('0 0 50 44','<ellipse cx="25" cy="35" rx="12" ry="8" fill="#C98B5A"/><circle cx="14" cy="10" r="5" fill="#C98B5A"/><circle cx="36" cy="10" r="5" fill="#C98B5A"/><circle cx="25" cy="17" r="11" fill="#C98B5A"/><ellipse cx="25" cy="21" rx="4" ry="3" fill="#F1D7BD"/><circle cx="21" cy="15" r="1.4" fill="#1E1B18" stroke="none"/><circle cx="29" cy="15" r="1.4" fill="#1E1B18" stroke="none"/>')],
    ['게임기', P('0 0 50 44','<rect x="5" y="16" width="40" height="24" rx="9" fill="#8EC9FF"/><path d="M12 28 H20 M16 24 V32"/><circle cx="32" cy="26" r="2.6" fill="#FF9EB8"/><circle cx="38" cy="31" r="2.6" fill="#FFD23F"/>')]]},
  {need:18, id:'garland', name:'장식', layer:'wall', kinds:[
    ['가랜드', P('0 0 200 40','<path d="M4 6 Q100 54 196 6"/>' + curve([24,52,80,108,136,164]).map(([x,y],i)=>`<path d="M${x-9} ${y} L${x+9} ${y} L${x} ${y+16}Z" fill="${PC[i%4]}"/>`).join(''))],
    ['전구줄', P('0 0 200 40','<path d="M4 6 Q100 54 196 6"/>' + curve([24,48,72,100,128,152,176]).map(([x,y],i)=>`<rect x="${x-3}" y="${y}" width="6" height="4" fill="#1E1B18"/><ellipse cx="${x}" cy="${y+10}" rx="5" ry="7" fill="${PC[i%4]}"/>`).join(''))],
    ['별', P('0 0 200 40', curve([30,70,100,130,170]).map(([x,y],i)=>`<path d="M${x} 0 V${y+4}"/><path d="${star(x,y+12,9)}" fill="${['#FFD23F','#FF9EB8','#FFD23F','#8EC9FF','#FFD23F'][i]}"/>`).join(''))]]},
];

// ── 성격 4가지 ────────────────────────────
// 기준: 학교 선생님이 해도 이상하지 않은 말이면 다시 쓴다. 상태만 말하고 원인은 말하지 않는다.
const PERSONALITIES = {
  active:  {label:'활발함',    sample:'오늘은 뭔가 재밌는 일이 생길 것 같아!', register:'casual'},
  calm:    {label:'차분함',    sample:'오늘도 여기 있었네요. 편하게 쉬어요.', register:'polite'},
  playful: {label:'장난스러움', sample:'어? 나 방금 엄청난 걸 발견했어!', register:'casual'},
  curious: {label:'호기심 많음', sample:'저건 뭐예요? 처음 보는 것 같아요.', register:'polite'},
};
const CASUAL = {
  full:['오늘 든든해','배가 빵빵해'],
  hungry:['배고파','꼬르륵 소리 났어'],
  crave:[['단백질이 당겨','고기 한 점 생각나'],['밥이 당겨','따끈한 밥 생각나'],['초록색이 당겨','채소가 먹고 싶어']],
  moved:['운동했더니 단백질이 당겨','땀 흘렸더니 단백질 생각나'],
  sleepy:['눈이 무거워','오늘은 일찍 눕고 싶어'],
  lazy:['나도 오늘 귀찮아. 물 한 잔만 할까?','오늘은 우리 좀 쉬어볼까?'],
  rest:['그런 날도 있는 거지!','아무것도 안 하는 것도 일이야'],
  unknown:'이건 처음 보는 음식이야!',
  back:'오랜만이야! 나 여기서 잘 지내고 있었어.',
};
const POLITE = {
  full:['오늘 든든해요','배가 따뜻해요'],
  hungry:['배고파요','꼬르륵 소리가 났어요'],
  crave:[['단백질이 당겨요','고기 한 점 생각나요'],['밥이 당겨요','따끈한 밥 생각나요'],['초록색이 당겨요','채소가 먹고 싶어요']],
  moved:['운동했더니 단백질이 당겨요','땀 흘렸더니 단백질 생각나요'],
  sleepy:['눈이 무거워요','오늘은 일찍 눕고 싶어요'],
  lazy:['저도 오늘 귀찮아요. 물 한 잔만 할까요?','오늘은 우리 좀 쉬어볼까요?'],
  rest:['그런 날도 있는 거죠','아무것도 안 하는 것도 좋아요'],
  unknown:'이건 처음 보는 음식이에요',
  back:'오랜만이에요. 저는 여기서 잘 지내고 있었어요.',
};
const LINES = {
  active: {...CASUAL,
    hello:{morning:['일어났어! 오늘 뭐 할까?','아침이다, 창문 열자!'],noon:['오늘은 어떤 하루야?','나 아까부터 신났어!'],evening:['오늘은 어떤 하루였어?','저녁 공기 좋다!'],night:['음냐… 내일 또 놀자','쿨…']},
    shy:['우와, 이 방 넓다! 나 뛰어도 돼?','여기 진짜 있어도 되는 거지?'],
    mood:{good:['좋았구나! 나도 신나!','오, 나도 덩달아 좋아!'],soso:['그럴 때도 있지! 그래도 나는 여기 있어','보통인 날도 나쁘지 않아!'],hard:['힘들었구나. 오늘은 같이 뒹굴자','그런 날도 있는 거지!']},
    poke:['히히, 간지러워!','불렀어? 불렀지?','점프!'],
    ate:['냠! ','오, 맛있겠다! '],
    doing:{window:['창밖에 뭐가 지나갔어!','오늘 하늘 봤어?'],wander:['방 한 바퀴 더 돌아야지!','여기저기 볼 게 많아!'],nap:['잠깐만… 쿨…','눈 좀 붙일게!'],read:['이 책 끝까지 볼 거야!','여기 재밌는 부분이야!'],draw:['이것 봐, 내가 그렸어!','오늘은 크게 그릴 거야!'],plant:['물 줬더니 쑥쑥 크는 것 같아!','새 잎 나왔어!'],music:['이 노래 신난다!','같이 들을래?'],collect:['반짝이는 거 또 찾았어!','이거 내 보물이야!'],stretch:['쭉쭉! 몸이 가벼워!','하나 둘, 하나 둘!'],walk:['잠깐 나갔다 올게!']},
  },
  calm: {...POLITE,
    hello:{morning:['좋은 아침이에요','햇빛이 들어오고 있어요'],noon:['오늘은 어떤 하루예요?','조용해서 좋네요'],evening:['오늘은 어떤 하루였어요?','저녁이 천천히 오고 있어요'],night:['조금 졸려요…','내일 또 봐요']},
    shy:['여기… 있어도 괜찮을까요?','아직 조금 낯설어요. 천천히 익숙해질게요'],
    mood:{good:['좋은 하루였군요. 저도 기뻐요','그 말을 들으니 편안해져요'],soso:['그런 날이 대부분이죠','그럼 오늘은 편하게 있어요'],hard:['그랬군요. 오늘은 조용히 있어요','옆에 있을게요']},
    poke:['네, 여기 있어요','후후, 간지러워요','불렀어요?'],
    ate:['맛있겠어요. ','좋은 냄새가 나요. '],
    doing:{window:['구름이 천천히 가고 있어요','창밖을 보고 있었어요'],wander:['방을 조금 걸어봤어요','여기 자리가 좋아요'],nap:['잠깐 눈을 감고 있을게요','이불이 포근해요'],read:['이 문장이 마음에 들어요','한 장만 더 읽을게요'],draw:['오늘은 창문을 그려봤어요','선이 마음에 들어요'],plant:['잎이 조금 자란 것 같아요','물을 조금만 줬어요'],music:['이 곡이 편안해요','같이 들을래요?'],collect:['오늘 찾은 건 여기 둘게요','작은 걸 모으는 게 좋아요'],stretch:['천천히 몸을 풀고 있어요','숨을 길게 쉬어봤어요'],walk:['잠깐 산책하고 올게요']},
  },
  playful: {...CASUAL,
    hello:{morning:['깜짝이야! 아, 일어났구나?','아침부터 장난치고 싶다'],noon:['오늘은 어떤 하루야? 맞혀볼까?','나 방금 숨어 있었는데 못 봤지?'],evening:['오늘은 어떤 하루였어?','저녁이다, 뭐 하고 놀까'],night:['자는 척 중이야…','쉿, 나 자는 거야']},
    shy:['어? 여기 내 방 아니었어? 헤헤','나 원래 여기 살았는데? 농담이야'],
    mood:{good:['오호, 그럼 나도 춤춘다!','좋았어? 비결이 뭐야?'],soso:['보통? 그럼 내가 재밌게 해줄게','음, 무난한 맛이네!'],hard:['그럼 오늘은 내가 웃겨줄게','그런 날도 있는 거지! 이리 와']},
    poke:['앗, 들켰다!','한 번 더 해봐!','메롱!'],
    ate:['한 입만! ','앗, 나 몰래 먹었어? '],
    doing:{window:['저 새 나 보고 웃었어!','창문에 얼굴 찍어봤어'],wander:['여기 숨으면 못 찾겠지?','방 탐험 중이야!'],nap:['자는 척이야… 진짜로…','코 고는 연습 중'],read:['이 책 거꾸로 읽어도 재밌어','주인공 이름 내 걸로 바꿨어'],draw:['네 얼굴 그렸어. 안 보여줄 거야','이건 비밀 지도야'],plant:['화분한테 말 걸어봤어','이 잎 내 머리 같지 않아?'],music:['이 노래에 춤 만들었어!','따라 해봐!'],collect:['이건 내 보물 3호야','어? 나 방금 엄청난 걸 발견했어!'],stretch:['운동하는 척 중이야','이 자세 웃기지?'],walk:['나 찾아봐! 금방 올게']},
  },
  curious: {...POLITE,
    hello:{morning:['아침엔 왜 빛이 노란 걸까요?','오늘은 뭐가 달라졌을까요?'],noon:['오늘은 평소와 조금 달라요?','저건 뭐예요?'],evening:['오늘은 어떤 하루였어요?','해가 어디로 가는 걸까요?'],night:['별은 몇 개일까요… 쿨…','내일 물어볼게요…']},
    shy:['여기는 어떤 곳이에요?','저건 뭐예요? 저것도요?'],
    mood:{good:['어떤 게 좋았어요?','좋은 날은 어떤 느낌이에요?'],soso:['보통은 어떤 맛일까요?','그렇구나, 그런 날도 궁금해요'],hard:['그랬군요. 오늘은 제가 조용히 있을게요','그런 날도 있는 거죠']},
    poke:['어? 이건 무슨 뜻이에요?','한 번 더요?','간지러운 건 왜 그럴까요?'],
    ate:['그건 무슨 맛이에요? ','오, 처음 들어봐요. '],
    doing:{window:['저 구름은 어디로 가는 걸까요?','창밖에 새로운 게 있어요'],wander:['여기 틈에 뭐가 있어요','방을 조사하는 중이에요'],nap:['잠은 왜 올까요… 쿨…','잠깐만 눈 감을게요'],read:['이 단어는 무슨 뜻일까요?','다음 장이 궁금해요'],draw:['보이는 대로 그려봤어요','이 색은 뭐랑 섞은 걸까요?'],plant:['잎이 빛 쪽으로 움직였어요','물을 주면 어디로 갈까요?'],music:['이 소리는 뭐로 내는 걸까요?','같이 들어볼래요?'],collect:['이건 어디서 온 걸까요?','비슷한 것끼리 모아봤어요'],stretch:['몸이 여기까지 늘어나요','이 자세는 이름이 뭘까요?'],walk:['밖에 뭐가 있나 보고 올게요']},
  },
};
// 안 온 동안 한 일 (지난 일. 사용자의 부재는 언급하지 않는다)
const PAST = {
  casual:{window:'창밖을 구경했어',wander:'방 구석구석 돌아다녔어',read:'책을 읽었어',draw:'그림을 그렸어',plant:'화분에 물을 줬어',music:'음악을 들었어',collect:'반짝이는 걸 하나 찾았어',stretch:'방에서 몸을 쭉 폈어',walk:'산책 다녀왔어',nap:'낮잠을 잤어'},
  polite:{window:'창밖을 구경했어요',wander:'방을 천천히 걸어 다녔어요',read:'책을 읽었어요',draw:'그림을 그렸어요',plant:'화분에 물을 줬어요',music:'음악을 들었어요',collect:'작은 걸 하나 찾았어요',stretch:'몸을 천천히 풀었어요',walk:'산책 다녀왔어요',nap:'낮잠을 잤어요'},
};
const MOODS = [['good','좋았어'],['soso','보통'],['hard','힘들었어']];

// ── 방 그림 ───────────────────────────────
const BED = P('0 0 170 110','<rect x="4" y="14" width="26" height="86" rx="10" fill="#E8A86A"/><rect x="20" y="52" width="146" height="44" rx="10" fill="#FFF3D6"/><path d="M62 50 H156 a10 10 0 0 1 10 10 V88 a8 8 0 0 1 -8 8 H62Z" fill="#FF9EB8"/><path d="M62 50 V96" stroke-dasharray="4 5"/><rect x="28" y="36" width="36" height="24" rx="10" fill="#fff"/><path d="M28 96 V106 M158 96 V106" stroke-width="5"/>');
const DESK = P('0 0 140 120','<rect x="6" y="46" width="128" height="10" rx="3" fill="#E8A86A"/><path d="M16 56 V116 M124 56 V116" stroke-width="5"/><rect x="84" y="56" width="40" height="34" fill="#F4C78F"/><path d="M84 73 H124"/><circle cx="104" cy="65" r="1.5" fill="#1E1B18"/><circle cx="104" cy="82" r="1.5" fill="#1E1B18"/><rect x="20" y="30" width="16" height="16" rx="2" fill="#8EC9FF"/><path d="M24 30 L22 18 M30 30 L33 16"/><rect x="48" y="38" width="30" height="8" rx="1" fill="#FFD23F"/>');
const SKY = {morning:'#CFEBFF', noon:'#A9DBFF', evening:'#FFB98A', night:'#2B3566'};
const WINDOW_CLIP = ['<rect x="4" y="4" width="52" height="52" rx="8"/>','<circle cx="30" cy="30" r="26"/>','<path d="M6 56 V28 a24 24 0 0 1 48 0 V56Z"/>'];
const CLOUD = (x, y) => `<g fill="#fff" stroke="none"><ellipse cx="${x}" cy="${y}" rx="9" ry="5"/><ellipse cx="${x+7}" cy="${y-3}" rx="7" ry="5"/></g>`;
const WEATHER_ART = {
  clear:'',
  cloud:CLOUD(18,22)+CLOUD(36,38),
  rain:CLOUD(20,16)+CLOUD(38,14)+'<g stroke="#5D8FD0" stroke-width="2" class="fall"><path d="M14 28 l-2 7 M26 26 l-2 7 M38 28 l-2 7 M20 40 l-2 7 M32 42 l-2 7 M44 38 l-2 7"/></g>',
  snow:CLOUD(20,14)+'<g fill="#fff" stroke="none" class="fall"><circle cx="14" cy="28" r="2"/><circle cx="28" cy="24" r="2"/><circle cx="42" cy="30" r="2"/><circle cx="20" cy="42" r="2"/><circle cx="36" cy="44" r="2"/></g>',
};
const windowArt = (kind, time, weather) => {
  const body = WINDOW_CLIP[kind] ?? WINDOW_CLIP[0];
  const sun = time === 'night'
    ? '<circle cx="42" cy="16" r="6" fill="#FFF3C4" stroke="none"/><circle cx="14" cy="14" r="1.2" fill="#fff" stroke="none"/><circle cx="24" cy="24" r="1" fill="#fff" stroke="none"/>'
    : weather === 'clear' || weather === 'cloud' ? `<circle cx="${time==='evening'?46:16}" cy="${time==='evening'?42:16}" r="7" fill="#FFD23F" stroke="none"/>` : '';
  const id = 'w' + uid++;
  return P('0 0 60 60', `<clipPath id="${id}">${body}</clipPath><g clip-path="url(#${id})"><rect width="60" height="60" fill="${SKY[time]}" stroke="none"/>${sun}${WEATHER_ART[weather] ?? ''}</g><g fill="none">${body}</g><path d="M30 4 V56 M4 30 H56" clip-path="url(#${id})"/>`);
};
const HELD = {
  book:'<path d="M2 6 L14 9 L26 6 V22 L14 25 L2 22Z" fill="#8EC9FF"/><path d="M14 9 V25"/>',
  pencil:'<path d="M4 24 L8 15 L20 3 L25 8 L13 20Z" fill="#FFD23F"/><path d="M8 15 L13 20"/>',
  can:'<rect x="9" y="10" width="14" height="14" rx="3" fill="#86D9B9"/><path d="M9 14 L2 9 M23 13 q5 2 2 7"/>',
  music:'<path d="M9 22 V6 L23 3 V19"/><circle cx="6" cy="22" r="3.5" fill="#FF9EB8"/><circle cx="20" cy="19" r="3.5" fill="#FF9EB8"/>',
  star:'<path d="'+star(14,14,12)+'" fill="#FFD23F"/>',
};
const heldArt = id => id ? P('0 0 28 28', HELD[id]) : '';
const NOTE = P('0 0 44 38','<path d="M4 6 L38 3 L41 32 L7 35Z" fill="#FFF3C4"/><path d="M11 13 L33 11 M12 20 L34 18 M13 27 L26 26"/>');

// 기록 시트를 닫을 때 캐릭터의 한마디. 평가하지 않고 자기 이야기를 한다
const AFTER_RECORD = {
  active:  {low:'눈이 무거워. 오늘은 일찍 눕고 싶어', ok:'기지개 한 번 쭉!', good:'이불이 아직 따뜻해!', move:'나도 따라 해봤어! 하나 둘!'},
  calm:    {low:'눈꺼풀이 조금 무거워요. 오늘은 일찍 눕고 싶어요', ok:'기지개를 천천히 켜봤어요', good:'이불이 아직 포근해요', move:'저도 몸을 조금 풀어볼게요'},
  playful: {low:'하암… 나 지금 자는 거 아니다?', ok:'기지개 대결 할래?', good:'이불이랑 더 놀고 싶어!', move:'나도 운동하는 척 해볼게, 봐봐!'},
  curious: {low:'하품은 왜 옮을까요? 눈이 무거워요', ok:'기지개를 켜면 왜 시원할까요?', good:'이불은 왜 아침에 더 따뜻할까요?', move:'이 동작은 이렇게 하는 거예요?'},
};
