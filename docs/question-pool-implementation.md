# 공유 질문 풀(Question Pool) 구현 — Phase A~H 후 현행

> v2 §4 "공유 질문 풀 시스템 + 맥락 넘나드는 질문 + 답변 변화 추적" 의도 복원 결과.
> Phase A(데이터 모델) → B(PreviousAnswerHint) → C(파이프라인 분해) → D(답변 변화 후속)
> → E(시간차 재질문 + 매듭 페르소나 가드) → F(타임라인·비교 카드) → G(카테고리 GPT 입력 + 잠금 가드)
> → H(compass 채널 + reason 카테고리 자동 선택) 누적 결과.

## 결론

v2 §4 의도 ≈90% 복원. 데이터 모델·후속 그래프·시간차 재질문·답변 변화 시각화·GPT 안전 가드·매듭 페르소나 선제 차단까지 갖춰짐. 마지막 10%는 RNTL 컴포넌트 렌더 테스트 도입(별도 페이즈)·신규 카테고리 시드 추가 시 자동 활성화 형태로 점진 마무리.

---

## 1. DB 구조 — 공유 / 개인 / 후속 / history 4축

| 테이블 | 역할 | RLS 정책 |
|---|---|---|
| `question_pool` | **공유 질문 정의** + v2 메타(category·display_type·revisit) | 읽기 전체 공개 / 쓰기 service_role만 |
| `question_responses` | **개인 응답 기록** + previous_value/response_count | `auth.uid() = user_id` |
| `question_followups` | **후속 그래프** (parent → child + trigger) — Phase A 신규 | 읽기 전체 공개 / 쓰기 service_role만 |
| `question_response_history` | **append-only 변화 추적** — Phase A 신규 | SELECT/INSERT 만 자기 것 (UPDATE/DELETE RLS 차단) |

### 1.1 `question_pool` 컬럼 (마이그 001 + 037)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | text PK | 질문 고유 ID (예: `j_direction_change`) |
| `text` | text | 질문 본문 |
| `context` | text[] | `['journal','analysis','compass','graduation']` |
| `weight` | int | 기본 가중치 (1~10) |
| `is_active` | bool | 활성/비활성 |
| `category` | text? | `pros|cons|reason|regret|lesson|future|direction|need|fear|self_care` (Phase A) |
| `display_type` | text | `pill|free_text|slider|choice|boolean` (Phase A) |
| `options` | jsonb? | pill/choice 선택지 (Phase A) |
| `revisit_after_days` | int? | D+N 자기참조 재노출 (Phase E) |
| `revisit_window_days` | int | 재노출 허용 폭 (default 3) |
| `allow_cooldown_bypass` | bool | 일반 72h 쿨다운 면제 (방향 변화 등) |

### 1.2 `question_responses` 컬럼 (마이그 001 + 039)

| 컬럼 | 설명 |
|---|---|
| `(user_id, question_id)` | unique — 사용자당 질문 1개 응답 |
| `response_value` | jsonb |
| `previous_value` | jsonb? — 직전 1개 (Phase A) — UI prefill·"저번엔 X였는데" 프레임 |
| `response_count` | int — 갱신 횟수 (Phase A) |
| `question_status` | `'shown'|'answered'|'stale'|'re_ask'` |
| `updated_at` | 자동 갱신 (트리거) |

### 1.3 `question_followups` (마이그 038)

| 컬럼 | 설명 |
|---|---|
| `parent_id` | FK → question_pool |
| `child_id` | FK → question_pool |
| `trigger_type` | `answer_changed|answer_equals|answer_yes|answer_no|always` |
| `trigger_value` | jsonb? (`answer_equals` 매칭값) |
| `delay_hours` | int >= 0 (`always` 시간차 제어) |
| `priority` | int — 충돌 시 정렬 |

### 1.4 `question_response_history` (마이그 039)

`(user_id, question_id, response_value, recorded_at, source_screen?, d_plus?)` 의 append-only 시계열. AFTER INSERT/UPDATE 트리거(`archive_question_response`)가 값 변경 시에만 record 추가, `question_status='shown'` 은 archive 제외.

