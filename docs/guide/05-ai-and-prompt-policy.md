# AI And Prompt Policy

## GPT 호출 정책
- 클라이언트 직접 호출 **절대 금지**
- Edge Function 프록시 경유만 허용
- 기본 모델: `gpt-4.1-mini`
- 졸업 편지만 `gpt-4o` (고품질 1회성)
- `OPENAI_API_KEY`는 Edge Function 환경변수에만

## Edge Function 11개

| 함수 | 모델 | 트리거 | 용도 |
|---|---|---|---|
| `ai-journal-response` | gpt-4.1-mini | 일기 4단계 완료 (비스트리밍 폴백) | 방향 기반 2~3문장 감정 응답 |
| `ai-journal-response-stream` | gpt-4.1-mini | 일기 4단계 완료 (기본) | SSE 스트리밍 일기 응답 |
| `ai-comfort` | gpt-4.1-mini | 분석/나침반 결과 화면 | 상황별 2~3문장 위로 |
| `ai-daily-quote` | gpt-4.1-mini | 홈 진입 (같은 날 캐시) | 1~2문장 일일 격려 |
| `ai-graduation-letter` | **gpt-4o** | 졸업 letter 화면 | 400~600자 1인칭 성장 편지 |
| `cooling-checkin-response` | gpt-4.1-mini | 유예 자율 체크인 | Day별(1~7) 1~2문장 단계별 응답 |
| `graduation-farewell-response` | gpt-4.1-mini | 졸업 farewell 화면 | 작별 80자 수용 + AI 응답 + DB 저장 |
| `persona-reclassify-cron` | — | pg_cron 매일 0시 | D+7/14/30/60/90 axes 갱신 |
| `push-cooling-day7` | — | pg_cron 매일 09:00 UTC | 유예 7일 종료자 최종 푸시 1회 |
| `push-daily-reminder` | — | pg_cron 매일 21:00 KST | 유예 미해당자 일기 독촉 |
| `account-delete` | — | 사용자 요청 | JWT 검증 후 service role로 완전 삭제 (CASCADE) |

## 프롬프트 기본 컨텍스트
모든 AI 호출에 자동으로 첨부:
- 사용자 이별 D+N
- 최근 3일 감정 온도 추이
- 최근 방향 변화 (catch / let_go / not_sure)
- **활성 페르소나 코드** — `supabase/functions/_shared/personaPrompts.ts`가 페르소나별 시스템 프롬프트(톤·금기·관점) 빌드
- 말투 원칙: 단정 금지 · 가능성 제시 · 비난 금지

## 처리정지권 게이트 (PIPA §37)

```
[클라이언트] api/ai.ts:isAiSuspended()
  ↓ getProcessingSuspension(userId).aiAnalysisSuspended === true
  → AI 호출 skip, fallback 응답 반환

[서버] supabase/functions/_shared/processingSuspension.ts
  ↓ 같은 검사 (dual gate, fail-open)
  → fallback 또는 차단
```

`ai_analysis_suspended` 토글이 켜진 사용자는 모든 AI 응답이 fallback 템플릿으로 떨어진다.

## 역할 분리
- 진단 / 나침반 verdict / 페르소나 분류의 **핵심 계산은 앱·서버 로직에서 결정론적으로** 처리
- GPT는 **감정 공감 / 문장화**에 집중 — 결정에 관여시키지 않음

## 실패 대응 (utils/retry.ts)
- 지수 백오프 3회 재시도 (timeout 짧으면 즉시 fallback)
- 실패 시 **반드시 템플릿 fallback** — 빈 응답 금지
- 일기 응답 fallback 예시:
  - catch: "이 마음, 천천히 들여다보자. 답을 정하지 않아도 돼."
  - let_go: "보내고 싶다는 마음도 진심이야. 비난하지 않을게."
  - not_sure: "모르겠는 게 자연스러워. 시간이 답을 줄 수도 있고."
- 사용자에겐 "지금은 연결이 어려워" + 재시도 버튼 노출

## 페르소나 라벨 비노출
- GPT 응답 본문에 페르소나 코드(P01~P20)나 진단명-유사 어휘 등장 시 **응답 검증 단계에서 차단**
- 검증은 `supabase/functions/_shared/personaPrompts.ts`의 후처리 검사
- 검증 실패 시 fallback 템플릿으로 대체
