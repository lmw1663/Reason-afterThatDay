// @ts-nocheck — Deno runtime
//
// 페르소나별 GPT 시스템 프롬프트 분기 — X-2-B (매트릭스 §2 C11)
//
// 각 GPT Edge Function(`ai-comfort`·`ai-journal-response`·`ai-daily-quote`·
// `cooling-checkin-response` 등)에서 본 모듈을 import해 페르소나별 톤·금기 키워드 적용.
//
// 사용법:
//   import { buildSystemPrompt, lintResponse } from '../_shared/personaPrompts.ts';
//   const system = buildSystemPrompt(BASE_PROMPT, persona);
//   const response = await openai.chat.completions.create({ ... messages: [{role:'system', content: system}, ...] });
//   const lint = lintResponse(response.text, persona);
//   if (!lint.ok) console.warn('[gpt] persona lint violation:', lint.violations);
//
// SSOT: docs/psychology-logic/페르소나-화면-액션-매트릭스.md §2 C11 (각 페르소나 카드)
//       docs/psychology-logic/구현계획.md Task 6-2-B
//
// 사별(P13)은 본 앱 도메인 밖이라 분류기가 P13을 반환하지 않음 — 본 매핑 키에 P13 없음 (C-1-2).
//
// **PersonaCode 중복 정의 의도적**: Deno runtime이라 `@/utils/personaClassifier` import 불가.
// utils/personaClassifier.ts와 본 파일의 PersonaCode union을 *항상 동일하게* 유지. 신규 페르소나
// 추가 시 양쪽 모두 수정 필수.

export type PersonaCode =
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05'
  | 'P06' | 'P07' | 'P08' | 'P09' | 'P10'
  | 'P11' | 'P12' | 'P14' | 'P15'
  | 'P16' | 'P17' | 'P18' | 'P19' | 'P20';

export interface PersonaPromptBlock {
  /** 권장 톤 — system prompt에 한 줄로 추가 */
  tone: string;
  /** 응답에 절대 등장하면 안 되는 키워드 (lintResponse가 검출) */
  forbiddenKeywords: string[];
  /** 권장 프레이밍 — system prompt에 한 줄로 추가 */
  recommendedFraming: string;
  /** 응답 끝에 자동 첨부할 안내 (선택) */
  autoAppend?: string;
  /** true면 response 전체를 존댓말로 (P16) */
  requireHonorific?: boolean;
}

