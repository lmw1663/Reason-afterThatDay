# 6-1. 일기 감정 입력 다층화 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성 없음, 기존 mood_label 활용)
> **마이그레이션**: 006
> **출처**: `TODO(psychology).md` 라인 272-419

---

**심리학 근거**
- Kübler-Ross 5단계(부정→분노→타협→우울→수용) 정상화
- UCLA Lieberman의 정서 라벨링(affect labeling) 효과 — 편도체 활성 저하

**현재 상태**
```
감정 온도 1~10 + 방향 선택(잡고싶어/보내고싶어/모르겠어) = 감정 스펙트럼 부족
```

실제 필요한 감정 처리 (psychology-analysis §2 7가지 핵심 감정 모두 커버):
| 원본 감정 카테고리 | 라벨 매핑 | 라벨 체크 |
|------------------|---------|----------|
| 분노/배신감 | 분노, 배신감 | ✅ 2개 라벨 |
| 죄책감/자책 | 죄책감 | ✅ |
| 안도감 | 안도 | ✅ |
| 충격/현실 부정 | 충격, 멍함 | ✅ 2개 라벨 |
| 외로움 vs 자유로움의 양가성 | 외로움, 자유로움 | ✅ 2개 라벨 (동시 선택 가능) |
| 신체 증상 (수면/식욕) | (별도 신체 신호 섹션) | ✅ 체크박스 |
| 자존감 손상 | 자존감 흔들림 | ✅ |
| (보조) | 슬픔, 그리움, 혼란, 허무 | ✅ |

**구현 방식**

`/journal/index`의 흐름을 4단계로 확장 (자유 메모는 기존 위치 유지):

```
1단계: 감정 온도 1~10 슬라이더 (기존 유지)
        ↓
1.5단계: 감정 라벨 다중 선택 Pill (12개)
        [핵심 7가지 + 보조 5가지]
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        | 분노 | 배신감 | 슬픔 | 그리움 |
        | 죄책감 | 안도 | 자유로움 |
        | 외로움 | 충격 | 멍함 |
        | 자존감 흔들림 | 혼란 | 허무 |
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        [다중 선택 허용 — 양가감정 정상화:
         "외로움 + 자유로움 동시에"도 가능]
        ↓
1.6단계: 신체 신호 체크 (선택사항, 건너뛰기 가능)
        □ 잠을 못 잤어
        □ 식욕이 없거나 너무 많아
        □ 멍한 기분이 들어
        □ 자꾸 울음이 나와
        ↓
1.7단계: 자유 메모 (기존 freeText — 위치 유지)
        [텍스트 입력 — 선택사항]
        ↓
2단계부터: 기존 방향 선택 → 질문 → AI 응답 유지
```

**자유 메모 위치 명시**: 기존 `/journal/index`에서 자유 메모 위치는 그대로 유지.
1.5/1.6 단계는 그 *위*에 추가됨. 기존 freeText 행방 명확화 (Opus 검증 누락 5 수정).

**기술 스펙**
- 감정 라벨 Pill: `/onboarding/mood`에서 이미 구현된 다중 선택 Pill 컴포넌트 재사용
- 신체 신호 체크: Checkbox 컴포넌트 (CheckBox 또는 Pressable + Icon)
- 데이터 저장: **기존 컬럼 활용** + 신규 1개만 추가 (마이그레이션 006)

**중요 (V3 검증 결함 C-2 수정)**: `journal_entries.mood_label TEXT[]`이 **이미 존재**.
12개 라벨도 이 기존 컬럼에 저장 (별도 `emotion_labels` 추가 X — 이중 컬럼 방지).

```sql
-- migrations/006_emotion_physical_signals.sql
-- mood_label은 기존 TEXT[] 컬럼 활용 (새 추가 X)
-- physical_signals만 신규 추가
ALTER TABLE public.journal_entries
  ADD COLUMN physical_signals TEXT[] NOT NULL DEFAULT '{}'::text[];

-- 기존 RLS는 public.journal_entries에 이미 적용됨 (002_rls_policies.sql)
-- 별도 정책 불필요
```

- 라벨 enum (12개, 코드에서 검증, 기존 `mood_label TEXT[]`에 저장):
  ```typescript
  export const EMOTION_LABELS = [
    "분노", "배신감", "슬픔", "그리움",
    "죄책감", "안도", "자유로움",
    "외로움", "충격", "멍함",
    "자존감 흔들림", "혼란", "허무"
  ] as const;
  ```
- 신체 신호 enum (4개, 영문 키 — 한글 표시는 i18n 매핑):
  ```typescript
  export const PHYSICAL_SIGNALS = [
    "sleep_disturbance",   // 잠을 못 잤어
    "appetite_change",     // 식욕이 없거나 너무 많아
    "dazed",               // 멍한 기분이 들어
    "frequent_crying"      // 자꾸 울음이 나와
  ] as const;
  ```
- 저장 예시 (실제 DB 컬럼명 사용):
  ```json
  {
    "mood_score": 3,
    "mood_label": ["외로움", "자유로움"],
    "physical_signals": ["sleep_disturbance", "dazed"],
    "free_text": "오늘은 친구를 만나고 왔는데...",
    "direction": "let_go"
  }
  ```

**UI/UX**
- 각 라벨/신호는 선택 후 배경색 변화로 피드백
- 라벨 선택 시 "정상적인 단계야" 한 줄 메시지 표시
- 신체 신호는 "선택사항"이지만, 이후 Day 4의 감정 차트에 "수면 패턴"으로 활용 가능

**hook → 6-11 자기 성찰 연계**

"자존감 흔들림" 라벨 선택 + **D+8 이상**일 때만 → 일기 4단계 끝(`/journal/response`)에 **권유 카드** 노출:

```
┌─────────────────────────────────┐
│ 자존감이 흔들리는 날이네.        │
│                                 │
│ 너 자신에 대해                  │
│ 한 가지만 생각해볼래?           │
│                                 │
│ [나에 대해 알아가기 →]          │
│ [지금은 됐어]                   │
└─────────────────────────────────┘
```

```typescript
// /journal/response 화면에서
const showSelfLoveSuggestion =
  emotionLabels.includes("자존감 흔들림") &&
  getDaysSinceBreakup() >= 8;  // V3-7 결함 수정: D+8 미만에선 노출 X
                                // → 노출하면 만류 모달과 충돌해 사용자 혼란

if (showSelfLoveSuggestion) {
  // 권유 카드 표시 → `/about-me/self_love`로 직접 push
}
```

→ `/about-me/self_love` (자기애 측정 카테고리)로 직접 push.
강제 X — 사용자 자율성 존중. **D+8 미만은 권유 자체 안 함** (self-defeating UX 회피).

**구현 순서**
1. `physical_signals` DB 필드 추가 (마이그레이션 006) — `mood_label`은 기존 활용
2. `/journal/index` UI 수정 (1.5/1.6 단계 추가)
3. `useJournalStore`에 저장 로직 추가
4. Day 4 콘텐츠에서 수면/식욕 변화 차트 연결

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 hook 연계: [6-11](6-11-self-reflection.md) (자존감 흔들림 → 자기애 측정)
- 🔗 데이터 활용: [6-3 Day 4](6-3-cooling-day-content.md) (감정 차트), [7-1](7-1-journal-draft.md) (draft 인터페이스), [7-2](7-2-mini-mode.md) (미니 모드)
