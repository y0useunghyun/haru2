// 마을·공원 그림. 방과 같은 톤: 굵은 검은 선 + 파스텔. 장면은 비율 고정이라 캐릭터 자리(%)가 그림과 맞는다.
// 건물은 <g data-place> 로 눌러서 들어간다 (town.js).

const INK2 = '#1E1B18';
const ART = {   // 계절별 색
  spring:{far:'#D7F0C2', grass:'#BFE6A8', leaf:'#FFC4D6', dot:'#FFFFFF', ground:'#F6E7CB', bush:'#9ED68A'},
  summer:{far:'#A8E3C8', grass:'#8FDDB8', leaf:'#5FC79F', dot:'#86D9B9', ground:'#F2DDB0', bush:'#5FC79F'},
  autumn:{far:'#F1D59E', grass:'#E3CF8E', leaf:'#F2945C', dot:'#FFD23F', ground:'#EED2A4', bush:'#D9A75A'},
  winter:{far:'#EEF2F7', grass:'#F4F7FB', leaf:'#FFFFFF', dot:'#FFFFFF', ground:'#E9EDF2', bush:'#DDE5EE'},
};
const svgArt = (vb, body, label) => `<svg class="art-svg" viewBox="${vb}" fill="none" stroke="${INK2}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" role="group" aria-label="${label}">${body}</svg>`;
const blob = (circles, fill) => outlineFill(circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join(''), fill);   // 겹친 원을 한 덩어리로

