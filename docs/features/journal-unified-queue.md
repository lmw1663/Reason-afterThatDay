# 일기 통합 큐 (Journal Unified Queue) — 정책 SSOT

> 일기 3/N 단계에서 [장단점 / 스마트Q / about-me / memory] 풀을 1번에 1개씩 라우팅해 받는 통합 큐 시스템. 사용자가 트랙 선택 결정 부담 없이 일기 흐름 안에서 자연스럽게 답할 수 있도록 통합.
>
> 작성 기준일: 2026-05-08 / Branch: `main` / 구현: Q-1~Q-6

---

## 동기

기존에는 분석(5단계) / 나침반(5단계) / about-me(14 카테고리) / 추억(여러 트랙)이 각각 독립 화면으로 분리돼 있어, 사용자가 이별 회복을 위해 *어디로 가야 할지* 매번 결정해야 했다. 결정 피로(decision fatigue)가 가장 높은 회복 초기 사용자에게 이 메타 결정 자체가 진입 장벽.

**해결:** 일기 흐름 안에 모든 트랙의 마이크로 질문을 통합한 큐를 두고, 시스템이 페르소나·D+N·최근 응답·스킵 이력에 따라 1개씩 라우팅. 사용자는 답하거나 "다음에"로 넘기면 다음 항목 자동 진행.

---

## 흐름

```
일기 1/N: 감정 온도 (필수)
일기 2/N: 방향 + 애정 수준 (필수)
일기 3/N: 통합 큐 — 항목 1개씩 노출
  ├─ 항목 종류: smartQ / aboutMe / memory / prosCons
  ├─ 큐 길이: D+0~7 = 3, D+8+ = 5
  ├─ 답변 시 → 다음 항목 자동 진행
  └─ "다음에" 작은 회색 텍스트 → skip, 다음날 우선 노출
일기 4/N: AI 응답 (모든 큐 답변을 컨텍스트로 주입)
```

진행률 카운트는 **큐 진행 중 미표시** — 사용자가 "전체 길이를 모를수록 부담 감소" 원칙(소진 신호 제거).

---

## 페르소나별 차등 정책

### 1. 장단점 풀 차단 (`isJournalProsConsBlocked`)

| 페르소나 | 차단 근거 |
|---|---|
| P01 자기 판단 손상 | HARMFUL — 분석 트랙 매트릭스 차단. about-me 자기 현실 검증으로 우회 |
| P14 외도 가해 | HARMFUL — 자기 정당화 차단. self_care_alone으로 우회 |
| P16 결혼·이혼 | 매듭 권유 비허용 + 외부 복잡도 — 장단점 평가 부적합 |
| P19 ROCD | 강박 도구화 위험 — 무한 단점/장점 추가 자극 |
| P20 트라우마 본딩 | HARMFUL — 미화 회복 차단 |

### 2. 단점 vs 장점 비중 곡선 (`getJournalProsConsRatio`)

| 페르소나 | D+0~7 | D+8~30 | D+30+ | 근거 |
|---|---|---|---|---|
| P02·P04·P06·P08 (default) | 0.7 | 0.6 | 0.5 | 초기 단점 ↑, 후기 균형 |
| P10 (분노 강) | 0.8 | 0.7 | 0.6 | 분노 표출 통로 |
| P05·P07·P09·P12·P15 (장점 우세) | 0.6 | 0.5 | 0.4 | 정상화·장점 통합 |
| **P03·P11·P18 (균형 곡선)** | **0.5** | **0.5** | **0.5** | 단점 강조 시 결정 트라우마 자극 |
| **P17 (장점 보존)** | **0.3** | **0.3** | **0.3** | Continuing Bonds — 본인 결정 아닌 이별 |

### 3. 추억 미화 차단 (`isMemoryGlamourBlocked`)

P01·P10·P14·P20 — 'happy'·'miss' 카테고리 제거, 'painful'·'growth'만 노출. 기존 매트릭스 §2 C7 정책 그대로 차용.

### 4. 다중 페르소나 처리

`appliesGuard` 패턴(R5 "부의 금기만 추가")으로 effective + guardOverlay 양쪽 검사. 한 쪽이라도 차단 페르소나면 해당 풀 제외.

**예시:**
- 주 P03 + 부 P14 → P14 보호 우선으로 prosCons 풀 제거
- 주 P10 + 부 P19 → P19 강박 우려로 prosCons 풀 제거

---

## "다음에" 스킵 정책

| 동작 | 처리 |
|---|---|
| 사용자가 "다음에" 탭 | 해당 항목 ID를 AsyncStorage에 KST 자정 anchor로 저장 |
| 다음날 큐 빌드 | 어제 record (today-1)의 ids만 priority로 큐 앞 정렬 |
| 이틀 이상 지난 record | 만료 — priority X (오늘 페르소나 곡선과 무관해질 수 있음) |
| 미래 날짜 (잘못된 시계) | 안전상 무시 |
| 더블탭/연타 | `submittingRef` + `skipQueueRef` Promise chain으로 직렬화 |

---

## 위기 잠금 정합

`useDecisionLockGuard`가 `locked` 반환 시 (C-SSRS 양성):
- **prosCons 풀 자동 제외** (분석성 항목)
- smartQ·aboutMe·memory는 그대로 — 정서 표출·자기 인식·회상은 안전 트랙

