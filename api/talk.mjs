// AI 대답 (Vercel 함수, ESM이라 .mjs). 단어 표가 못 알아들은 말만 여기로 옴 — chat.js 의 askAI
// GitHub Pages·파일로 열어도 이 주소를 부름 → 어느 주소든 동작. API 키는 Vercel 환경 변수(ANTHROPIC_API_KEY)에만
// 남용 막기: Supabase 로그인한 사람만(익명 포함), 한 사람 하루 AI_DAILY 번 (supabase-ai.sql 의 bump_ai_use)

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const SUPA_URL = "https://bkzmrhcpkloycggkrwhi.supabase.co";
const SUPA_KEY = "sb_publishable_QENJ13EFWMBHk1AC6xeR_w_CsnUlRKK";   // 공개 키 (cloud.js 와 같음)
const AI_DAILY = 40;
const MAX_TEXT = 120;
const MOVE_TYPES = ["걷기", "달리기", "근력", "자전거", "요가", "수영", "구기", "운동"];

const client = new Anthropic();   // ANTHROPIC_API_KEY

// 캐릭터의 대답 + 기록할 것. 없으면 null/빈 배열
const Answer = z.object({
  reply: z.string(),
  mood: z.enum(["good", "soso", "hard"]).nullable(),
  sleep_hours: z.number().nullable(),
  meals: z.array(z.object({ name: z.string() })),
  moves: z.array(z.object({ type: z.enum(MOVE_TYPES), min: z.number() })),
  skip: z.boolean(),
});

const ASK_TEXT = { mood: "지금 기분", sleep: "어젯밤 잠", meal: "식사", move: "오늘 운동" };

// 말투 예시 (짧게, 물음표 없이, 자기를 이름으로 안 부름)
const EXAMPLES = {
  casual:'예) 사용자: 오늘 시험 망쳤어 → 대답: 아이고, 많이 속상했겠다. 오늘은 나랑 좀 쉬자.\n예) 사용자: 떡볶이 먹었어 → 대답: 떡볶이 좋지! 나도 한 입 먹고 싶다.',
  polite:'예) 사용자: 오늘 시험 망쳤어 → 대답: 많이 속상했겠어요. 오늘은 저랑 천천히 쉬어요.\n예) 사용자: 떡볶이 먹었어 → 대답: 떡볶이 맛있었겠어요. 저도 한 입 먹고 싶어요.',
};
// 끝 문장이 질문이면 잘라냄 (대답 뒤에 앱이 다음 질문을 하므로). 한 문장은 남김
function noQuestion(text){
  const parts = text.trim().split(/(?<=[.!?~…])\s+/);
  while (parts.length > 1 && /(\?|나요|까요|니|어\?)$/.test(parts.at(-1).replace(/[.!~…\s]+$/, ''))) parts.pop();
  return parts.join(' ').replace(/\?+$/, '.');
}

