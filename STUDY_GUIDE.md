# Reason · 신규 개발자 학습 가이드

> 이 앱을 처음 접한 사람이 **어디부터 어떻게 봐야 하는지**를 한 번에 정리한 문서.
> 이 가이드 하나만 읽고도 학습 경로·앱 동작 방식·절대 지켜야 할 규칙이 잡히도록 만들었다.
> 작성 기준일 2026-05-06 / 함께 보면 좋은 문서: [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md), [`CLAUDE.md`](./CLAUDE.md)

---

## 0. 30초 요약

**Reason**은 이별을 겪은 사람이 **재결합·헤어짐 결정을 충동이 아닌 데이터로 내리고**, 결정 후의 회복까지 동행하는 React Native + Supabase 앱이다.

핵심 자산 4가지:
1. **D+N (이별 경과일)** — 모든 화면·정책·프롬프트의 시간 축.
2. **20개 페르소나 (P01~P20)** — 사용자 유형별로 화면·질문·톤이 분기.
3. **3트랙 결정 지원** — 일기(감정 추적) / 관계 분석(이별 이유) / 나침반(잡기 vs 보내기 판정).
4. **졸업 + 7일 유예** — 결정 확정을 강제로 지연시켜 후회 방지.

**기술 한 줄 요약:** Expo Router + Zustand + Supabase(Auth/Postgres/Edge Functions) + GPT는 Edge Function 프록시로만.

---

## 1. 사용자 플로우 (시나리오로 이해하기)

> 30대 여성 A씨가 6년 사귄 연인과 한 달 전 헤어졌다. 친구 추천으로 앱을 켠다.

```
┌──────────────────────────────────────────────────────────────────┐
│ Day 0  ─ 첫 진입                                                 │
│   → /onboarding/login (카카오·Apple·Google OAuth, 익명도 가능)  │
│   → /onboarding/consent (필수 약관 3개 + 위기 자원 안내)        │
│   → /onboarding/duration (관계 기간 6년 → over_5y)              │
│   → /onboarding/mood (현재 기분 12종 라벨 중 선택)              │
│   → /onboarding/persona (Q1~Q6 + C-SSRS 3문항 → 페르소나 분류) │
│   → /onboarding/persona/intro (페르소나 사전 안내 카드 1회)     │
│   ↓                                                              │
│ HOME (D+30 표시) ───────────────────────────────────────────────│
│                                                                  │
│ Day 30~37 · 일기 루틴 (매일)                                     │
│   /journal/index    → 감정 온도 1~10 + 라벨 + 신체 신호         │
│   /journal/direction → 잡고 / 보내고 / 모르겠어 + 애정 수준    │
│   /journal/question  → 페르소나·방향 변화 기반 스마트 질문      │
│   /journal/response  → GPT 스트리밍 응답 (위로 + 통찰)          │
│                       ↑ 위기 신호 감지 시 EmotionalCheckModal   │
│                                                                  │
│ Day 37+ · 결정 트랙 게이트 해제 (페르소나별 D+N 다름)            │
│   /analysis/* (5단계) ─ 이별 이유·장단점·역할·점수·진단         │
│   /compass/*  (5단계) ─ 방향·체크·시나리오·verdict·행동제안    │
│                                                                  │
│ Day 60+ · A씨가 "이 사람 보내자" 결심 → 졸업 신청                │
│   /graduation/report   → 회복 리포트                            │
│   /graduation/letter   → AI 편지 (400~600자)                    │
│   /graduation/confirm  → 준비 상태 확인                          │
│   /graduation/farewell → 마지막 한 줄 작성                      │
│   /graduation/ritual   → 기억 보관 방식 선택                    │
│   /graduation/request  → 7일 유예 신청                          │
│                                                                  │
│ Day 60~67 · 유예 기간 ─ A씨가 흔들리지 않게 하는 7일             │
│   /cooling/index      → 매일 Day별 콘텐츠·타이머·체크인        │
│   Day 1~6: 일반 알림·AI 분석 전면 중지                          │
│   Day 5/6: 학습·미래 계획 reflection                            │
│   Day 7:   푸시 1회 + 최종 확정 OR 취소                          │
│                                                                  │
│ Day 67+ · 졸업 후                                                │
│   /recovery-trace  → D+0 vs 지금 메타포 비교                    │
│   /memory/*        → 추억 능동 정리 (놓아주기·계속 유대)        │
└──────────────────────────────────────────────────────────────────┘
```