---

## 2. 트리거 (마이그 002 + 039)

| 트리거 | 타이밍 | 책임 |
|---|---|---|
| `question_responses_set_prev` | BEFORE UPDATE | 값 변경 시 NEW.previous_value/response_count 회전 |
| `question_responses_updated_at` | BEFORE UPDATE | NEW.updated_at = now() |
| `question_responses_archive` | AFTER INSERT/UPDATE | history 테이블에 변화 기록 (shown 제외) |

발사 순서: 알파벳 — `set_prev` < `updated_at` (둘 다 NEW 수정, 컬럼 비충돌). archive는 AFTER 라 부모 INSERT 실패 시 고아 history 회피.

`d_plus` 는 트리거 안에서 `current_date - users.breakup_date` 로 계산 — 사용자가 이후 breakup_date 수정해도 과거 기록은 *frozen*.

---

## 3. 시드 데이터

### 3.1 question_pool — DB 30개 + 오프라인 폴백 4개

- 마이그 003: 23개 (일기 6 / 분석 5 / 나침반 5 / 졸업 4 / cross-context 3)
- 마이그 005: 7개 (나침반 체크 5 + 졸업 회한 2)
- `constants/questionPool.ts` 오프라인 폴백: 4개 추가 (`j_decision_recall`/`j_two_minds`/`j_fact_only`/`j_unspoken` — 페르소나 분기. DB 미시드 — 폴백에서만 검색됨. 운영 시 마이그 추가 검토 항목)

### 3.2 question_followups — 3개 (마이그 038)

| parent | child | trigger | delay | priority |
|---|---|---|---|---|
| `a_breakup_reason` | `a_fix_possible` | `answer_changed` | 0 | 9 |
| `j_direction_change` | `c_check_change` | `always` | 24h | 8 |
| `c_honest_want` | `c_check_fear` | `always` | 24h | 7 |

발화 채널: child의 context와 일치하는 화면이 `useSmartQuestion`을 호출해야 발화. fu1은 reasons.tsx, fu2/fu3은 want.tsx (Phase H에서 channel 활성화).

### 3.3 시간차 재질문 시드 (마이그 037)

| ID | revisit_after_days | window |
|---|---|---|
| `a_breakup_reason` | 7 | 3 |
| `a_fix_possible` | 7 | 3 |
| `c_honest_want` | 7 | 3 |
| `g_regret_best` | 30 | 5 |
| `g_learned` | 30 | 5 |

---

## 4. API 표면 (`api/questions.ts`)

| 함수 | 설명 |
|---|---|
| `fetchQuestionPool()` | 서버 우선, 실패 시 오프라인 번들 폴백 |
| `fetchQuestionFollowups()` | 후속 그래프 로드 (Phase A) |
| `fetchAnsweredQuestions(userId)` | 개인 응답 + previous_value/response_count |
| `upsertQuestionResponse()` | 응답 저장 (서버 트리거가 history 자동 archive) |
| `markQuestionShown()` | shown 표시 (history 에 남지 않음) |
| `fetchResponseHistory(userId, questionId)` | 단일 질문 시계열 (Phase A) |
| `fetchResponseHistoryByCategory(userId, category)` | 카테고리 join 시계열 (Phase G) |

---

## 5. 스마트 선택 알고리즘 — 6단계 파이프라인

`hooks/useSmartQuestion.ts` — 순수 함수 단계로 분해(Phase C). 각 단계 외부 의존성 없이 인자만으로 결정 → 단위 테스트 직접 가능.

```
1. selectDirectionChange       — 어제↔오늘 방향 다름 → j_direction_change
2. selectAnswerChangedFollowUp — 부모 응답 변경 후 72h 내 → 자식 (Phase D)
3. selectScheduledFollowUp     — 부모 응답 후 N시간 + 7d 윈도우 → 자식 (Phase D)
4. selectScheduledRevisit      — D+N(±window) 자기참조 재노출 (Phase E)
5. selectDirectionSteady       — 3일 연속 같은 방향
6. selectByGeneralScore        — context+isActive+cooldown+persona → 점수 정렬
```

