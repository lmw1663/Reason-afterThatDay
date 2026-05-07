# 공유 질문 풀(Question Pool) 구현 분석

> 모든 사용자가 동일하게 공유하는 질문 풀과, 사용자별 응답을 분리해 저장하는 구조에 대한 정리.

## 결론

공유 질문 풀이 잘 구현되어 있다. **공유 질문 정의(`question_pool`) ↔ 개인 응답(`question_responses`)** 을 RLS 수준에서 깔끔히 분리하고, 페르소나·컨텍스트 기반 스마트 선택 알고리즘을 통해 동일한 풀에서 개인화된 질문 노출이 가능하다.

---

## 1. DB 구조 — 공유 vs 개인 분리

| 테이블 | 역할 | RLS 정책 |
|---|---|---|
| `question_pool` | **공유 질문 정의** (모든 사용자 동일) | 읽기 전체 공개 / 쓰기 service_role만 |
| `question_responses` | **개인 응답 기록** | `auth.uid() = user_id` 기준 자기 것만 |

### 1.1 `question_pool` 핵심 컬럼

`supabase/migrations/001_initial_schema.sql:32-40`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | text PK | 질문 고유 ID (예: `j_direction_change`) |
| `text` | text | 질문 본문 |
| `context` | text[] | `['journal','analysis','compass','graduation']` 다중선택 → 화면별 필터링 |
| `weight` | int | 기본 가중치 (1~10) — 선택 알고리즘 점수 산정 |
| `is_active` | bool | 활성/비활성 토글 |

### 1.2 `question_responses` 핵심 컬럼

`supabase/migrations/001_initial_schema.sql:43-54`

| 컬럼 | 설명 |
|---|---|
| `(user_id, question_id)` | unique constraint — 사용자당 질문 1개 응답 |
| `response_value` | jsonb — 유연한 응답 값 |
| `question_status` | `'shown' \| 'answered' \| 'stale' \| 're_ask'` |
| `updated_at` | 자동 갱신 — 72시간 쿨다운 계산용 |

### 1.3 RLS 정책 (보안 핵심)

`supabase/migrations/002_rls_policies.sql:79-82`

- `question_pool`: **모두 읽기 가능, 쓰기는 service_role 전용** → 공유 풀의 무결성 보장
- `question_responses`: **자기 것만 접근** (`auth.uid() = user_id`)

---

## 2. 시드 데이터 — 총 29개

`supabase/migrations/003_question_pool_seed.sql:5-37` · `constants/questionPool.ts:4-42`(오프라인 폴백)

| 카테고리 | 개수 | 대표 질문 ID (weight) |
|---|---|---|
| journal | 6 | `j_direction_change`(10), `j_miss_what`(5) |
| analysis | 5 | `a_breakup_reason`(7), `a_their_feeling`(5) |
| compass | 9 | `c_honest_want`(9), `c_check_past`(7) — 일부는 체크화면 전용 (migration 005) |
| graduation | 4 | `g_learned`(8), `g_regret_best`(8) |
| cross-context | 5 | `x_right_now`(journal+compass), `x_support`(journal+analysis) |

---

## 3. API · 스토어 · 훅

### 3.1 API (`api/questions.ts`)

| 함수 | 설명 |
|---|---|
| `fetchQuestionPool()` (16-27) | 서버 우선, 실패 시 오프라인 번들 폴백 |
| `fetchAnsweredQuestions(userId)` (29-41) | 개인 응답 기록 로드 |
| `upsertQuestionResponse()` (43-60) | 응답 저장 (unique 키 보장) |
| `markQuestionShown()` (62-73) | 표시 상태 추적 |

### 3.2 Zustand 스토어 (`store/useQuestionStore.ts:30-61`)

- `pool`: 공유 질문 배열 메모리 캐시
- `answered`: `questionId → AnsweredQuestion` 맵 (O(1) 조회)
- `markAnswered(id, value)`, `markShown(id)`: 상태 변경

### 3.3 초기화 훅 (`hooks/useQuestionPool.ts`)

- 앱 루트 `_layout.tsx:19`에서 1회 호출
- 풀 + 개인 응답을 한 번에 로드 → 스토어 동기화

---

## 4. 스마트 선택 알고리즘

`hooks/useSmartQuestion.ts:47-77`

1. **방향 변화 감지** → 이전 일기와 현재 일기의 방향이 바뀌었으면 `DIRECTION_CHANGE_QUESTION` 우선 반환
2. **3일 연속 동일 방향** → `DIRECTION_STEADY_QUESTION` 반환
3. **후보 필터링**:
   - `context` 매칭
   - `is_active = true`
   - 72시간 쿨다운 회피
   - 페르소나별 차단 규칙 적용
4. **점수 계산**:
   ```
   score = weight
         + 미답변 가산(+5)
         + re_ask 가산(+3)
         + 페르소나 부스터(최대 +20)
   ```
5. 정렬 후 상위 1개 반환

### 페르소나 연동 (`constants/personaQuestionWeights.ts`)

- 예: P05(결정 후회) → `j_decision_recall` **+20 부스터**
- 예: P14(외도 가해) → `a_their_feeling` **차단** (자기 정당화 방지)

---

## 5. 사용자 노출 플로우

| 화면 | 파일 | 풀 사용 방식 |
|---|---|---|
| 일기 질문 | `app/journal/question.tsx` | `useSmartQuestion('journal', direction)` — 동적 1문항 |
| 관계 분석 | `app/analysis/reasons.tsx` | `useSmartQuestion('analysis','undecided')` — 이유 + 질문 동시 저장 |
| 나침반 체크 | `app/compass/check.tsx` | 5개 compass 체크 질문 고정 리스트 — 각 답변 upsert |

### 일기 화면 흐름 예시

```
방향 입력 (1/4)
   ↓
스마트 질문 노출 (2/4)   ← useSmartQuestion('journal', direction)
   ↓ markAnswered() (로컬)
AI 응답 (3/4)
   ↓
저장 (4/4)              ← upsertQuestionResponse() 서버 반영
```

---

## 6. 미흡한 점 · 주의사항

1. **풀 갱신은 마이그레이션 전용**
   - `question_pool` 쓰기 권한이 service_role뿐 → 런타임 질문 추가 메커니즘 부재
   - 의도된 설계(무결성 보장)지만, 운영 시 SQL 마이그레이션이 필수

2. **72시간 쿨다운은 클라이언트 계산**
   - `updated_at` 신뢰성에 의존
   - 다중 디바이스 환경에서 시점 차이 가능 → 서버 측 검증 추가 검토 권장

3. **페르소나 차단 규칙**
   - 코드 주석에 "후속 임상 검증 필요"(P09 등) 표시
   - 데이터 수집 후 재평가 필요

4. **cross-context 질문 관리 복잡도**
   - `x_support`가 `['journal','analysis']`에 속함
   - 신규 context 추가 시 관리 비용 증가 가능

---

## 7. 파일 경로 요약

| 영역 | 경로 |
|---|---|
| 스키마 | `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`, `003_question_pool_seed.sql`, `005_*.sql` |
| 상수 | `constants/questionPool.ts`, `constants/personaQuestionWeights.ts` |
| API | `api/questions.ts` |
| 스토어 | `store/useQuestionStore.ts` |
| 훅 | `hooks/useSmartQuestion.ts`, `hooks/useQuestionPool.ts` |
| UI | `app/journal/question.tsx`, `app/analysis/reasons.tsx`, `app/compass/check.tsx` |