**핵심 분기:**
- 위기 감지 (3일 연속 mood ≤2점 OR 새벽 0~4시 진입) → `EmotionalCheckModal` → C-SSRS 양성이면 결정 트랙 잠금.
- 페르소나에 따라 D+N 게이트가 다르다 (예: 헌신 소진형 P09는 D+14, 회피형은 D+7).
- 졸업 7일 유예는 **취소 가능, 재신청 가능**. 한 번에 끝나지 않는다.

---

## 2. 동작 원리 개요 (어떻게 굴러가는가)

### 2-1. 아키텍처 한 그림

```
┌───────────────────────── 클라이언트 (Expo / React Native) ─────────────────────────┐
│                                                                                    │
│   app/ (Expo Router 화면)                                                          │
│      └─ 화면이 hooks/, store/, api/ 만 호출. GPT 직접 호출 절대 금지.             │
│                                                                                    │
│   hooks/  ─ useAuth, useStreamingAI, useEmotionalSafety, useSmartQuestion ...     │
│   store/  ─ Zustand 7개 (User·Journal·Question·Relationship·Decision·Cooling·    │
│              Persona)                                                              │
│   utils/  ─ personaClassifier, scoring(PHQ/GAD/RSE), referralEvaluator ...        │
│   api/    ─ Supabase 클라이언트 호출만. AI 호출은 ai.ts → Edge Function 프록시.  │
│                                                                                    │
└───────────────────────────────────────┬────────────────────────────────────────────┘
                                        │ HTTPS (Supabase JS SDK)
                                        ▼
┌─────────────────────── 서버 (Supabase) ────────────────────────────────────────────┐
│                                                                                    │
│   Auth          ─ 익명/OAuth(Google·Apple·Kakao). 익명도 데이터 영구 보존.        │
│   Postgres      ─ 30+ 테이블 모두 RLS (user_id 기준). migrations/001~031.         │
│   Edge Functions(Deno) ─ ai-journal-response-stream, ai-comfort, ai-graduation-  │
│                          letter, cooling-checkin-response, push-* (cron) ...      │
│   Storage       ─ 현재 미사용                                                      │
│                                                                                    │
└──────────────────────────┬─────────────────────────────────────────────────────────┘
                           │ HTTPS (Edge Function only)
                           ▼
                       OpenAI GPT (gpt-4.1-mini · 졸업 편지만 gpt-4o)
                       ※ OPENAI_API_KEY는 Edge Function 환경변수에만
```

### 2-2. 일기 1건이 흘러가는 실제 경로 (E2E 트레이스)

이 흐름을 머릿속에 그려두면 90%의 화면을 같은 패턴으로 추론할 수 있다.

```
사용자가 [일기 시작] 탭
  ↓
app/journal/index.tsx
  ├─ MoodSlider · Pill(라벨) · Pill(신체 신호) 입력
  └─ router.push('/journal/direction')
  ↓
app/journal/direction.tsx
  ├─ DirectionPicker(잡고/보내고/모르겠어) + 애정 슬라이더
  └─ useJournalStore에 임시 저장 (초안)
  ↓
app/journal/question.tsx
  ├─ useSmartQuestion() 호출
  │    ├─ usePersonaStore에서 현재 페르소나 코드 읽음
  │    ├─ constants/personaQuestionWeights.ts → 차단/부스터 적용
  │    ├─ utils/moodAnalysis.ts → 최근 추이로 후속 질문 정함
  │    └─ 방향 변화 감지 시 우선 질문 강제
  └─ 답변 입력 → router.push('/journal/response')
  ↓
app/journal/response.tsx
  ├─ useStreamingAI() 호출
  │    └─ api/ai.ts → supabase.functions.invoke('ai-journal-response-stream')
  │         ├─ JWT 검증
  │         ├─ supabase/functions/_shared/processingSuspension.ts → AI 일시정지 게이트
  │         ├─ supabase/functions/_shared/personaPrompts.ts → 페르소나별 시스템 프롬프트
  │         ├─ OpenAI 스트리밍 호출 (SSE)
  │         └─ 한 글자씩 클라로 흘림
  ├─ 화면에 한 글자씩 나타남
  └─ 사용자 [저장] → api/journal.ts upsertJournalEntry()
       ├─ supabase.from('journal_entries').upsert(...)
       ├─ RLS가 user_id 일치 강제
       └─ utils/dateUtils.ts → KST 자정 기준 (오늘 1건만 허용)
  ↓
저장 후 useJournalStore.fetchToday() 갱신 → HOME 통계도 자동 갱신
```

