# 나에 대한 빛 (RSE) 기능 분석

> 회복의 결 화면(`app/recovery-trace/index.tsx`)이 사용하는 3개 척도 중 하나인
> **RSE(Rosenberg Self-Esteem Scale)** 의 정의·흐름·활용처·의도 정리.
> 자매 문서: [`recovery-trace-metaphors.md`](./recovery-trace-metaphors.md) — 메타포 사전.

## 한 줄 정의

이별 후 자존감 변화를 추적하기 위해 **D+30**에 자동 권유되는 10문항 검사. 점수는 비노출, "나에 대한 빛" 메타포로 회복의 결 화면에 PHQ-9·GAD-7과 함께 시각화.

---

## 1. 척도 자체

### 출처
- Rosenberg(1965), 한국어판 전병제(1974)
- `resources/assessment-items.json` RSE 섹션에 한국어 문항 보관

### 구성
- **10문항** × 4점 리커트 (0~3점) 합산 = 0~30점
- 응답 라벨: "매우 아니다" / "아니다" / "그렇다" / "매우 그렇다" — `RSE_LABELS`
- PHQ-9·GAD-7과 다른 점: PHQ/GAD는 **빈도**(며칠/거의 매일) 척도, RSE는 **동의 강도** 척도

### Band 컷오프 (`utils/scoring.ts:80-94`)
| 점수 | band | 메타포 |
|---|---|---|
| 0~14 | low | 나에 대한 빛이 약해진 시기 |
| 15~25 | avg | 나에 대한 빛, 평소만큼 켜져 있어 |
| 26~30 | high | 나에 대한 빛이 단단해 |

### 역코딩 (`utils/scoring.ts:135-139` `reverseRSE`)
- 부정 문항 5개: **3·5·8·9·10번** ("실패한 사람 같다"·"쓸모없다고 느낀다" 등)
- 저장 전에 `3 - response`로 변환 후 합산
- 이를 통해 모든 항목이 "높을수록 자존감 높음" 방향 통일

### 10문항 본문 (`resources/assessment-items.json`)
1. 나는 내가 적어도 다른 사람만큼 가치 있는 사람이라고 느낀다
2. 나는 좋은 자질을 많이 가지고 있다고 생각한다
3. 전반적으로 나는 실패한 사람 같다 [역]
4. 나는 다른 사람들만큼 잘 해낼 수 있다
5. 나는 자랑스러워할 만한 것이 별로 없다 [역]
6. 나는 나 자신에 대해 긍정적인 태도를 가지고 있다
7. 전반적으로 나 자신에 대해 만족한다
8. 내가 나를 더 존중할 수 있으면 좋겠다 [역]
9. 가끔 나는 내가 정말 쓸모없다고 느낀다 [역]
10. 가끔 나는 내가 전혀 좋은 사람이 아니라고 생각한다 [역]

---

## 2. 검사 흐름 (단계별)

| # | 단계 | 위치 |
|---|---|---|
| 1 | 진입 | `/assessments/RSE?source={d30\|manual}` |
| 2 | 화면 | `app/assessments/[instrument].tsx` — 1문항 = 1화면, ProgressDots |
| 3 | 라벨 | "다음 문장에 얼마나 동의해?" (PHQ/GAD의 "지난 2주 동안"과 다름) |
| 4 | 응답 | `RSE_LABELS` 4지선다 |
| 5 | 디스클레이머 | 첫·마지막 문항에 "정답이 아니야 — 오늘 결을 보는 거야" |
| 6 | 저장 | 응답 → 인덱스 → `reverseRSE` 역코딩 → `payload[item${n}]` |
| 7 | 라우팅 | `/recovery-trace`로 자동 이동 (PHQ-9와 달리 위기 게이트 없음) |

---

## 3. 진입 경로

### 자동 권유 (D+30 ± 2일)
- `utils/assessmentTrigger.ts:55-61` — RSE 권유 윈도우 정의 (centerDay=30, tolerance=2)
- `components/AssessmentRecommendationCard.tsx:40-62` — 권유 카드 노출 결정
- 카드 문구: "나에 대한 빛, 지금은 어때?" (`AssessmentRecommendationCard.tsx:59`)

### 수동 진입
- `app/recovery-trace/index.tsx:170` — "지금 시작하기 ›" CTA → `/assessments/RSE?source=manual`

### Source 종류
| source | RSE 적용 여부 |
|---|---|
| `onboarding` | ❌ 미적용 (PHQ-2/GAD-2만 단축형 스크리닝) |
| `d7` | ❌ (PHQ-9 권유 시점) |
| `d14` | ❌ (GAD-7 권유 시점) |
| `d30` | ✅ 자동 권유 |
| `graduation` | ❌ 매듭 트랙은 RSE 미연동 |
| `manual` | ✅ 수동 |

---

## 4. 결과 활용처

### 메타포 렌더 ✅
- `utils/scoring.ts:171-177` — `bandMetaphor('RSE', band)` 정의
- `app/recovery-trace/index.tsx:88-94` — ComparisonCard "나에 대한 빛" 라벨
- D+0 vs 현재 메타포 비교 카드

