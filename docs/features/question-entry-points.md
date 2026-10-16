# 질문 출구 인덱스

> 이 앱이 사용자에게 질문을 던지는 모든 화면·모달의 카테고리별 인덱스.
> 작성 기준일: 2026-05-08 / Branch: `main`

CLAUDE.md 절대 규칙에 따라 모든 질문은 채팅 UI가 아닌 **화면 전환형 UX**로 통일돼 있으며, 응답은 RLS가 적용된 도메인 테이블(`question_pool` / `question_responses` / `psych_assessments` / `crisis_assessments` 등)에 저장된다.

---

## 1. 온보딩 (최초 진입)

| 화면 | 질문 내용 |
|------|-----------|
| `app/onboarding/consent.tsx` | 약관 동의 |
| `app/onboarding/duration.tsx` | 관계 기간 선택 (5가지 범위) |
| `app/onboarding/mood.tsx` | 현재 기분 (12가지 라벨) |
| `app/onboarding/persona/intro.tsx` | 페르소나 사전 안내 (baseline 제외 1회 노출) |
| `app/onboarding/persona/index.tsx` | Q1~Q6 페르소나 분류 + C-SSRS 3항 (위기 평가) |

## 2. 일기 흐름 (매일 루틴)

| 화면 | 질문 내용 |
|------|-----------|
| `app/journal/index.tsx` | 1/4 감정 온도(필수) + 라벨 + 신체 신호 |
| `app/journal/direction.tsx` | 2/4 방향 선택(잡고/보내고/모르겠어) + 애정 수준 |
| `app/journal/question.tsx` | 3/4 **스마트 질문** (`useSmartQuestion` 기반 풀 질문) |
| `app/journal/mini.tsx` | 미니 모드 — 감정 온도만 빠르게 |
| `app/journal/raw-mode.tsx` | 분노 모드 venting + 2차 감정 (P10) |
| `app/journal/unsent-letter.tsx` | 부치지 않을 편지 (24시간 잠금) |

## 3. 분석 (관계 분석, 5단계)

| 화면 | 질문 내용 |
|------|-----------|
| `app/analysis/reasons.tsx` | 1/5 이별 이유 + 풀 질문 |
| `app/analysis/pros-cons.tsx` | 2/5 상대의 장단점 입력 |
| `app/analysis/role-partner.tsx` | 3/5 마음속 두 목소리 (잡기 vs 보내기) |
| `app/analysis/stay-leave.tsx` | 4/5 슬라이더 3개 점수 |

## 4. 나침반 (방향 점검, 5단계)

| 화면 | 질문 내용 |
|------|-----------|
| `app/compass/want.tsx` | 1/5 방향 + 애정 수준 슬라이더 |
| `app/compass/check.tsx` | 2/5 이성적 체크 5문항 (yes/no) |
| `app/compass/scenario.tsx` | 3/5 시나리오 3개 선택 (catch/let_go/neutral) |

## 5. 임상 자가 평가

| 화면 | 질문 내용 |
|------|-----------|
| `app/assessments/[instrument].tsx` | PHQ-9 / GAD-7 / RSE 슬라이더 1문항씩 (D+7/14/30 권유) |

## 6. 자기 이야기 (about-me)

| 화면 | 질문 내용 |
|------|-----------|
| `app/about-me/index.tsx` | 14 카테고리 선택 (권장 카드 + 4개 노출) |
| `app/about-me/[category].tsx` | 카테고리별 자기 성찰 (점수·라벨·텍스트) |

## 7. 추억 다루기

| 화면 | 질문 내용 |
|------|-----------|
| `app/memory/index.tsx` | 카테고리 선택 (행복/그리움/아픔/성장) |
| `app/memory/write.tsx` | 기억 + 감정 입력 |
| `app/memory/declutter.tsx` | 사진/메시지/장소 정리 체크리스트 |
| `app/memory/encounter-plan.tsx` | 마주침 대비 시뮬레이션 |
| `app/memory/reflect.tsx` | 추억 반추 후 의미 재구성 |
| `app/memory/seal.tsx` | 봉인 의식 (놓아주기 단계) |
| `app/memory/continuing-bonds.tsx` | 사별 후 지속적 유대 의식 |

## 8. 매듭(구 졸업) 트랙

| 화면 | 질문 내용 |
|------|-----------|
| `app/graduation/confirm.tsx` | 3/5 아쉬웠던 기억 + 준비 상태 확인 |
| `app/graduation/farewell.tsx` | 4/5 상대 또는 과거 자신에게 마지막 한 줄 |
| `app/graduation/ritual.tsx` | 4/5 기억 보관 방식 선택 |

## 9. 유예(쿨링) 체크인

| 화면 | 질문 내용 |
|------|-----------|
| `app/cooling/checkin.tsx` | 자율 체크인 — 현재 마음 입력 |
| `app/cooling/index.tsx` | Day별 콘텐츠 + 체크인 |

## 10. 안전 / 위기 (모달·전용 화면)

| 컴포넌트 | 질문 내용 |
|----------|-----------|
| `components/EmotionalCheckModal.tsx` | 연속 저기분/새벽 진입 시 **C-SSRS 6항** |
| `components/IntrusiveMemoryModal.tsx` | 호흡 → 기록 → 기분 4단계 외현화 |
| `app/safety/release.tsx` | 안전 4문항 + 24시간 경과 (잠금 해제용) |

## 11. 보조 보고 (1탭 입력)

| 컴포넌트 | 입력 내용 |
|----------|-----------|
| `components/ContactUrgeChip.tsx` | 연락 충동 1탭 보고 + 7일 추세 |

---

## 참조

- 질문 풀 구조: [`docs/question-pool-implementation.md`](question-pool-implementation.md)
- 질문 상태머신·페르소나 차단: [`docs/guide/07-logic-rules.md`](guide/07-logic-rules.md)
- 위기 게이트·안전 잠금: [`CLAUDE.md`](../CLAUDE.md) 절대 규칙
- 매듭 트랙 재설계: [`docs/psychology-logic/redesign-graduation.md`](psychology-logic/redesign-graduation.md)
