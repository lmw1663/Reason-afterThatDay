# _shared-components.md — 공유 컴포넌트 단일 명세 (Single Source of Truth)

> **목적**: 여러 항목에서 사용되는 컴포넌트의 사양을 *한 곳에*만 정의.
> 각 항목 파일에서는 이 파일의 사양을 참조만 한다 — 분기/중복 정의 금지.
>
> **단일 권위 원칙**: 컴포넌트 사양 변경 시 **반드시 이 파일에서만** 변경.
> 항목 파일들은 자동으로 일관성 유지.

---

## 1. `BreathingGuide` 컴포넌트

**사용처** (2곳):
- [6-3 Day 1](6-3-cooling-day-content.md) — 안정용 (`pattern="deep"`, 36초)
- [6-5 떠오름 진입점](6-5-intrusive-memory.md) — 진정용 (`pattern="quick"`, 8초)

**Props 인터페이스**:
```typescript
// components/BreathingGuide.tsx
interface BreathingGuideProps {
  pattern: "quick" | "deep";
  onComplete?: () => void;
}
```

**사양** (변경 시 6-3 Day 1과 6-5 모두 검토):
```typescript
const PATTERNS = {
  // 떠오름 진정용 — 짧은 1회 (6-5)
  quick: {
    cycles: 1,
    inhale: 3,    // 들이쉬기 3초
    hold: 2,      // 멈춤 2초
    exhale: 3,    // 내쉬기 3초
    totalDuration: 8  // 약 8초
  },
  // Day 1 안정용 — 긴 3회 반복 (6-3)
  deep: {
    cycles: 3,
    inhale: 4,
    hold: 4,
    exhale: 4,
    totalDuration: 36  // 36초
  }
};
```

**사용 예시**:
```typescript
<BreathingGuide pattern="quick" onComplete={() => setStep(2)} />
<BreathingGuide pattern="deep" />
```

**변경 시 영향 받는 항목**:
- [6-3-cooling-day-content.md](6-3-cooling-day-content.md) — Day 1 화면
- [6-5-intrusive-memory.md](6-5-intrusive-memory.md) — 떠오름 모달 1단계

---

## 2. `CoolingOffWarningModal` 컴포넌트

**사용처** (2곳):
- [6-6 D+7 게이트](6-6-time-gate.md) — `context="analysis"`
- [6-11 자기 성찰](6-11-self-reflection.md) — `context="self_reflection"`

**Props 인터페이스**:
```typescript
// components/CoolingOffWarningModal.tsx
interface CoolingOffWarningModalProps {
  visible: boolean;
  day: number;                                  // D+N (breakup_date 기준)
  context: "analysis" | "self_reflection";       // 6-6 or 6-11
  onProceed: () => void;
  onCancel: () => void;
}
```

**Day별 메시지 매핑** (반말 톤):
```typescript
const MESSAGES_BY_CONTEXT_DAY = {
  analysis: {
    1: "지금은 감정이 가장 출렁이는 시점이야. 분석보다 휴식이 필요할 수도 있어. 그래도 할래?",
    2: "아직 결정이 흔들리는 시점인 것 같아. 일주일 정도 더 기다린 후 분석하는 게 정확할 거야.",
    3: "분노 단계일 수도 있는 시점이야. 지금의 분석이 나중에 다르게 보일 수 있어. 혹시 미뤄볼까?",
    4: "슬픔이 가장 깊은 시점이야. 객관적인 분석이 어려울 수 있어. 기다려줄 수 있어?",
    5: "거의 다 왔어. 아직 3일 남았으니 이 분석은 나중에 해도 좋아.",
    6: "내일이면 일주일이야. 내일 확인한 후 분석해도 늦지 않아.",
    7: "오늘이 마지막 날이야. 유예가 끝난 후 분석해도 충분해.",
  },
  self_reflection: {
    1: "아직 너 자신을 깊이 묻기엔 일러. 첫 24시간은 그냥 지나가도 돼. 그래도 둘러볼래?",
    2: "감정이 출렁이는 시점이야. 자기 인식은 좀 더 안정된 후가 좋아. 그래도 들어갈래?",
    3: "분노 단계일 수 있는 시점이야. 지금 자신에 대한 답이 나중에 다르게 보일 수 있어.",
    4: "슬픔이 깊은 시점이야. 자기 비난으로 흐를 수 있어. 일주일 후가 더 좋아.",
    5: "거의 다 왔어. 3일만 더 기다려봐.",
    6: "내일이면 일주일이야. 내일부터 자기 성찰 가능해.",
    7: "오늘이 마지막 날이야. 내일부터 정상 진입.",
  }
};
```

**모달 UI 사양**:
```
┌──────────────────────────────┐
│ 혹시 너무 서둘렀나?          │
├──────────────────────────────┤
│ [Day별 메시지]               │
│ (위 매핑에서 가져옴)         │
│                              │
│ ✓ 이 분석은                  │
│   7일째에 정확해질 거야.     │
│                              │
│ [잠깐, 돌아갈게]  [계속할게]│
└──────────────────────────────┘
```

**강제 차단 vs 권고**:
- ❌ **강제 차단 금지** (CLAUDE.md 자율성 존중)
- ✅ **권고만** — 사용자가 "계속할게"라고 하면 진입 허용

**사용 예시**:
```typescript
// 6-6 분석/나침반 진입 시
<CoolingOffWarningModal
  visible={showCoolingoffWarning}
  day={daysSinceBreakup}
  context="analysis"
  onProceed={() => setShowCoolingoffWarning(false)}
  onCancel={() => router.back()}
/>

// 6-11 자기 성찰 진입 시
<CoolingOffWarningModal
  visible={showCoolingOff}
  day={daysSinceBreakup}
  context="self_reflection"
  onProceed={() => setShowCoolingOff(false)}
  onCancel={() => router.back()}
/>
```