**여기서 익혀야 할 패턴 5가지:**
1. 화면(app/) → hooks → api → Supabase. 절대 화면이 직접 OpenAI를 부르지 않는다.
2. RLS는 클라이언트 책임이 아니다. 서버에서 user_id를 강제하므로 클라가 거짓말해도 안전하다.
3. 페르소나는 화면 곳곳에서 분기를 만든다 — 새 화면 만들 때 항상 "이 화면이 페르소나에 따라 다르게 보여야 하나?"를 자문.
4. 모든 시간 계산은 KST 또는 사용자 로컬 자정 기준 (`utils/dateUtils.ts`).
5. AI 응답은 **반드시 fallback** — 타임아웃·실패 시 템플릿 응답 (`utils/retry.ts`).

---

## 3. 도메인 용어집 (몰라도 코드는 보이지만, 알면 의미가 보인다)

| 용어 | 뜻 | 어디 코드에서 보이나 |
|---|---|---|
| **D+N** | 이별 경과일 (오늘 - breakup_date) | `utils/dateUtils.ts:dPlusN` · 모든 화면 헤더 |
| **페르소나 P01~P20** | 사용자 임상적 유형 분류 (P13은 결번) | `utils/personaClassifier.ts` · `docs/psychology-logic/페르소나.md` |
| **8축** | 페르소나 분류용 축 (애착·반추·자존감 등) | `supabase/migrations/022_persona_profiling.sql` |
| **방향 (direction)** | 일기마다 사용자가 고르는 catch / let_go / not_sure | `store/useJournalStore.ts` |
| **나침반 verdict** | 8가지 판정 (`strong_catch / lean_catch / undecided / undecided_with_love / undecided_with_resentment / lean_let_go / strong_let_go / DANGER_OBSESSION`) | `store/useDecisionStore.ts:CompassVerdict` · `app/compass/needle.tsx` |
| **유예 (cooling)** | 졸업 신청 후 7일 강제 대기 (취소 가능 / Day 7에서 7일 연장 가능) | `store/useCoolingStore.ts` · `app/cooling/*` |
| **C-SSRS** | 자살 위험 평가 척도 (3문항 양성 시 잠금) | `api/safety.ts` · `app/onboarding/persona/index.tsx` |
| **PHQ-9 / GAD-7 / RSE** | 우울·불안·자존감 표준 검사 | `utils/scoring.ts` · `app/assessments/[instrument].tsx` |
| **raw mode** | P10 분노 venting + 2차 정서 강제 | `app/journal/raw-mode.tsx` |
| **continuing bonds** | 사별 후 지속적 유대 (Klass 1996) | `app/memory/continuing-bonds.tsx` |
| **referral** | 외부 전문가 의뢰 (임계 초과 시) | `utils/referralEvaluator.ts` |
| **decision_locked** | C-SSRS 양성으로 결정 트랙 잠긴 상태 | `hooks/useDecisionLockGuard.ts` |
| **processing suspension** | PIPA §37 처리정지권 (알림·AI 토글) | `api/processingSuspension.ts` |

---

## 4. 학습 단계 (Phase 1~6)

각 단계에 **목표 / 읽을 것 / 자가 점검 질문 / 다음 단계 진입 조건**을 적었다. 시간은 풀타임 기준.

### Phase 1 — "이 앱이 뭘 만드는지" (예상 30분~1시간)

**목표:** 앱의 존재 이유와 사용자 여정을 설명할 수 있게 되기.