후속·재질문(2·3·4) **일일 상한 1개** — `countTodayFollowUpAnswers` 가 KST 자정 기준 자식 답변 수를 세어 ≥1 이면 이 단계들 스킵 → 일반 풀로 폴백 (압박감 회피, CLAUDE.md "단정 금지").

후속·재질문 **쿨다운 면제** — 의도된 재노출이므로 일반 72h 쿨다운 무시.

### 5.1 점수 산식

```
score = weight + (미답변 +5) + (re_ask +3) + persona_booster
```

### 5.2 페르소나 부스터/차단 (`constants/personaQuestionWeights.ts`)

부스터 예: P05(결정 후회) → `j_decision_recall` +20.
차단 예: P14(외도 가해) → `a_their_feeling`/`a_fix_possible` 차단.

---

## 6. 안전 게이트 SSOT

복수 가드가 어디서 발동하는지 통일 명시:

| 가드 | 발동 위치 | 차단 대상 |
|---|---|---|
| `safety_lockouts.decision_locked` | `useDecisionLockGuard` | 분석·나침반 트랙 진입 차단 |
| `safety_lockouts.graduation_locked` | `useGraduationLockGuard` | 매듭/졸업 트랙 진입 차단 — letter.tsx 도 Phase G에서 통합 |
| `KNOT_FORBIDDEN_PERSONAS` (P03/P11/P16/P19) | `selectScheduledRevisit` 진입부 | graduation context 시간차 재질문 일괄 차단 (Phase E 선제 적용) |
| `isQuestionBlocked(persona, qid)` | 모든 select 단계 | 특정 ID-페르소나 조합 차단 |
| 후속 자기참조(`parent==child`) | `selectScheduledFollowUp` | silent failure 회피 — 자기참조는 selectScheduledRevisit가 공식 경로 |

**페르소나 가드 vs 잠금 가드 분리**: graduation_locked 는 *위기 신호*(C-SSRS)로 인한 일시 차단, KNOT_FORBIDDEN_PERSONAS 는 *임상 안전*으로 영구 차단(페르소나 재추정 시에만 해제). letter.tsx 는 둘 *모두* 통과해야 진입 — Phase G에서 graduation_locked 가드 직접 도입, KNOT_FORBIDDEN_PERSONAS 는 상위 레이어(`/cooling/final` → letter 경로)가 책임.

---

## 7. UI 카피 컴포넌트

| 컴포넌트 | 책임 | 적용 화면 |
|---|---|---|
| `PreviousAnswerHint` | "저번엔 X였는데, 지금은 어때?" inline/card (Phase B) | reasons.tsx, check.tsx, want.tsx (Phase H) |
| `AnswerTimeline` | 변화 시계열 점-선 표시 (Phase F) | (예약, knot/archive 통합 예정) |
| `FirstVsLatestCard` | 처음↔지금 짝 카드 — 횟수 미표시 (Phase F) | graduation/letter.tsx |
| `defaultPreviousAnswerFormatter` | jsonb→표시 문자열 (`answerFormatters.ts`) | 위 3종 모두 공유 |

### 톤 원칙 (CLAUDE.md "방향 변화 비난 금지" + Phase G GPT 가드)
- "왜 또"·"왜 자꾸"·"마음이 또 바뀐"·"또"·"자꾸"·"결국"·"마침내"·"드디어"·"이제야" 어휘 금지
- "정리됐네"·"편해졌네"·"보이네" 같은 단정 어미 금지
- 변화 횟수("N번 바뀌었어") 강조 금지 — 사실(처음·지금)만 표시
- 같은 답이면 카드 자체 미렌더 ("그대로네" 단정 회피)

---

## 8. 사용자 노출 플로우

| 화면 | 파일 | 풀 사용 방식 | Phase |
|---|---|---|---|
| 일기 질문 | `app/journal/question.tsx` | useSmartQuestion('journal') — source 따라 캡션 분기 | C/D/E |
| 관계 분석 | `app/analysis/reasons.tsx` | useSmartQuestion('analysis') + PreviousAnswerHint card | B |
| 나침반 솔직 | `app/compass/want.tsx` | c_honest_want 응답 기록 + PreviousAnswerHint inline | H |
| 나침반 체크 | `app/compass/check.tsx` | 5개 boolean — 각 inline PreviousAnswerHint | B |
| 졸업 편지 | `app/graduation/letter.tsx` | fetchResponseHistoryByCategory('reason') + FirstVsLatestCard + GPT prompt 변화 입력 | F/G/H |

