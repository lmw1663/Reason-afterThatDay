# 6-2. 방향 선택에 원망↔애정 수평축 추가 🟡 P1-B

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-B (의존성: 6-1 mood_label과 함께 입력)
> **마이그레이션**: 007
> **출처**: `TODO(psychology).md` 라인 420-630

---

**심리학 근거**
- 양가감정(ambivalence)의 임상적 구분
- **Bowlby 애착이론**: 분리 항의(separation protest) 시 동시에 여러 감정 공존

**문제 상황**

현재 앱은 **수직축(잡기↔보내기)**만 묻음:

```
방향 선택
├─ 잡고싶어 (catch)
├─ 보내고싶어 (let_go)
└─ 모르겠어 (undecided)
```

하지만 심리학적으로 이별 후 마음은 **2개 축**으로 작동:

```
                  보내고 싶다
                       │
   미워하면서 ─────────┼───────── 좋아하면서
                       │
                  잡고 싶다
```

**현재 앱이 구분 못하는 4가지 임상 상태**

| 상태 | 심리적 의미 | 위험도 | 처치 |
|------|-----------|-------|------|
| 보내고 싶지만 여전히 좋아함 | 건강한 수용 진입 | 낮음 | 축하 & 미래 리마인드 |
| 보내고 싶고 미움도 큼 | 분노 단계 통과 중 | 낮음 | "분노도 정상"이라고 정상화 |
| **잡고 싶지만 미워함** | **상호의존/집착 위험** | **높음** | **⚠️ 특별 개입 필요** |
| 잡고 싶고 좋아함 | 미해결 애착 | 중간 | 장기 회복 신호 → 심사숙고 권고 |

**구현 방식**

`/journal/direction` (또는 `/compass/want`) 화면 구조 개편:

```
현재 UI:
  버튼 3개 (잡고싶어 / 보내고싶어 / 모르겠어)

개편 후 UI:
  [수직축] 버튼 3개 유지
           ↓
  [수평축] 슬라이더 1개 추가
  "지금 상대를 어떻게 느껴?"
  [완전히 미워 ←────○────→ 여전히 좋아]
           0         5         10
           
  위험 신호 자동 감지:
  수평축 < 3 && 수직축 == "catch" → 집착 위험 신호
  → Day 7 이전에 경고 없음. 7일 유예 중에만 "분노도 정상"이라고 반복
```

**기술 스펙**
- 슬라이더: `0~10` 범위, step=1, 라벨 "완전히 미워" / "여전히 좋아"
- 저장: `journal_entries.affection_level` INT 필드 추가 (NULL 허용 — 마이그레이션 전 데이터 호환)
- 마이그레이션 007:
  ```sql
  -- migrations/007_affection_level.sql
  ALTER TABLE public.journal_entries
    ADD COLUMN affection_level INT
    CHECK (affection_level IS NULL OR affection_level BETWEEN 0 AND 10);

  -- 기존 RLS 그대로 상속
  ```

**나침반 verdict 결합 알고리즘 (Opus 검증 누락 4 수정)**

기존 `07-logic-rules.md`의 `diff = wantA - wantB` 시스템과 통합:

```typescript
// 기존: diff (수직축) → 5종 verdict
// 신규: diff + affection_level (수평축) → 7종 verdict

function determineVerdict({
  diff,                  // wantA - wantB (수직축)
  affectionLevel,        // 0~10 (수평축, 신규)
}: {
  diff: number;
  affectionLevel: number | null;
}): Verdict {
  // 기존 호환: affection_level이 null이면 5종 verdict로 폴백
  if (affectionLevel === null) {
    if (diff > 3) return "strong_catch";
    if (diff < -3) return "strong_let_go";
    if (Math.abs(diff) <= 1) return "undecided";
    return diff > 0 ? "lean_catch" : "lean_let_go";
  }

  // 신규 7종 verdict
  if (diff > 3) {
    // 잡고 싶음
    if (affectionLevel <= 3) return "DANGER_OBSESSION";  // 잡기+미움 → 위험
    return "strong_catch";                                // 잡기+애정
  }

  if (diff < -3) {
    // 보내고 싶음
    return "strong_let_go";  // 애정 수준 무관 (보내려는 의지 강함)
  }

  if (Math.abs(diff) <= 1) {
    // 모르겠음 — affection_level로 분화
    if (affectionLevel >= 7) return "undecided_with_love";
    if (affectionLevel <= 3) return "undecided_with_resentment";
    return "undecided";  // 중간값
  }

  // -3 < diff < -1 또는 1 < diff < 3 (약한 방향성)
  return diff > 0 ? "lean_catch" : "lean_let_go";
}
```