### 데이터 저장 ✅
- `api/assessments.ts:50-53` — `scoreRSE()` 호출, rawScore·band 산출
- `supabase/migrations/030_assessments.sql:18` — `psych_assessments` 테이블 (instrument='RSE')
- `getRecoveryTrace()` 시계열에 RSE 포함 (`api/assessments.ts:97-137`)

### 사용 안 하는 곳 ❌
| 영역 | 사용 여부 | 비고 |
|---|---|---|
| 페르소나 분류 (`usePersonaReclassify`) | ❌ | PHQ-2/GAD-2 축만 입력 |
| GPT 프롬프트 (나침반·AI 응답) | ❌ | PHQ9·GAD7만 포함 |
| 매듭 트랙 게이트 | ❌ | C-SSRS만 연동 |
| 위기 신호 (`EmotionalCheckModal`) | ❌ | 3일 mood_score 추적만 |

→ **RSE는 회복 추적 시각화 전용**. 다른 의사결정 경로엔 영향 안 줌.

---

## 5. 다른 척도와의 차이 비교표

| 항목 | PHQ-9 | GAD-7 | **RSE** |
|---|---|---|---|
| 의미 | 우울 심각도 | 불안 심각도 | **자존감 수준** |
| 방향 (lowerIsBetter) | true | true | **false** (높을수록 좋음) |
| Band 단계 | 5 (minimal~severe) | 4 (minimal~severe) | **3 (low~high)** |
| 응답 라벨 | 빈도 (며칠) | 빈도 (며칠) | **동의 강도** |
| 역코딩 | ❌ | ❌ | **✅ (5문항)** |
| D+N 자동 권유 | D+7 | D+14 | **D+30** |
| 위기 게이트 | PHQ-9 item9≥1 → C-SSRS 자동 escalate | 없음 | 없음 |
| 단축형 스크리닝 | PHQ-2 (온보딩) | GAD-2 (온보딩) | **없음** |

방향성 분기는 한 줄 — `app/recovery-trace/index.tsx:193`의 `const lowerIsBetter = instrument !== 'RSE'`. 변화 태그 색(가벼워졌어/무거워졌어) 결정에 그대로 반영.

---

## 6. 의도 — 왜 자존감 척도를 회복 추적에 넣었나

### 30일 타이밍 (`utils/assessmentTrigger.ts:6`)
> "D+30 ± 2일 → RSE 권유"

심각한 우울·불안이 어느 정도 안정된 후 **자존감 회복이 시작되는 후기 회복 단계**가 D+30 시점이라는 임상적 가정.

### 후기 회복의 핵심 (`docs/psychology-logic/심리검사.md:77`)
> "이별 후 헤어진 연인을 끊임없이 곱씹는 패턴은 회복을 지연시키는 핵심 요인"

→ 반추(rumination) 감소 + 자존감 회복이 후기 회복 단계의 목표. RSE는 그 회복을 측정하는 도구.

### 비노출 정책 (`utils/scoring.ts:3-5`)
> "raw_score / band은 *내부 데이터*. UI 노출 시 항상 메타포 함수만 사용. 'PHQ-9 18점, 중등도 우울' 같은 진단성 표현 금지"

### 톤 정합 (`CLAUDE.md:17-18`)
- 판단 문구: 결과 화면 "정답이 아니야" 필수
- 방향 변화 비난·판단 금지 → RSE 낮은 경우에도 "결이 무거워졌어"의 **사실 표현만**

---

## 7. 미흡한 점

| # | 항목 | 영향 |
|---|---|---|
| 1 | **Phase H 강화 톤 부재** | PHQ-2/GAD-2 양성 사용자에 PHQ9·GAD7는 강화된 카피가 있으나 RSE는 무관 (`utils/assessmentTrigger.ts:76` 주석) |
| 2 | **단축형(RSE-2) 미구현** | 온보딩 빠른 스크리닝 불가 — 전체 10문항만 존재 |
| 3 | **페르소나 피드백 고립** | RSE low 사용자(자존감 저하)에 맞춤 질문 경로·AI 프롬프트 분기 없음 |
| 4 | **위기 신호 미포함** | RSE 점수 자체는 안전 게이트와 무관 — 자해사고는 PHQ-9 item9·C-SSRS 책임 |

---

## 관련 파일

| 영역 | 경로 |
|---|---|
| 점수 산출 | `utils/scoring.ts:80-94` `scoreRSE` |
| 역코딩 | `utils/scoring.ts:135-139` `reverseRSE` |
| 메타포 | `utils/scoring.ts:171-177` `bandMetaphor('RSE', band)` |
| 검사 화면 | `app/assessments/[instrument].tsx` |
| 결과 화면 | `app/recovery-trace/index.tsx:88-94` |
| 권유 트리거 | `utils/assessmentTrigger.ts:55-61` |
| 권유 카드 | `components/AssessmentRecommendationCard.tsx:40-62` |
| 데이터 저장 | `api/assessments.ts:50-53`, 마이그 030 |
| 문항 본문 | `resources/assessment-items.json` |