캡션 분기 (`app/journal/question.tsx`):
- `direction_change` → "마음이 바뀐 날 · 3 / 4"
- `direction_steady` → "단단해진 마음 · 3 / 4"
- `follow_up` → "이어서 물어볼게 · 3 / 4"
- `revisit` → "다시 떠올려볼게 · 3 / 4"
- `general` → "이별 일기 · 3 / 4"

---

## 9. 미흡한 점 · 후속 작업 후보

1. **RNTL 컴포넌트 렌더 테스트 미도입** — vitest config가 `.test.ts`만 포함, RN 컴포넌트는 Flow 파싱 이슈로 vitest 환경에서 직접 렌더 부담. PreviousAnswerHint/FirstVsLatestCard/AnswerTimeline 의 렌더 분기는 헬퍼 단위 테스트로만 커버 (formatter falsy 그물망 + first/latest 비교 분기). 별도 페이즈에서 jest-expo 또는 vitest+jsdom+RN mock 도입 가능.

2. **카테고리 시드 확장 시 자동 활성화** — 현재 `reason` 카테고리는 a_breakup_reason 단일. 추가 reason 질문 시드만 넣으면 letter의 `pickReasonReflection`이 가장 활동적인 변화를 자동 선택 — 코드 변경 없음.

3. **AnswerTimeline 미사용 (예약)** — 컴포넌트 작성 + 테스트 완료. knot/archive 또는 graduation/report 통합 시 즉시 활용 가능.

4. **fu2/fu3 발화 채널 — Phase H 부분 활성화** — want.tsx에서 c_honest_want 기록 시작(fu3 parent anchor 활성). 다만 c_check_change/c_check_fear 자식이 check.tsx에서 *항상* 노출되는 fixed list 구조라 후속 트리거의 "의도된 시점에만 노출" 효과는 미실현. 후속 페이즈에서 check.tsx 동적 노출 리팩터 필요.

5. **GPT 출력 lint 자동화** — BASE_SYSTEM_PROMPT 가드는 모델 협조 의존. 실제 응답에 금지 어휘가 새어 나오는지 자동 검사하는 lintResponse 확장(시간 데이터 변화 어휘 추가) 필요.

---

## 10. 파일 경로 요약

| 영역 | 경로 |
|---|---|
| 스키마 | `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`, `003_question_pool_seed.sql`, `005_question_pool_additions.sql`, `037_question_pool_v2_meta.sql`, `038_question_followups.sql`, `039_question_response_history.sql` |
| 상수 | `constants/questionPool.ts`, `constants/personaQuestionWeights.ts` |
| API | `api/questions.ts`, `api/ai.ts` (fetchGraduationLetter), `supabase/functions/ai-graduation-letter/index.ts` |
| 스토어 | `store/useQuestionStore.ts` |
| 훅 | `hooks/useSmartQuestion.ts`, `hooks/useQuestionPool.ts`, `hooks/useGraduationLockGuard.ts`, `hooks/useDecisionLockGuard.ts` |
| 유틸 | `utils/reasonReflection.ts` (Phase H) |
| UI | `components/ui/PreviousAnswerHint.tsx`, `AnswerTimeline.tsx`, `FirstVsLatestCard.tsx`, `answerFormatters.ts` |
| 화면 | `app/journal/question.tsx`, `app/analysis/reasons.tsx`, `app/compass/want.tsx`, `app/compass/check.tsx`, `app/graduation/letter.tsx` |
| 테스트 | `api/__tests__/questionsPhaseA.test.ts`, `hooks/__tests__/useSmartQuestion.test.ts`, `components/ui/__tests__/answerTimelineHelpers.test.ts`, `utils/__tests__/reasonReflection.test.ts` |
