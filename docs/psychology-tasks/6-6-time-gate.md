# 6-6. 분석/나침반 D+7 시간 게이트 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성 없음, CoolingOffWarningModal 신규 작성)
> **마이그레이션**: 없음 (UI/로직만)
> **출처**: `TODO(psychology).md` 라인 1446-1568

---

**심리학 근거**
- 이별 직후 2~3주: 인지 처리 능력 저하 (스트레스로 인한 working memory 부하)
- **로시 회상(rosy retrospection)**: D+1~14에 긍정적 기억만 회상
- **반추(rumination)**: 반복적인 분석이 회복 지연

**문제**

현재: 홈에서 바로 `/(tabs)/analysis`, `/(tabs)/compass` 진입 가능.
→ D+1 사용자가 곧바로 "장단점 입력 → 슬라이더 → 진단 결과"를 받음.
→ 진단 수치가 고정되어 반복 분석 가능.

**개선 방향**

D+0~7: 분석/나침반 진입 시 **부드러운 만류** (강제 차단 X, 자율성 존중)
D+8 이상: 정상 진입

### 구현 방식

**진입 게이트 로직**

```typescript
// screens/(tabs)/analysis.tsx (또는 compass/index.tsx)
// D+N은 breakup_date 기준 (CLAUDE.md "D+N 전역 표시" 규칙)

useEffect(() => {
  const daysSinceBreakup = getDaysSinceBreakup();  // breakup_date 기준 D+N

  if (daysSinceBreakup < 8) {
    // D+0~7: 만류 모달 표시
    setShowCoolingoffWarning(true);
  }
}, []);

// 만류 모달 (analysis용 — context: 'analysis')
<CoolingOffWarningModal
  visible={showCoolingoffWarning}
  day={daysSinceBreakup}
  context="analysis"  // 6-11에서는 context="self_reflection"
  onProceed={() => {
    setShowCoolingoffWarning(false);
    // 진입 허용
  }}
  onCancel={() => router.back()}
/>
```

**CoolingOffWarningModal 컴포넌트 사양** (6-6/6-11 공유):

```typescript
interface CoolingOffWarningModalProps {
  visible: boolean;
  day: number;  // D+N (breakup_date 기준)
  context: "analysis" | "self_reflection";  // 6-6 or 6-11
  onProceed: () => void;
  onCancel: () => void;
}

const MESSAGES_BY_CONTEXT_DAY = {
  analysis: {
    1: "지금은 감정이 가장 출렁이는 시점이야. 분석보다 휴식이 필요할 수도 있어. 그래도 할래?",
    2: "아직 결정이 흔들리는 시점인 것 같아. 일주일 정도 더 기다린 후 분석하는 게 정확할 거야.",
    // ... Day 3~7
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

이렇게 6-6과 6-11이 같은 컴포넌트를 *context*로 분기해서 사용 (V3-3 결함 수정).

**Day별 메시지 변화** (반말 톤)

| Day | 메시지 |
|-----|--------|
| 1 | "지금은 감정이 가장 출렁이는 시점이야. 분석보다 휴식이 필요할 수도 있어. 그래도 할래?" |
| 2 | "아직 결정이 흔들리는 시점인 것 같아. 일주일 정도 더 기다린 후 분석하는 게 정확할 거야." |
| 3 | "분노 단계일 수도 있는 시점이야. 지금의 분석이 나중에 다르게 보일 수 있어. 혹시 미뤄볼까?" |
| 4 | "슬픔이 가장 깊은 시점이야. 객관적인 분석이 어려울 수 있어. 기다려줄 수 있어?" |
| 5 | "거의 다 왔어. 아직 3일 남았으니 이 분석은 나중에 해도 좋아." |
| 6 | "내일이면 일주일이야. 내일 확인한 후 분석해도 늦지 않아." |
| 7 | "오늘이 마지막 날이야. 유예가 끝난 후 분석해도 충분해." |

**모달 UI**

```
┌──────────────────────────────┐
│ 혹시 너무 서둘렀나?          │
├──────────────────────────────┤
│ [Day 3 메시지]               │
│ "분노 단계일 수도 있는       │
│  시점이야. 지금의 분석이     │
│  나중에 다르게 보일 수       │
│  있어. 혹시 미뤄볼까?"       │
│                              │
│ ✓ 이 분석은                  │
│   7일째에 정확해질 거야.     │
│                              │
│ [잠깐, 돌아갈게]  [계속할게]│
└──────────────────────────────┘
```

**강제 차단 vs 권고**

- ❌ **강제 차단 금지** (CLAUDE.md 자율성 존중)
- ✅ **권고만** — 사용자가 "그래도 할래"라고 하면 진입 허용

**구현 순서**
1. `getDaysSinceBreakup()` 함수 확인 (이미 있음)
2. `CoolingOffWarningModal` 컴포넌트 작성
3. 분석/나침반 진입점(`/(tabs)/analysis`, `/(tabs)/compass/index`)에 게이트 로직 추가
4. Day별 메시지 배열 정의

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 컴포넌트 공유: [6-11](6-11-self-reflection.md) (CoolingOffWarningModal)