**중요: "DANGER_OBSESSION"은 내부 분류명** (CLAUDE.md "비난 금지" 원칙)
- DB/코드에는 `DANGER_OBSESSION` enum 값 사용
- **사용자에게 보여지는 메시지에는 절대 "위험"/"DANGER" 표현 사용 금지**
- 대신 정상화 톤: "잡고 싶은 마음과 미운 마음이 동시에 있는 거 같아. 그럴 수 있어. 7일 유예 동안 차분히 살펴보자."

**기존 데이터 마이그레이션**:
- 기존 일기들은 `affection_level = NULL`로 두기
- 신규 일기 입력 시부터 affection_level 수집
- 7종 verdict는 affection_level이 있는 일기에만 적용
- 통계/차트는 5종 + 7종 혼합 처리 (UI 별도 로직 필요)

**나침반 Verdict 개선**

현재 5종 verdict → 새로운 7종으로 확장:
```
strong_catch         → 그대로 (잡기 + 애정 높음)
lean_catch           → 그대로 (잡기 약함 + 애정 높음)
undecided            → 2가지로 분화:
                       - undecided_with_love (모름 + 애정 높음 — 혼란 중)
                       - undecided_with_resentment (모름 + 미움 높음 — 분노 중)
lean_let_go          → 그대로 (보내기 약함 + 미움 높음)
strong_let_go        → 그대로 (보내기 + 미움 높음)
DANGER_OBSESSION     → 신규 (잡기 + 미움 높음 — 집착 위험)
```

**메시지 맞춤화** (반말 톤 일관성)

나침반 결과 메시지에 affection_level 반영:
```
verdict: lean_let_go, affection_level: 7
메시지: "보내고 싶다는 생각이 늘고 있는데, 여전히 그 사람이 소중하네.
        그런 마음으로 보내는 것이 가장 건강한 이별이야."

verdict: undecided_with_resentment, affection_level: 2
메시지: "지금은 분노 단계를 통과 중인 것 같아.
        미움이 가득하고 해결이 안 되는 것처럼 느껴지겠지.
        이 감정도 정상적인 과정이야. 함께 견뎌보자."
```

**회복 진행 신호 메시지 (Opus 검증 누락 2 추가)**

psychology-analysis §3 의 "잡고 싶다는 마음이 줄고, 원망도 줄고 있어요" 효과 구현.

이전 7일과 비교해서 변화가 있으면 추가 메시지 표시:

```typescript
// 최근 7일의 affection_level + diff 평균을 비교
async function generateProgressMessage(userId: string): Promise<string | null> {
  const last7 = await getRecentEntries(userId, 7);
  const previous7 = await getEntriesBefore(userId, 7, 14);

  if (last7.length < 3 || previous7.length < 3) return null;  // 데이터 부족

  const recentAvgAffection = avg(last7.map(e => e.affection_level).filter(Boolean));
  const previousAvgAffection = avg(previous7.map(e => e.affection_level).filter(Boolean));

  const recentAvgDiff = avg(last7.map(e => e.want_diff));
  const previousAvgDiff = avg(previous7.map(e => e.want_diff));

  // 미움 줄어듦 + 잡고싶음 줄어듦 = 건강한 진행
  if (recentAvgAffection > previousAvgAffection + 1 &&
      recentAvgDiff < previousAvgDiff - 1) {
    return "최근 일주일을 보면, 미움도 잡고싶음도 줄고 있어. 건강한 회복의 신호야.";
  }

  // 잡고싶음만 줄어듦 = 거리두기 진행
  if (recentAvgDiff < previousAvgDiff - 2) {
    return "잡고 싶은 마음이 점점 줄고 있어. 너 스스로의 속도로 보내고 있는 거야.";
  }

  // 미움 줄어듦 = 분노 단계 통과
  if (recentAvgAffection > previousAvgAffection + 2) {
    return "원망의 마음이 점점 줄고 있어. 분노 단계를 잘 지나오고 있어.";
  }

  return null;  // 의미있는 변화 없음 → 메시지 생략
}
```

이 메시지는 `/compass/needle` 또는 `/compass/action` 화면 하단에 노출.

**UI/UX**
- 슬라이더 선택 후 수직축 선택 순서 (먼저 느낌, 다음 의도)
- 슬라이더 좌우에 이모지/아이콘으로 감정 상태 시각화
- 선택 후 "너의 마음이 정상이야"라는 한 줄 피드백

**구현 순서**
1. `journal_entries.affection_level` 필드 추가 (마이그레이션 007)
2. `/journal/direction` 또는 `/compass/want` UI 수정 (슬라이더 추가)
3. 나침반 verdict 계산 로직 확장 (`07-logic-rules.md` 업데이트)
4. 나침반 메시지 템플릿 다양화

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-1](6-1-emotion-layers.md) (mood_label과 함께 입력)
- 🔗 활용: [6-7](6-7-result-timing.md) (verdict 메시지 시간성)