**읽을 것 (순서대로):**
1. [`README.md`](./README.md) — 한 페이지 개요
2. [이 문서의 §1 사용자 플로우](#1-사용자-플로우-시나리오로-이해하기) — 시나리오 한번 따라가기
3. [`docs/reason_project_v2.md`](./docs/reason_project_v2.md) — 전체 기획 (긴 문서, 1회독 OK)
4. [`docs/user-flow.md`](./docs/user-flow.md) — 흐름도

**자가 점검 — 답할 수 있어야 한다:**
- 이 앱이 *경쟁 앱*과 다른 점 한 줄로?
- 사용자가 가장 처음 만나는 화면 3개는?
- "졸업"이 왜 7일 유예를 거치는가?

**진입 조건:** 위 질문에 막히지 않으면 Phase 2.

---

### Phase 2 — "절대 깨면 안 되는 규칙들" (예상 1~1.5시간)

**목표:** 코드에 손대기 전에 알아야 할 14가지 규칙·심리학 기반·페르소나 체계를 머릿속에 넣기.

**읽을 것:**
1. [`CLAUDE.md`](./CLAUDE.md) — 절대 규칙 14개 표 + 아키텍처 + 컨벤션 (이게 본 가이드보다도 위)
2. [`docs/guide/01-product-principles.md`](./docs/guide/01-product-principles.md) — 채팅 UI 금지·화면 전환형·D+N 표시
3. [`docs/psychology-analysis.md`](./docs/psychology-analysis.md) — Kübler-Ross 5단계, Worden 4과제, DBT 통합 (왜 이런 화면을 만드는지)
4. [`docs/psychology-logic/페르소나.md`](./docs/psychology-logic/페르소나.md) — 20개 페르소나 정의
5. [`docs/psychology-logic/페르소나-분류체계.md`](./docs/psychology-logic/페르소나-분류체계.md) — 8축 → 페르소나 매핑
6. [`docs/psychology-logic/페르소나-화면-액션-매트릭스.md`](./docs/psychology-logic/페르소나-화면-액션-매트릭스.md) — 200셀 분기표 (참조용, 외울 필요 없음)

**자가 점검:**
- "페르소나 라벨 비노출" 규칙이 적용되지 않는 예외 폴더 3곳?
- 위기 신호가 감지되는 두 조건?
- C-SSRS 양성 시 *어떤* 트랙이 잠기고 *어떻게* 풀리는가?
- 유예 중 허용되는 알림 1가지?

**진입 조건:** CLAUDE.md 절대 규칙 표를 안 보고 5개 이상 말할 수 있으면 Phase 3.

---

### Phase 3 — "기술적 토대" (예상 1.5~2시간)

**목표:** 데이터가 어디 저장되고, 누가 누구를 호출하는지 파악.

**읽을 것:**
1. [`docs/guide/02-tech-and-architecture.md`](./docs/guide/02-tech-and-architecture.md) — 스택 전체
2. [`docs/guide/04-data-and-state.md`](./docs/guide/04-data-and-state.md) — DB ↔ Zustand 매핑
3. [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) — 폴더별 1줄 요약 (이번에 만든 인덱스)
4. **DB 진화사:** `supabase/migrations/001_initial_schema.sql` 부터 `031`까지 **파일명만** 훑고 흥미로운 것 3~5개만 열어보기. 추천:
   - `001_initial_schema.sql` (전체 뼈대)
   - `020_safety_protocol.sql` (C-SSRS·잠금)
   - `022_persona_profiling.sql` (8축·페르소나 결과)
   - `025_processing_suspension.sql` (PIPA §37)
   - `030_assessments.sql` (PHQ/GAD/RSE)
5. **Zustand 코어 2개:** [`store/useUserStore.ts`](./store/useUserStore.ts), [`store/useJournalStore.ts`](./store/useJournalStore.ts)

**자가 점검:**
- `journal_entries`의 unique 제약은? (힌트: KST 오늘 1건)
- 페르소나가 저장되는 2개 테이블은? 차이는?
- Edge Function이 OpenAI 키를 어디에서 읽는가? 클라이언트는 왜 못 읽는가?

**진입 조건:** "사용자가 일기 1건 저장하면 어떤 테이블 어떤 컬럼이 어떻게 바뀌는지" 5분 안에 설명할 수 있으면 Phase 4.

---

### Phase 4 — "핵심 플로우 코드 따라가기" (예상 반나절~하루)

**목표:** 일기·분석·나침반·졸업 4개 트랙을 각자 한 번씩 코드 레벨에서 따라가본다.

**읽을 것 (반드시 순서대로 — 위에서 아래로 호출 그래프 따라):**

#### 4-1. 부트스트랩
- [`app/_layout.tsx`](./app/_layout.tsx) — 전역 초기화
- [`app/index.tsx`](./app/index.tsx) — 미동의/미온보딩/완료 분기
- [`hooks/useAuth.ts`](./hooks/useAuth.ts) — 익명 가입·세션 감시

#### 4-2. 온보딩
- [`app/onboarding/login.tsx`](./app/onboarding/login.tsx)
- [`app/onboarding/consent.tsx`](./app/onboarding/consent.tsx) → [`api/consent.ts`](./api/consent.ts)
- [`app/onboarding/persona/index.tsx`](./app/onboarding/persona/index.tsx) → [`utils/personaClassifier.ts`](./utils/personaClassifier.ts) → [`utils/personaScoringRules.ts`](./utils/personaScoringRules.ts)

#### 4-3. 일기 4단계 (가장 중요)
- [`app/journal/index.tsx`](./app/journal/index.tsx) → [`app/journal/direction.tsx`](./app/journal/direction.tsx) → [`app/journal/question.tsx`](./app/journal/question.tsx) → [`app/journal/response.tsx`](./app/journal/response.tsx)
- [`hooks/useSmartQuestion.ts`](./hooks/useSmartQuestion.ts) — 질문 선정 알고리즘
- [`hooks/useStreamingAI.ts`](./hooks/useStreamingAI.ts) — SSE 스트리밍
- [`api/journal.ts`](./api/journal.ts) — upsert + KST 경계
- [`supabase/functions/ai-journal-response-stream/index.ts`](./supabase/functions/ai-journal-response-stream/index.ts) — 서버 측 GPT 호출

#### 4-4. 분석 5단계
- [`app/analysis/_layout.tsx`](./app/analysis/_layout.tsx) (가드) → reasons → pros-cons → role-partner → stay-leave → result
- [`utils/diagnosis.ts`](./utils/diagnosis.ts) — 재연결/극복/회복도 산출

#### 4-5. 나침반 5단계
- [`app/compass/want.tsx`](./app/compass/want.tsx) → check → scenario → needle → action
- [`app/compass/needle.tsx`](./app/compass/needle.tsx) — verdict 7종 결정 로직 (가장 중요한 코드)
- [`docs/guide/07-logic-rules.md`](./docs/guide/07-logic-rules.md) — verdict 분기 규칙

#### 4-6. 졸업·유예
- [`app/graduation/*`](./app/graduation/) 6단계
- [`app/cooling/index.tsx`](./app/cooling/index.tsx) — Day별 콘텐츠
- [`docs/guide/03-journal-and-cooling-policy.md`](./docs/guide/03-journal-and-cooling-policy.md)

**자가 점검:**
- 일기 1건 저장 → AI 응답 → DB까지 호출 그래프를 종이에 그릴 수 있는가?
- 나침반 verdict 7종 중 3개를 예시 사용자로 설명할 수 있는가?
- 졸업 신청 → 7일 유예 → 확정 흐름의 *취소 지점*은?

---

### Phase 5 — "안전·페르소나 게이트" (예상 반나절)

**목표:** 위기 감지·잠금·해제 흐름과 페르소나가 화면을 어떻게 분기시키는지 이해.

**읽을 것:**
1. [`docs/guide/08-quality-and-risks.md`](./docs/guide/08-quality-and-risks.md)
2. [`hooks/useEmotionalSafety.ts`](./hooks/useEmotionalSafety.ts) — 3일 저기분 + 새벽 감지
3. [`components/EmotionalCheckModal.tsx`](./components/EmotionalCheckModal.tsx) — 6항 C-SSRS
4. [`api/safety.ts`](./api/safety.ts) — `crisis_assessments` + `safety_lockouts`
5. [`hooks/useDecisionLockGuard.ts`](./hooks/useDecisionLockGuard.ts) — 결정 트랙 가드
6. [`app/safety/release.tsx`](./app/safety/release.tsx) — 잠금 해제 (24h + 4문항)
7. [`utils/personaResolver.ts`](./utils/personaResolver.ts) — (주/부 페르소나) → 단일 effective
8. [`constants/personaBranches.ts`](./constants/personaBranches.ts) — 화면 분기 헬퍼
9. [`constants/personaQuestionWeights.ts`](./constants/personaQuestionWeights.ts) — 질문 차단/부스터
10. [`utils/crisisHotlines.ts`](./utils/crisisHotlines.ts) + [`resources/crisis-hotlines.json`](./resources/crisis-hotlines.json)

**자가 점검:**
- 위기 신호 감지 → 모달 → 잠금 → 해제 흐름의 모든 분기를 그릴 수 있는가?
- P03(불안형) 사용자에게 새벽 푸시가 *왜* 차단되는가?
- 페르소나 P12 baseline은 무엇이고 언제 부여되는가?

---

### Phase 6 — "GPT 프롬프트 정책" (필요할 때만)

**목표:** AI 응답 품질을 손대거나 새 GPT 호출을 추가할 때 톤·면책·fallback 규칙을 안다.

**읽을 것:**
1. [`docs/guide/05-ai-and-prompt-policy.md`](./docs/guide/05-ai-and-prompt-policy.md)
2. [`supabase/functions/_shared/personaPrompts.ts`](./supabase/functions/_shared/personaPrompts.ts) — 시스템 프롬프트 빌더
3. [`api/ai.ts`](./api/ai.ts) — 클라 측 wrapper + 일시정지 게이트
4. [`utils/retry.ts`](./utils/retry.ts) — 백오프 + fallback
5. 관심 있는 Edge Function 1~2개 코드 (예: `ai-graduation-letter` — gpt-4o 사용)

**자가 점검:**
- AI 응답이 실패했을 때 사용자에게 보이는 화면은? 코드 어디?
- 처리정지권이 켜져 있는데 AI 호출이 들어오면 어디서 차단되는가? (힌트: dual gate)
- 졸업 편지가 왜 다른 GPT 호출과 다른 모델을 쓰는가?

---

## 5. 절대 규칙 빠른 참조 (CLAUDE.md 발췌, 외울 것)

| 카테고리 | 규칙 |
|---|---|
| **UI** | 채팅 UI 금지 — 화면 전환형만 |
| **AI** | GPT는 Edge Function에서만 호출. 클라 직접 호출 절대 금지 |
| **키** | OPENAI_API_KEY는 Edge Function 환경변수에만 |
| **DB** | 모든 테이블 RLS 필수. 없는 테이블 사용 금지 |
| **졸업** | 즉시 확정 금지. 7일 유예 필수 |
| **유예 알림** | Day 1~6 알림 없음. Day 7 푸시 1회만 |
| **유예 중 알림** | 일반 알림 전면 중지. 예외: C-SSRS 양성 사용자 24h 안부 |
| **판단 문구** | "정답이 아니야" 필수 |
| **방향 변화** | 비난·판단 금지 |
| **D+N** | 전역 표시 항상 유지 |
| **위기 신호** | 3일 ≤2점 OR 새벽 0~4시 → EmotionalCheckModal. 핫라인은 JSON에서만 (하드코딩 금지) |
| **위기 톤** | EmotionalCheckModal 본문은 반말. /resources/hotline만 존댓말 |
| **페르소나 라벨** | P01~P20·진단명 직접 노출 금지. `npm run lint:persona` 강제. 예외: resources/legal/onboarding/consent |

---

## 6. 자주 헷갈리는 포인트

### 6-1. "왜 이 화면이 안 보이지?"
- **결정 트랙(분석·나침반)이 안 보임** → C-SSRS 양성 잠금일 수 있음. `safety_lockouts` 테이블 + 페르소나 D+N 게이트 둘 다 확인.
- **졸업 탭이 막힘** → 현재 졸업은 보류 중. `app/(tabs)/graduation.tsx` → `/graduation-paused`로 리다이렉트.
- **일기가 저장 안 됨** → KST 자정 기준 오늘 1건 unique 제약. 이미 오늘 일기 있으면 upsert로 수정.

### 6-2. "왜 이 GPT 응답이 이상하지?"
- 페르소나 코드가 잘못 분류됐을 수 있음 → `usePersonaStore` 확인.
- `processingSuspension` 토글이 켜져 있으면 AI가 fallback 템플릿으로 떨어짐.
- 타임아웃 시 `utils/retry.ts`에서 fallback 응답이 반환됨.

### 6-3. "왜 이 컬럼이 NULL이지?"
- `breakup_date`는 NULL 허용 (031 마이그레이션) — 온보딩 중 consent 단계에서는 아직 미입력.
- `affection_level`은 7번 마이그레이션 이후 추가 — 그 전 일기는 NULL.
- `secondary_emotion`은 raw mode일 때만 채워짐 (P10).

### 6-4. "이 페르소나는 어디서 결정되는가?"
- 1차: 온보딩 Q1~Q6 + C-SSRS → `personaClassifier.ts:classify()`.
- 이후: D+7/14/30/60/90에 Edge Function `persona-reclassify-cron`이 8축 갱신만 함 (재분류는 deferred — 사용자가 화면 진입 시 수동 트리거).

---

## 7. 코드 첫 수정 시 체크리스트

새 화면이나 기능을 만들기 전 이 표를 훑어라.

- [ ] CLAUDE.md 절대 규칙 14개 중 위반될 수 있는 항목이 있나?
- [ ] D+N 표시가 필요한가? (대부분 예)
- [ ] 페르소나 분기가 필요한가? `personaBranches.ts`에 헬퍼 추가하면 되나?
- [ ] 새 DB 테이블·컬럼이 필요한가? RLS 정책을 같은 마이그레이션에 작성했나?
- [ ] GPT 호출이라면 — Edge Function인가? 페르소나 프롬프트가 적용되나? fallback이 있나?
- [ ] 위기 신호 감지가 필요한 화면인가? 결정 트랙이라면 `useDecisionLockGuard` 적용했나?
- [ ] 페르소나 라벨이 사용자에게 직접 노출되지 않나? `npm run lint:persona` 통과하나?
- [ ] 시간 비교는 KST 자정 기준인가? `utils/dateUtils.ts` 헬퍼 사용했나?
- [ ] 알림이 추가됐다면 유예 기간 중 발송 정책 위반은 없나? (Day 1~6 침묵)
- [ ] `npx tsc --noEmit` 통과하나?

---

## 8. 자주 쓰는 명령어

```bash
# 개발 서버
npx expo start --ios          # iOS 시뮬레이터
npx expo start --android      # Android 에뮬레이터

# 타입 체크
npx tsc --noEmit              # CI 필수

# 페르소나 라벨 lint
npm run lint:persona

# 단위 테스트
npx vitest                    # 또는 npx vitest run

# Supabase
supabase db push                          # 마이그레이션 적용
supabase functions serve                  # Edge Function 로컬 테스트
supabase functions deploy <name>          # 단일 Edge Function 배포

# 빌드 (EAS)
eas build --platform ios
eas build --platform android
```

---

## 9. 다음에 어디로 가야 하나

학습 완료 후, 깊이 들어가고 싶은 영역에 따라:

| 관심사 | 다음 문서 |
|---|---|
| 새 페르소나 추가하고 싶다 | `docs/psychology-logic/페르소나-분류체계.md` + `utils/personaClassifier.ts` 단위 테스트 |
| 페르소나별 화면 분기 | [`docs/psychology-logic/페르소나-화면-액션-매트릭스.md`](./docs/psychology-logic/페르소나-화면-액션-매트릭스.md) — 20 페르소나 × 11 화면 = 220셀 |
| 페르소나별 유저 여정 | [`docs/psychology-logic/페르소나별-유저-플로우.md`](./docs/psychology-logic/페르소나별-유저-플로우.md) — P01~P20 개별 시나리오 |
| 새 검사 도구 추가 | `docs/psychology-logic/심리검사.md` + [`docs/legal/scales-license.md`](./docs/legal/scales-license.md) (라이선스) + `utils/scoring.ts` + `030_assessments.sql` 패턴 |
| 새 GPT 호출 추가 | `docs/guide/05-ai-and-prompt-policy.md` + `supabase/functions/ai-comfort/` 참고 (가장 단순) |
| UX/UI 손보기 | `docs/ux-audit.md` + `evaluation/2026-05-03-ux-ui-audit.md` + [`evaluation/2026-05-06_플로우-방향성-점검.md`](./evaluation/2026-05-06_플로우-방향성-점검.md) |
| 위기 정책 손보기 | `docs/guide/08-quality-and-risks.md` + 임상 검증 문서 (`docs/psychology-logic/검증-임상관점.md`) — 임상가 리뷰가 거의 필수 |
| Phase별 진행 상황 | [`TODO.md`](./TODO.md) + `docs/phases/phase-*.md` + [`docs/psychology-tasks/`](./docs/psychology-tasks/) (Phase 6-7) |

---

## 10. 마지막으로

이 앱은 **사용자의 위기·결정·회복을 다루기 때문에**, 보통 앱보다 무겁다.
- 코드 한 줄 고치면 누군가의 결정에 영향을 미칠 수 있다.
- "기능을 빨리 만드는 것"보다 **"규칙을 어기지 않는 것"**이 우선이다.
- 헷갈리면 [`CLAUDE.md`](./CLAUDE.md)와 [`docs/guide/08-quality-and-risks.md`](./docs/guide/08-quality-and-risks.md)로 돌아와라.

**Welcome to Reason. 천천히, 정확히 가자.**