빈 큐가 되면 즉시 done 처리 → 일기 4/N 응답 화면으로 통과.

---

## 데이터 흐름

### 저장 라우팅 (`routeQueueAnswers`)

| 항목 종류 | 저장처 |
|---|---|
| `smartQ` | `question_responses` (Phase A — `markQuestionAnswered`) + `journal_entries.free_text` (라벨 prefix) |
| `aboutMe` | `self_reflections` (`updateReflection`, current 토글) + `journal_entries.free_text` |
| `prosCons` | `relationship_profile.pros/cons` 누적 + `prosByDate[today]`/`consByDate[today]` 일별 인덱스 + `journal_entries.free_text` |
| `memory` | `journal_entries.free_text` (라벨 prefix) — 추억은 별도 도메인 테이블 없음 |

### Source-of-truth 정책 (P1-5 명세)

- **분석성 집계**(예: 매듭 권유 점수, 페르소나 재추정 신호): `question_responses` / `relationship_profile` / `self_reflections`만 권위 출처. `journal_entries.free_text`는 AI 컨텍스트·history UI 전용.
- **AI 컨텍스트**: `composeAugmentedFreeText`로 합친 텍스트만 전달. 도메인 테이블 직접 fetch 없음.

### 동시성 한계 (P0-1 알려진 한계)

`upsertRelationshipProfile`은 read-then-write이라 동시 갱신 시 race 가능:
- 사용자가 다른 디바이스/탭에서 분석 트랙으로 cons 추가 후 일기 마감 → 분석 트랙 추가분 손실 가능
- **현재 mitigation**: 단일 디바이스·단일 세션이면 안전. 멀티 라이터 시 알려진 한계.
- **후속 PR 권장**: SQL RPC(`array_append` + `jsonb_set` 원자 갱신) 또는 Edge Function row lock.

---

## 큐 길이 상한

`getJournalQueueMaxLength(daysElapsed)`:
- D+0~7: **3개** (회복 초기 부담 최소)
- D+8+: **5개** (확장)

상한 초과 항목은 잘림. priority skipped 항목이 있으면 앞으로 정렬되어 잘림 영향 적음.

---

## 알려진 한계 / 후속 작업

| 한계 | 영향 | 후속 |
|---|---|---|
| `recentlyServedMemory` 미추적 | 같은 memory 카테고리 반복 노출 가능 | 별도 `journal_memory_responses` 테이블 또는 `journal_entries.free_text` 파싱 |
| `routeQueueAnswers` 동시성 race (P0-1) | 멀티 라이터 시 prosByDate 일부 손실 | SQL RPC 원자 갱신 |
| seed 분산 부족 (P2-1) | 같은 D+N 사용자에게 같은 prosCons 분배 | userId hash 추가로 분산 향상 |
| `QueueItem` discriminated union 미적용 (P2-2) | optional field 매번 옵셔널 체이닝 | 타입 리팩터 별도 PR |

---

## 구현 위치

| 위치 | 역할 |
|---|---|
| `constants/personaBranches.ts` Ref-7 | `isJournalProsConsBlocked` / `getJournalProsConsRatio` / `getJournalQueueMaxLength` |
| `utils/journalQueueRouter.ts` | `buildQueueSequence` 순수 라우터 + `QueueItem`/`QueueAnswerPayload` 타입 |
| `utils/journalQueueSkip.ts` | `todayKstString` / `selectPriorityFromRecord` (TTL 1일) / `appendSkippedId` |
| `utils/journalQueueCompose.ts` | `composeAugmentedFreeText` / `formatAnswerLabel` (순수, supabase 비의존) |
| `utils/journalQueueSink.ts` | `routeQueueAnswers` 도메인 라우팅 (fire-and-forget) |
| `hooks/useJournalQueue.ts` | 큐 상태 훅 + skip 정책 + recentlyServed fetch + 더블탭 직렬화 |
| `app/journal/question.tsx` | 큐 셸 — 항목 종류별 입력 UI + "다음에" 링크 |
| `app/journal/response.tsx` | `queueAnswers` 파싱 + augmentedFreeText 합치기 + `routeQueueAnswers` 호출 |

---

## 테스트 커버리지

| 파일 | 케이스 수 | 범위 |
|---|---|---|
| `personaBranches.test.ts` Ref-7 | 46 | 비중 곡선·풀 차단·길이 상한 |
| `journalQueueRouter.test.ts` | 28 | 풀 빌드·페르소나 차단·decisionLocked·priorityskipped·중복 방지 |
| `journalQueueSkip.test.ts` | 12 | KST anchor·TTL 1일·만료·미래 시계 |
| `journalQueueCompose.test.ts` | 10 | 라벨 + freeText 합치기 + trim |

총 **96 케이스** — 라우터·정책·스킵·컴포저 모두 단위 테스트.

---

## 참조

- 페르소나 4유형 분류: [`constants/personaTypology.ts`](../constants/personaTypology.ts)
- 다중 페르소나 충돌 해소: [`utils/personaResolver.ts`](../utils/personaResolver.ts)
- 매듭 권유 비허용 페르소나(P03·P11·P16·P19): [`CLAUDE.md`](../CLAUDE.md) 절대 규칙
- 추억 미화 차단(P01·P10·P14·P20): `personaBranches.ts` G-7a 섹션
- 매트릭스 분석 트랙 차단(P01·P14·P20): `personaBranches.ts` G-6 섹션