**변경 시 영향 받는 항목**:
- [6-6-time-gate.md](6-6-time-gate.md)
- [6-11-self-reflection.md](6-11-self-reflection.md)

---

## 3. 신규 컴포넌트 일람 (단일 사용 — 참조용)

각 항목 파일 내에 사양 정의됨. 향후 재사용 시 이 표 갱신:

| 컴포넌트 | 정의 위치 | 사용처 | 재사용 가능성 |
|---------|---------|--------|-------------|
| `IntrusiveMemoryModal` | [6-5](6-5-intrusive-memory.md) | 홈 🫧 버튼 | 단일 |
| `EmotionalCheckModal` | [7-4](7-4-emotional-safety.md) | 위기 신호 감지 시 | 단일 |
| `ReflectionCard` | [6-11](6-11-self-reflection.md) | /about-me 그리드 | 단일 |
| `ReflectionDisplay` | [6-11](6-11-self-reflection.md) | 이전 답변 표시 | 단일 |
| `CoolingSourceReflections` | [6-11](6-11-self-reflection.md) | cooling_day5/6 답변 표시 | 단일 |
| `ErrorToast` | [7-3](7-3-error-retry.md) | 분석/나침반/졸업 실패 | 향후 확장 가능 |
| `MindfulnessText` | [6-5](6-5-intrusive-memory.md) | 떠오름 모달 2단계 | 단일 |

**향후 재사용 시 처리**:
- 두 곳 이상에서 사용하게 되면 → 이 파일의 §1, §2 형식으로 옮김
- 단일 사용 유지 → 정의 위치 그대로

---

## 4. 공유 enum / 상수

여러 곳에서 import하는 상수들:

### `EMOTION_LABELS` (12개)

**정의 위치**: [6-1-emotion-layers.md](6-1-emotion-layers.md)

**사용처**:
- 6-1: 일기 작성 라벨 입력
- 7-1: draft 인터페이스 `mood.moodLabel`
- 7-2: 미니 모드 (선택사항)
- 6-1 hook: "자존감 흔들림" 감지

```typescript
export const EMOTION_LABELS = [
  "분노", "배신감", "슬픔", "그리움",
  "죄책감", "안도", "자유로움",
  "외로움", "충격", "멍함",
  "자존감 흔들림", "혼란", "허무"
] as const;
```

### `PHYSICAL_SIGNALS` (4개)

**정의 위치**: [6-1-emotion-layers.md](6-1-emotion-layers.md)

**사용처**:
- 6-1: 일기 작성 신체 신호 입력
- 7-1: draft 인터페이스 `mood.physicalSignals`

```typescript
export const PHYSICAL_SIGNALS = [
  "sleep_disturbance",
  "appetite_change",
  "dazed",
  "frequent_crying"
] as const;
```

### `STRENGTH_LABELS` (12개)

**정의 위치**: [6-11-self-reflection.md](6-11-self-reflection.md)

**사용처**: 6-11 카테고리 4 (강점 발견)만

```typescript
export const STRENGTH_LABELS = [
  "친절함", "유머", "책임감",
  "공감력", "성실함", "창의성",
  "포용력", "정직함", "인내심",
  "적극성", "차분함", "솔직함"
] as const;
```

### `DurationRange` (5종)

**정의 위치**: [6-0-onboarding-duration.md](6-0-onboarding-duration.md)

**사용처**:
- 6-0: 온보딩 입력
- 6-3 Day 4: 메타 메시지 톤 분기
- 6-9: 졸업 작별 GPT 프롬프트
- 6-11: 카테고리 1, 5 맥락화

```typescript
type DurationRange = "under_1y" | "1_to_3y" | "3_to_5y" | "over_5y" | "skip";
```

---

## 5. 공유 헬퍼 함수

### `getDaysSinceBreakup()`

**정의 위치**: 기존 코드 (Phase 1에서 구현됨)
**사용처**: 거의 모든 항목 (6-1 hook, 6-3, 6-6, 6-7, 6-11, 7-4)
**기준**: `breakup_date` (CLAUDE.md "D+N 전역 표시" 규칙)

### `applyDurationContext(question, duration)`

**정의 위치**: [6-0-onboarding-duration.md](6-0-onboarding-duration.md)
**사용처**: 6-11 (메인 질문 맥락화), 6-3 Day 4, 6-9
**구현**: 6-0 파일 참조

### `updateReflection(category, newData)`

**정의 위치**: [6-11-self-reflection.md](6-11-self-reflection.md)
**사용처**: 6-11 그리드 화면
**기능**: is_current 패턴으로 변경 이력 보존

### `mergeOrCreateReflection(category, data, source)`

**정의 위치**: [6-11-self-reflection.md](6-11-self-reflection.md) (또는 6-3)
**사용처**: 6-3 Day 5/6 hook
**기능**: source별로 별도 row 관리 (manual vs cooling_day5/6)

### `useEmotionalSafety()` Hook

**정의 위치**: [7-4-emotional-safety.md](7-4-emotional-safety.md)
**사용처**: 홈 화면 / 일기 화면 (위기 신호 체크)

---

## 변경 시 체크리스트

이 파일의 사양을 변경할 때 **반드시** 다음 확인:

- [ ] 변경한 컴포넌트/상수의 모든 사용처 파일 확인 (위 §1~§5의 "사용처" 섹션 참조)
- [ ] 사용처 파일들의 코드 예시가 새 사양과 일치하는지 검토
- [ ] 항목 파일에서 props/타입을 직접 정의하지 않았는지 (이 파일만 권위)
- [ ] [VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md)의 "변경 시 동기화 체크" 통과

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- ✅ [VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md) — 동기화 체크 섹션 포함