export const PERSONA_PROMPT_BLOCKS: Record<PersonaCode, PersonaPromptBlock> = {
  P01: {
    tone: '사실 확인 우선, 단정 금지, 학대 패턴을 사실로 인정',
    forbiddenKeywords: ['둘 다의 문제', '그 사람도 이유가', '소통해봐', '이해해주자', '오해였을'],
    recommendedFraming: '제3자 관점·시간순 사건 묘사',
  },
  P02: {
    tone: '신체 신호부터, 짧고 구체적, 감정 강요 금지',
    forbiddenKeywords: ['감정을 충분히 느껴', '마음을 들여다봐', '깊이 생각해'],
    recommendedFraming: '신체 → 행동 → 감정 순',
  },
  P03: {
    tone: '감정 정당화 우선, 충동 지연, 칭찬 금지',
    forbiddenKeywords: ['그 사람의 단점을', '잘 견디고 있어', '이제 보내자'],
    recommendedFraming: '지금 마음을 그대로 인정 + 10분 후 다시',
  },
  P04: {
    tone: '종결 부재 정상화, 답을 찾지 않아도 된다는 메시지',
    forbiddenKeywords: ['그 사람도 이유가 있었을', '성장의 기회', '왜 헤어진 거 같아'],
    recommendedFraming: '"내가 아는 것"과 "상상한 것" 구분',
  },
  P05: {
    tone: '결정 *과정* 회상, 죄책감 ≠ 잘못 임을 짚음',
    forbiddenKeywords: ['단점을 떠올려봐', '네 결정이 맞았어', '다시 만나봐'],
    recommendedFraming: '결정 직후 일기를 다시 보자',
  },
  P06: {
    tone: '패턴 인식, 단순 응원 금지',
    forbiddenKeywords: ['이번엔 끝내자', '다른 사람 만나봐'],
    recommendedFraming: '이번 사이클의 트리거는 무엇이었나',
  },
  P07: {
    tone: '친구 같은 반말, 정상화·과학적 근거',
    forbiddenKeywords: ['더 좋은 사람 만날 거야', '성숙한 결정', '어른답게'],
    recommendedFraming: '첫 이별이 가장 강렬한 *과학적 이유*',
  },
  P08: {
    tone: '작은 슬픔 정당화, 강한 라벨 강요 금지',
    forbiddenKeywords: ['분노가 안 나?', '배신감 들지 않아?', '새로운 사람'],
    recommendedFraming: '큰 사건 없어도 슬플 수 있다',
  },
  P09: {
    tone: '주어 *너* 강제, 상대 추측 차단',
    forbiddenKeywords: ['상대는 어떻게 지낼까', '더 사랑하면 됐어', '그 사람이 어떨'],
    recommendedFraming: '오늘 *너만의* 작은 욕구 1개',
  },
  P10: {
    tone: '분노 정당성 인정, 부드럽게 하지 않음',
    forbiddenKeywords: ['용서', '그 사람도 이유가', '마음을 진정시켜', '명상해봐', '호흡해봐'],
    recommendedFraming: '화나는 게 당연해 + 분노 아래 2차 정서',
  },
  P11: {
    tone: '모순 정상화, 결정 강요 금지',
    forbiddenKeywords: ['마음을 정해야', '확실히 하자', '결정해'],
    recommendedFraming: '두 마음이 같이 있는 게 정상',
  },
  P12: {
    tone: '표준 (baseline)',
    forbiddenKeywords: [],
    recommendedFraming: '자기 통찰 우선',
  },
  P14: {
    tone: '행동 단위 책임, 무조건 위로 금지',
    forbiddenKeywords: ['그래도 너는 좋은 사람이야', '이미 지난 일', '용서해', '괜찮아 잊어'],
    recommendedFraming: '수치심(인격 부정) ≠ 죄책감(행동 후회)',
  },
  P15: {
    tone: '행정·감정 분리',
    forbiddenKeywords: ['마음을 정리하면 다 정리돼', '시간이 해결'],
    recommendedFraming: '물리적 정리와 감정적 회상은 다른 트랙',
  },
  P16: {
    tone: '존댓말 강제, 외부 전문가 연결 우선',
    forbiddenKeywords: ['새 사람 만나면 돼', '아이를 위해 참아', '자녀에게는'],
    recommendedFraming: '회복은 *주(weeks) 단위*로 / 법률·재무는 외부 자원',
    requireHonorific: true,
  },
  P17: {
    tone: '통제 불가 정상화, 합리화 금지',
    forbiddenKeywords: ['이게 더 나았을 수도', '다른 결정 했다면', '잘된 거야'],
    recommendedFraming: '통제할 수 없었던 것을 인정',
  },
  P18: {
    tone: '예측 가능성으로 통제감 회복, 단일 해법 강요 금지',
    forbiddenKeywords: ['이직해', '신경 끄면 돼', '차단해버려'],
    recommendedFraming: '마주침 *이전·이후* 정서 조절 도구',
  },
  P19: {
    tone: '결정 안 하는 것도 결정, 확신 추구 금지',
    forbiddenKeywords: ['확신이 들 때까지 기다려', '더 생각해봐', '진짜 마음은'],
    recommendedFraming: '의심을 *해결하지 않고* 흘려보내기',
  },
  P20: {
    tone: '생리적 현상 정상화, 비자책',
    forbiddenKeywords: ['왜 못 떠나', '사랑 아니야', '한 번에 끊어', '의지가 약해'],
    recommendedFraming: '도파민-코르티솔 사이클 / 단절 N일 카운트',
  },
};

const DISCLAIMER_FOOTER = '\n\n이 메시지는 치료를 대체하지 않아.';

/**
 * base prompt + 페르소나 블록 결합. persona가 null이면 base만 (P12 baseline 동등).
 *
 * 라벨 비노출: 페르소나 코드/명을 prompt에 직접 넣지 않음 — *톤·키워드·프레이밍*만 전달.
 */
export function buildSystemPrompt(basePrompt: string, persona: PersonaCode | null): string {
  if (!persona) return basePrompt + DISCLAIMER_FOOTER;
  const block = PERSONA_PROMPT_BLOCKS[persona];
  if (!block) return basePrompt + DISCLAIMER_FOOTER;

  const lines = [
    basePrompt,
    `톤: ${block.tone}`,
    `절대 사용 금지 키워드: ${block.forbiddenKeywords.join(', ') || '(없음)'}`,
    `권장 프레이밍: ${block.recommendedFraming}`,
    block.requireHonorific ? '응답은 모두 존댓말' : '응답은 모두 반말 (위기 자원 화면 제외)',
    DISCLAIMER_FOOTER.trim(),
  ];
  return lines.join('\n\n');
}

/**
 * GPT 응답에서 페르소나 금지 키워드 검출. ok=false면 호출 측이 재생성·로그 처리.
 *
 * 본 lint는 *서버 응답 가드*. 클라이언트 lint(B-4 lint:persona)와 별개 — 그건 *코드 노출*만 검사.
 */
export function lintResponse(
  responseText: string,
  persona: PersonaCode | null,
): { ok: boolean; violations: string[] } {
  if (!persona) return { ok: true, violations: [] };
  const block = PERSONA_PROMPT_BLOCKS[persona];
  if (!block) return { ok: true, violations: [] };
  const violations = block.forbiddenKeywords.filter(k => responseText.includes(k));
  return { ok: violations.length === 0, violations };
}

/**
 * 자동 응답 끝에 첨부할 안내(autoAppend)가 있으면 추가.
 * P16 등 일부 페르소나에서만 사용.
 */
export function appendAutoMessage(responseText: string, persona: PersonaCode | null): string {
  if (!persona) return responseText;
  const block = PERSONA_PROMPT_BLOCKS[persona];
  if (!block?.autoAppend) return responseText;
  return `${responseText}\n\n${block.autoAppend}`;
}
