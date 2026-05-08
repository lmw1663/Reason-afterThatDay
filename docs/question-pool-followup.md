# 질문통 후속 작업 — 진행 상황과 미완 항목

> `app/question-pool/index.tsx` MVP 구현 후 남은 작업 정리.
> 직전 결정: [`decisions-2026-05-08.md`](./decisions-2026-05-08.md), 관련 SSOT: [`question-pool-implementation.md`](./question-pool-implementation.md), [`journal-unified-queue.md`](./journal-unified-queue.md).

## 현재 상태 (커밋 `b041c42`)

✅ MVP 화면 — records 탭 → 질문통 진입
✅ 페르소나 booster 적용된 질문 → "너에게 맞춤" 섹션
✅ 시스템 추천 점수 상위 3개 → "추천" 배지
✅ 답변 모달 (free_text)
✅ pros/cons·페르소나 차단·is_active=false 자동 제외

## 1. 통합큐(useJournalQueue) 연동 정책

### 1.1 결정: 이미 답한 질문은 통합큐에 안 넣음 ✅ 적용 완료
- **수정**: `hooks/useSmartQuestion.ts` `selectByGeneralScore`에 `status === 'answered'` 제외 필터 추가
- **이유**: 사용자 요청 — 통합큐(일기 흐름) smartQ 슬롯에 이미 답한 질문이 다시 뜨면 중복감
- **예외**: 단계 2~4(후속·시간차 재질문)는 의도된 재노출이므로 그대로 — 일반 점수 기반 단계 6에만 적용
- **테스트**: 659 케이스 모두 통과

### 1.2 미완 항목 — 질문통 → 통합큐 push 흐름
- 현재: 질문통에서 카드 탭하면 즉시 답변 모달
- 추가 가능: "지금 답할게" / "일기에서 답할게" 두 옵션
  - "일기에서 답할게" → 통합큐 priority skip 큐에 questionId 추가 → 다음 일기 작성 시 우선 노출
- 작업: `hooks/useJournalQueue.ts`의 `prioritySkippedIds` 메커니즘 차용. 유사한 키(`journal_queue_pinned_<userId>`)로 별도 보관
- **우선순위**: 중. 통합큐 작업(Q-1·Q-2)이 main에 안착한 후 진행

## 2. display_type 별 답변 UI 분기

| display_type | 현재 | 시드 |
|---|---|---|
| `free_text` | TextInput | 대부분 |
| `boolean` | ✅ 그래/아니야 두 버튼 | `c_check_past`·`c_check_change`·`c_check_harder`·`c_check_free`·`c_check_fear` (5개) |
| `choice` | TextInput fallback (options 시드 없음) | `j_direction_change`·`j_direction_steady` (2개) |
| `pill` | TextInput fallback | 시드 없음 |
| `slider` | TextInput fallback | 시드 없음 |

- **boolean 적용 완료** — `app/question-pool/index.tsx` AnswerModal의 `isBoolean` 분기.
- choice/pill/slider는 시드가 없거나 options 미설정이라 free_text fallback 유지. 신규 시드 추가 시점에 분기 확장.
- 기존 `defaultPreviousAnswerFormatter` 가 모든 타입 표시 가능 — `/answers` 화면 변경 불필요.

## 3. 의도적으로 안 하는 것

### 3.1 "이미 답한 것 다시 답하기" 흐름 — 미진행 결정
- 사용자 결정: 안 함
- **이유**: 답변 변경은 기존 화면(일기 question, 분석 reasons, compass want·check)에서 자연스럽게 일어남 (`upsertQuestionResponse`가 trigger로 previous_value 자동 회전). 별도 진입로는 중복.
- **예외 케이스 처리**: 사용자가 같은 질문에 다른 답을 주고 싶으면 → 일기 등에서 재노출되거나, 시간차 재질문(D+7·D+30) 자동 노출 시 답변 변경 가능

## 4. 우선순위 매트릭스

| 항목 | 우선순위 | 비고 |
|---|---|---|
| 1.1 통합큐 미답변 필터 | **High** | ✅ 완료 |
| 1.2 질문통 → 통합큐 push UI | Mid | Q-3 untracked 작업 안착 후 |
| 2. display_type 분기 (boolean) | Mid | ✅ 완료 |
| 2. display_type 분기 (choice/pill/slider) | Low | 신규 시드 추가 시점에 |
| 3. 다시 답하기 흐름 | — | 안 함 (결정) |

## 5. 관련 파일

| 영역 | 경로 |
|---|---|
| 질문통 화면 | `app/question-pool/index.tsx` |
| 미답변 필터 | `hooks/useSmartQuestion.ts:296` `selectByGeneralScore` |
| 통합큐 라우터 | `utils/journalQueueRouter.ts` |
| 통합큐 훅 | `hooks/useJournalQueue.ts` |
| 답변 저장 API | `api/questions.ts` `upsertQuestionResponse` |
| 페르소나 가중치 | `constants/personaQuestionWeights.ts` |