function systemPrompt({ name, personality, register, ask }){
  return `[말투] ${register === "casual" ? "반말만 쓴다." : "존댓말(해요체)만 쓴다. 반말 금지."}

너는 기록 앱 「하루」의 작은 방에 사는 캐릭터 「${name}」이다. 성격: ${personality}.
${register === "casual" ? "친구처럼 반말로 말한다." : "친구처럼 편한 해요체로 말한다. 사용자에게 '-시-' 높임(드셨어요, 가셨어요)은 쓰지 않는다 (먹었어요, 갔어요)."}
자기를 이름이나 3인칭으로 부르지 않는다 (「콩이가」 X, 「저는/나는」 O). 사용자를 「사용자님」「당신」이라 부르지 않는다 (부를 필요가 있으면 생략).
사용자가 한 줄을 말하면, 캐릭터로서 짧게 대답하고 기록할 것이 있으면 뽑는다.

대답(reply) 규칙:
- 한두 문장, 40자 안팎. 물음표(?)를 쓰지 않는다 — 대답 뒤에 앱이 다음 질문을 따로 하므로 질문이 겹친다.
- 사용자의 말을 먼저 받아 준다. 평가하지 않는다 (잘했다/못했다, 좋은 날/나쁜 날 X). 건강 조언·숫자 X.
- 캐릭터가 화면에 없는 일을 했다고 지어내지 않는다.
- 위험하거나 힘든 이야기(자해 등)에는 다정하게 받아 주고, 믿을 수 있는 사람이나 전문 상담에 이야기해 보라고 한 문장만 덧붙인다.

기록 규칙 (확실할 때만, 아니면 null/빈 배열):
- mood: 지금 기분이 드러나면 good/soso/hard.
- sleep_hours: 잔 시간이 드러나면 숫자.
- meals: 먹은 음식 이름 (먹었다고 한 것만, 먹고 싶다는 X).
- moves: 한 운동. type 은 ${MOVE_TYPES.join("·")} 중 하나, min 은 분 (모르면 30).
- skip: 지금 물어본 것(${ask ? ASK_TEXT[ask] : "없음"})에 「안 했다/모르겠다/말하기 싫다」처럼 답했으면 true.
${ask ? `지금 앱이 물어본 것: ${ASK_TEXT[ask]}.` : ""}

${EXAMPLES[register]}`;
}

const ALLOWED = [/^https:\/\/(my-haru2|haru2)\.vercel\.app$/, /^https:\/\/y0useunghyun\.github\.io$/, /^null$/];   // null = 파일로 열었을 때
function cors(req, res){
  const origin = req.headers.origin ?? "";
  if (ALLOWED.some(re => re.test(origin))) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

// Supabase 토큰 확인 + 오늘 사용 횟수 1 올리기. 실패하면 null
async function useOnce(token){
  const user = await fetch(`${SUPA_URL}/auth/v1/user`, { headers:{ apikey:SUPA_KEY, Authorization:`Bearer ${token}` } });
  if (!user.ok) return null;
  const bump = await fetch(`${SUPA_URL}/rest/v1/rpc/bump_ai_use`, {
    method:"POST", headers:{ apikey:SUPA_KEY, Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:"{}",
  });
  if (!bump.ok) return null;
  return Number(await bump.json());
}

export default async function handler(req, res){
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error:"POST only" });

  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/, "");
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
  const text = String(body.text ?? "").trim().slice(0, MAX_TEXT);
  if (!token || !text) return res.status(400).json({ error:"text and login required" });

  try {
    const count = await useOnce(token);
    if (count == null) return res.status(401).json({ error:"login" });
    if (count > AI_DAILY) return res.status(429).json({ error:"daily limit" });

    const ctx = {
      name:String(body.name ?? "하루").slice(0, 12),
      personality:String(body.personality ?? "차분함").slice(0, 10),
      register:body.register === "casual" ? "casual" : "polite",
      ask:ASK_TEXT[body.ask] ? body.ask : null,
    };
    const recent = (Array.isArray(body.recent) ? body.recent : []).slice(-4)
      .map(m => `${m.me ? "사용자" : ctx.name}: ${String(m.t ?? "").slice(0, 80)}`).join("\n");

    const response = await client.messages.parse({
      model:"claude-haiku-5-5",
      max_tokens:1024,
      output_config:{ effort:"low", format:zodOutputFormat(Answer) },
      system:systemPrompt(ctx),
      messages:[{ role:"user", content:`${recent ? `최근 대화:\n${recent}\n\n` : ""}사용자가 방금 한 말: ${text}\n(${ctx.register === "casual" ? "반말" : "해요체"}로, 물음표 없이)` }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return res.status(200).json({ fallback:true });
    const usage = { input:response.usage.input_tokens, output:response.usage.output_tokens };   // 요금 확인용
    return res.status(200).json({ ...response.parsed_output, reply:noQuestion(response.parsed_output.reply), usage });
  } catch (err){
    console.error("AI 대답 실패", err);
    return res.status(200).json({ fallback:true });   // 앱은 단어 표 대답으로
  }
}
