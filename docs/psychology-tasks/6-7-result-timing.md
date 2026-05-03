# 6-7. 진단 결과에 시간성 명시 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성 없음, UI/메시지만)
> **마이그레이션**: 없음
> **출처**: `TODO(psychology).md` 라인 1569-1711

---

**심리학 근거**
- 고정 마인드셋 방지 (Fixed Mindset)
- 결정 후회(buyer's remorse) 감소
- 반추 방지

**문제**

현재:
```
/analysis/result
├─ Meter: "재결합 가망 35%"
├─ Meter: "극복 가능 67%"
└─ 진단 문구 ("정답이 아니야" 포함)

이 수치가 마치 "영원한 진단"처럼 느껴짐.
사용자 머릿속: "내 회복 가망은 35%네" (고정)
```

**개선 방향**

모든 진단 결과에 **"이 수치는 D+N 시점의 너야"** 메시지 반드시 추가.

### 구현 방식

**수정 대상 화면**

1. `/analysis/result` (가망 진단)
2. `/compass/needle` (나침반 verdict)

**추가할 메시지** (반말 톤 일관성 — "너야 + 거예요" 혼용 금지)

```
"이 수치는 D+{현재날짜} 시점의 너야.
한 달 뒤엔 다른 결과가 나올 거야."

변수:
- D+N: breakup_date에서 현재까지의 일수
- "한 달 뒤": 정확히 30일 후 또는 다시 분석 가능 시점
```

**구현 예시**

```typescript
// screens/analysis/result.tsx

const ResultScreen = () => {
  const daysSinceBreakup = getDaysSinceBreakup();

  return (
    <ScreenWrapper>
      <MeterCard
        title="재결합 가망"
        value={reconnectPct}
      />
      <MeterCard
        title="극복 가능"
        value={healPct}
      />

      {/* 기존 진단 텍스트 */}
      <Text style={styles.diagnosis}>
        "너의 관계는... (기존 내용)"
      </Text>

      {/* ✨ 신규: 시간성 명시 */}
      <Box style={styles.timingNotice}>
        <Text style={styles.timingText}>
          "이 수치는 D+{daysSinceBreakup} 시점의 너야.
           한 달 뒤엔 다른 결과가 나올 거야."
        </Text>
      </Box>

      {/* "정답이 아니야" 문구 (기존) */}
      <Text style={styles.disclaimer}>
        "정답이 아니야. 너의 감정만 정답이야."
      </Text>
    </ScreenWrapper>
  );
};
```

**나침반 verdict 메시지에도 추가** (반말 톤)

```typescript
// screens/compass/needle.tsx

const NeedleScreen = () => {
  const daysSinceBreakup = getDaysSinceBreakup();

  // verdict에 따른 메시지 (반말 일관성)
  const verdictMessages = {
    strong_catch: "잡고 싶다는 마음이 크네.",
    lean_catch: "보내고 싶지만, 아직 미련이 있네.",
    undecided: "지금은 결정하기 어려운 시점이야.",
    lean_let_go: "보내고 싶다는 생각이 커지고 있어.",
    strong_let_go: "보내는 것이 맞다고 느껴져?"
  };

  return (
    <ScreenWrapper>
      {/* 바늘 시각화 */}
      <SVGNeedle verdict={verdict} />

      {/* 진단 문구 */}
      <Text>{verdictMessages[verdict]}</Text>

      {/* ✨ 신규: 시간성 명시 */}
      <Box style={styles.timingNotice}>
        <Text>
          "이 나침반은 D+{daysSinceBreakup} 시점의
           너를 가리키고 있어.
           한 달 뒤엔 다르게 가리킬 수도 있어."
        </Text>
      </Box>

      {/* "정답이 아니야" */}
      <Text style={styles.disclaimer}>
        "정답이 아니야. 너의 마음이 정답이야."
      </Text>
    </ScreenWrapper>
  );
};
```

**UI 스타일**

timingNotice 박스:
- 배경색: 부드러운 강조색 (노란색/파란색 톤)
- 아이콘: ⏰ 또는 📅
- 텍스트 크기: 14px (작지만 눈에 띔)
- 테두리: 둥근 모서리, 경계선 1px

**구현 순서**
1. `getDaysSinceBreakup()` 함수 재확인
2. `/analysis/result` 메시지 추가
3. `/compass/needle` 메시지 추가
4. 스타일 통일 (디자인 시스템에 맞춤)
5. 테스트 (다양한 D+N에서 메시지 정확성 확인)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-2](6-2-affection-axis.md) (verdict 7종 확장)