function skyArt(w, h, time, season){
  const sun = time === 'night'
    ? `<circle cx="${w - 64}" cy="46" r="14" fill="#FFF3C4"/><circle cx="${w - 58}" cy="42" r="12" fill="${SKY.night}" stroke="none"/>` + [[40, 30], [96, 60], [170, 26], [230, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" stroke="none"/>`).join('')
    : `<circle cx="${time === 'morning' ? 54 : time === 'evening' ? w - 50 : w / 2 + 60}" cy="${time === 'evening' ? 96 : 44}" r="15" fill="${time === 'evening' ? '#FFB45C' : '#FFD23F'}"/>`;
  const cloud = (x, y, k) => `<g fill="#fff" stroke="none" opacity=".95"><ellipse cx="${x}" cy="${y}" rx="${18 * k}" ry="${9 * k}"/><ellipse cx="${x + 14 * k}" cy="${y - 5 * k}" rx="${13 * k}" ry="${10 * k}"/><ellipse cx="${x - 12 * k}" cy="${y + 1}" rx="${10 * k}" ry="${7 * k}"/></g>`;
  const snow = season === 'winter' ? Array.from({length:14}, (_, i) => `<circle cx="${(i * 53) % w}" cy="${(i * 37) % (h * .55)}" r="2" fill="#fff" stroke="none"/>`).join('') : '';
  return `<rect width="${w}" height="${h}" fill="${SKY[time]}" stroke="none"/>${sun}${time === 'night' ? '' : cloud(w * .2, 52, 1) + cloud(w * .62, 78, .8)}${snow}`;
}

// 나무: 계절마다 잎 모양이 다르다. 겨울은 빈 가지에 눈
function treeArt(cx, base, k, season){
  const a = ART[season], top = base - 46 * k;
  const trunk = `<path d="M${cx - 5 * k} ${base} L${cx - 3.5 * k} ${top} H${cx + 3.5 * k} L${cx + 5 * k} ${base}Z" fill="#B07A4F"/>`;
  if (season === 'winter'){
    const br = [[0, -2, -16, -24], [0, -10, 14, -30], [0, 6, 18, -6], [0, 4, -18, -6]];
    return trunk + br.map(([x0, y0, x1, y1]) => `<path d="M${cx + x0 * k} ${top + y0 * k + 10 * k} L${cx + x1 * k} ${top + y1 * k}" stroke-width="${2.2 * k}"/>`).join('')
      + br.map(([, , x1, y1]) => `<ellipse cx="${cx + x1 * k}" cy="${top + y1 * k - 1.5 * k}" rx="${4 * k}" ry="${2.2 * k}" fill="#fff" stroke-width="1.5"/>`).join('');
  }
  const crown = blob([[cx, top - 16 * k, 20 * k], [cx - 17 * k, top - 2 * k, 14 * k], [cx + 17 * k, top - 2 * k, 14 * k], [cx, top + 4 * k, 14 * k]], a.leaf);
  const dots = [[-8, -22], [9, -12], [-16, 2], [14, 4], [2, -2], [-4, -10]].map(([x, y]) => `<circle cx="${cx + x * k}" cy="${top + y * k}" r="${2.2 * k}" fill="${a.dot}" stroke="none"/>`).join('');
  return trunk + crown + dots;
}

// ── 마을 거리 (390×320) ──
const TOWN_W = 390, TOWN_H = 320;
function shopArt(season){
  const snow = season === 'winter' ? '<path d="M14 120 Q20 112 30 114 L40 96 H124 L136 112 Q146 112 150 120 Q140 116 132 120 Q120 114 108 120 Q96 114 84 120 Q72 114 60 120 Q48 114 36 120 Q24 115 14 120Z" fill="#fff"/>' : '';
  const scallop = Array.from({length:8}, (_, i) => `a8.5 8.5 0 0 0 17 0`).join(' ');
  return `<g data-place="shop" role="button" tabindex="0" aria-label="가게">
    <rect x="18" y="118" width="128" height="118" fill="#FFE8C7"/>
    <path d="M8 122 L28 92 H136 L156 122Z" fill="#E8835F"/>${snow}
    <rect x="46" y="98" width="72" height="18" rx="5" fill="#fff"/><text x="82" y="111.5" class="art-label">가게</text>
    <path d="M12 136 H152 V150 H12Z" fill="#FF9EB8"/>
    ${[29, 63, 97, 131].map(x => `<rect x="${x}" y="136" width="17" height="14" fill="#fff" stroke="none"/>`).join('')}
    <path d="M12 136 H152 V150 H12Z"/>
    <path d="M12 150 ${scallop}" fill="#FF9EB8"/>
    <rect x="28" y="170" width="60" height="46" rx="4" fill="#BFE3FF"/>
    <path d="M32 204 H84" stroke-width="2"/>
    <path d="M38 204 V194 H48 V204 M58 204 C58 192 70 192 70 204" fill="#FFD23F" stroke-width="2"/>
    <rect x="74" y="196" width="8" height="8" rx="2" fill="#FF9EB8" stroke-width="2"/>
    <path d="M36 176 L46 186 M48 176 L54 182" stroke="#fff" stroke-width="3"/>
    <rect x="100" y="166" width="36" height="70" rx="4" fill="#8EC9FF"/><rect x="106" y="174" width="24" height="22" rx="3" fill="#E3F4FF"/><circle cx="128" cy="206" r="2.5" fill="${INK2}"/>
    <path d="M148 222 C140 214 139 206 142 200 C148 205 149 213 148 222Z M148 222 C156 214 158 206 155 199 C149 205 147 213 148 222Z" fill="#5FC79F" stroke-width="2"/><path d="M140 236 L142 222 H154 L156 236Z" fill="#E8835F"/>
  </g>`;
}
function boardArt(season){
  return `<g data-place="board" role="button" tabindex="0" aria-label="게시판">
    <path d="M182 196 V236 M232 196 V236" stroke-width="6"/><path d="M182 196 V236 M232 196 V236" stroke="#B07A4F" stroke-width="2.5"/>
    <path d="M162 134 L207 112 L252 134Z" fill="#E8835F"/>${season === 'winter' ? '<path d="M166 132 L207 114 L248 132 Q236 128 224 132 Q212 127 200 132 Q188 127 176 132Z" fill="#fff"/>' : ''}
    <rect x="166" y="132" width="82" height="68" rx="5" fill="#E8A86A"/><rect x="173" y="139" width="68" height="54" rx="2" fill="#F7D8A8"/>
    <rect x="178" y="146" width="24" height="18" fill="#fff" transform="rotate(-5 190 155)"/><rect x="208" y="144" width="26" height="15" fill="#FFD23F" transform="rotate(4 221 151)"/>
    <rect x="184" y="168" width="30" height="19" fill="#86D9B9" transform="rotate(3 199 177)"/><path d="M220 168 H236 V186 H220Z" fill="#FFB3C7"/>
    ${[[190, 147], [221, 145], [199, 169], [228, 169]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#E8835F" stroke-width="1.5"/>`).join('')}
    <rect x="183" y="118" width="48" height="16" rx="5" fill="#fff"/><text x="207" y="130" class="art-label art-label--s">게시판</text>
  </g>`;
}
function parkGateArt(season){
  const a = ART[season];
  return `<g data-place="park" role="button" tabindex="0" aria-label="공원">
    ${treeArt(296, 210, 1.15, season)}${treeArt(356, 214, 1, season)}
    <path d="M258 236 V214 Q258 204 268 204 H380 Q390 204 390 214 V236Z" fill="${a.bush}"/>
    <rect x="270" y="160" width="13" height="76" fill="#FFF3D6"/><rect x="357" y="160" width="13" height="76" fill="#FFF3D6"/>
    <path d="M264 166 Q320 118 376 166" stroke-width="13"/><path d="M264 166 Q320 118 376 166" stroke="#86D9B9" stroke-width="7.5"/>
    <rect x="296" y="128" width="48" height="19" rx="5" fill="#fff"/><text x="320" y="141.5" class="art-label">공원</text>
  </g>`;
}
function townSvg(season, time){
  const a = ART[season];
  const lit = time === 'night' || time === 'evening';
  const leaves = {spring:['#FFB3C7', 'ellipse'], autumn:['#E8835F', 'leaf'], winter:['#fff', 'ellipse'], summer:null}[season];
  const litter = leaves ? [[30, 262], [92, 276], [150, 258], [214, 282], [276, 266], [340, 280], [372, 258]].map(([x, y], i) => leaves[1] === 'leaf'
    ? `<path d="M${x} ${y - 4} L${x + 3} ${y} L${x} ${y + 4} L${x - 3} ${y}Z" fill="${i % 2 ? '#FFD23F' : leaves[0]}" stroke="none" transform="rotate(${i * 40} ${x} ${y})"/>`
    : `<ellipse cx="${x}" cy="${y}" rx="${season === 'winter' ? 9 : 3}" ry="${season === 'winter' ? 3 : 2}" fill="${leaves[0]}" stroke="none"/>`).join('') : '';
  return svgArt(`0 0 ${TOWN_W} ${TOWN_H}`, `${skyArt(TOWN_W, TOWN_H, time, season)}
    <path d="M-4 200 Q60 160 130 184 T260 176 T394 180 V240 H-4Z" fill="${a.far}"/>
    ${parkGateArt(season)}${shopArt(season)}${boardArt(season)}
    <rect x="-4" y="236" width="${TOWN_W + 8}" height="56" fill="${a.ground}"/>
    ${Array.from({length:14}, (_, i) => `<path d="M${i * 30 + 10} 238 L${i * 30} 290" stroke="rgba(30,27,24,.12)" stroke-width="2"/>`).join('')}
    <rect x="-4" y="290" width="${TOWN_W + 8}" height="34" fill="#D9CFC2"/>
    <path d="M10 306 H${TOWN_W}" stroke="#fff" stroke-width="3" stroke-dasharray="18 14"/>
    ${litter}
    <path d="M160 238 V160" stroke-width="5"/><path d="M148 160 H172 L168 144 H152Z" fill="${lit ? '#FFE27A' : '#FFD23F'}"/><path d="M156 144 H164 V139 H156Z" fill="${INK2}"/>
    ${lit ? '<circle cx="160" cy="156" r="22" fill="#FFE27A" opacity=".35" stroke="none"/>' : ''}`, '마을 거리');
}

// ── 공원 (360×440) ──
const PARK_W = 360, PARK_H = 440;
function parkSvg(season, time){
  const a = ART[season], winter = season === 'winter';
  const far = Array.from({length:10}, (_, i) => [i * 40 + 8, 188 - (i % 3) * 6, 24 + (i % 2) * 6]);
  const flowers = season === 'spring' || season === 'summer'
    ? [[34, 402], [58, 424], [96, 434], [20, 430], [318, 432], [338, 418]].map(([x, y], i) => `<g stroke-width="1.5">${[0, 72, 144, 216, 288].map(r => `<circle cx="${x + 4 * Math.cos(r * Math.PI / 180)}" cy="${y + 4 * Math.sin(r * Math.PI / 180)}" r="3.2" fill="${['#FF9EB8', '#FFD23F', '#fff'][i % 3]}"/>`).join('')}<circle cx="${x}" cy="${y}" r="2" fill="#E8835F"/></g>`).join('') : '';
  const scatter = season === 'autumn'
    ? [[40, 340], [120, 296], [180, 420], [230, 250], [300, 236], [26, 260], [150, 350], [330, 300]].map(([x, y], i) => `<path d="M${x} ${y - 5} L${x + 4} ${y} L${x} ${y + 5} L${x - 4} ${y}Z" fill="${['#E8835F', '#FFD23F', '#F2945C'][i % 3]}" stroke="none" transform="rotate(${i * 50} ${x} ${y})"/>`).join('')
    : season === 'spring' ? [[40, 330], [130, 300], [190, 410], [240, 240], [26, 250], [160, 360], [320, 290]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2.2" fill="#FFB3C7" stroke="none"/>`).join('')
    : winter ? [[50, 330, 26], [150, 420, 30], [320, 300, 22], [240, 236, 18]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r / 3}" fill="#fff" stroke="none"/>`).join('') : '';
  const pond = winter
    ? '<ellipse cx="282" cy="384" rx="70" ry="27" fill="#E3F1FF"/><path d="M246 380 L264 388 L282 380 M296 392 L312 384" stroke="#fff" stroke-width="2.5"/>'
    : `<ellipse cx="282" cy="384" rx="70" ry="27" fill="#BFE3FF"/><path d="M252 380 q8 -5 16 0 M290 392 q8 -5 16 0" stroke="#fff"/>
       <path d="M304 372 a8 5 0 1 0 6 6 L304 376Z" fill="#5FC79F" stroke-width="2"/><path d="M256 392 a7 4 0 1 0 5 5 L256 395Z" fill="#5FC79F" stroke-width="2"/>
       <path d="M214 386 V362 M220 388 V356 M226 386 V366" stroke-width="2.5"/><ellipse cx="220" cy="354" rx="2.5" ry="6" fill="#B07A4F" stroke-width="1.5"/>`;
  const snowman = winter ? `<circle cx="52" cy="414" r="17" fill="#fff"/><circle cx="52" cy="386" r="12" fill="#fff"/><circle cx="48" cy="383" r="1.6" fill="${INK2}"/><circle cx="56" cy="383" r="1.6" fill="${INK2}"/><path d="M52 388 L62 390 L52 391Z" fill="#E8835F" stroke-width="1.5"/>` : '';
  return svgArt(`0 0 ${PARK_W} ${PARK_H}`, `${skyArt(PARK_W, PARK_H, time, season)}
    ${blob(far.map(([x, y, r]) => [x, y, r]), a.bush)}
    <rect x="-4" y="196" width="${PARK_W + 8}" height="${PARK_H - 192}" fill="${a.grass}"/>
    <path d="M-4 196 H${PARK_W + 4}"/>
    ${[[60, 250, 70], [250, 330, 90], [120, 410, 80]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r / 5}" fill="#fff" opacity=".18" stroke="none"/>`).join('')}
    <path d="M86 444 C108 360 196 332 226 262 C246 216 300 204 364 200 V220 C312 224 276 236 262 272 C234 344 156 372 152 444Z" fill="${a.ground}"/>
    ${scatter}${pond}
    ${treeArt(312, 222, .9, season)}
    ${treeArt(74, 300, 2.1, season)}
    <path d="M150 300 V212" stroke-width="5"/><path d="M138 212 H162 L157 196 H143Z" fill="#FFD23F"/><path d="M146 196 H154 V190 H146Z" fill="${INK2}"/>
    <g>
      <path d="M212 322 V344 M296 322 V344" stroke-width="5"/>
      <path d="M214 312 V282 M294 312 V282" stroke-width="4"/>
      <rect x="204" y="278" width="100" height="11" rx="4" fill="#E8A86A"/><rect x="204" y="293" width="100" height="11" rx="4" fill="#E8A86A"/>
      <rect x="196" y="310" width="116" height="13" rx="5" fill="#C98B5A"/>
      ${winter ? '<path d="M200 310 Q230 302 256 309 Q282 302 308 310Z" fill="#fff" stroke-width="1.5"/>' : ''}
    </g>
    ${flowers}${snowman}`, '공원');
}
