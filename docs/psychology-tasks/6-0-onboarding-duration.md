# 6-0. 온보딩 확장: 연애 기간 질문 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성 없음, 6-11과 6-3에 데이터 제공)
> **마이그레이션**: 015
> **출처**: `TODO(psychology).md` 라인 84-271

---

**심리학 근거**
- **맥락화의 힘**: "1년 8개월"이라는 구체적 정보는 질문/메시지를 *너의 이야기*로 만듦
- 단기/중기/장기 연애는 회복 작업의 깊이가 달라짐 — 메시지 톤 차별화 가능
- 6-11 자기 성찰 트랙 (카테고리 1, 5)에서 활용

**현재 상태**

```
/onboarding/index → /onboarding/mood → /(tabs)
   (이별 날짜)        (감정 다중 선택)
```

연애 기간 정보 없음 → 메시지가 일반화됨 ("그 관계").

**개선 방향**

3단계로 확장 — 자연스러운 흐름 (이별 날짜 → 그 전 연애 기간 → 현재 감정):

```
/onboarding/index → /onboarding/duration → /onboarding/mood → /(tabs)
   (이별 날짜)        (연애 기간, 신규)      (감정)
```

**`/onboarding/duration` 화면 사양**

```
화면 구성:
┌─────────────────────────────┐
│ Step 2/3                    │
├─────────────────────────────┤
│ 그 사람이랑                 │
│ 얼마나 만났어?              │
│                             │
│ ○ 1년 미만                  │
│ ○ 1년 ~ 3년                 │
│ ○ 3년 ~ 5년                 │
│ ○ 5년 이상                  │
│ ○ 말하기 어려워 (skip)      │
│                             │
│ [다음]                      │
└─────────────────────────────┘
```

**왜 범위형인가**:
- 정확한 개월 수 강제하면 첫 진입에서 부담
- 심리학적으로 "단기/중기/장기" 구분만 의미 있음
- 더 정확한 수치는 사용자가 나중에 수정 가능 (설정 화면에서)

**범위 → 개월 변환**:
```typescript
type DurationRange = "under_1y" | "1_to_3y" | "3_to_5y" | "over_5y" | "skip";

const RANGE_TO_MONTHS_APPROX: Record<DurationRange, number | null> = {
  under_1y: 6,    // 중간값
  "1_to_3y": 24,
  "3_to_5y": 48,
  over_5y: 72,
  skip: null      // 사용 안 함
};
```

**DB 스키마 (마이그레이션 015)**

```sql
-- migrations/015_relationship_duration.sql
-- public.users 테이블 (auth.users 참조)에 컬럼 추가
ALTER TABLE public.users
  ADD COLUMN relationship_duration_range TEXT
    CHECK (relationship_duration_range IN
      ('under_1y', '1_to_3y', '3_to_5y', 'over_5y', 'skip')
      OR relationship_duration_range IS NULL);

-- 기존 public.users RLS 정책 그대로 상속 (별도 정책 불필요)
```

**`relationship_duration_months` 필드 제거 결정** (V3-6 데드 필드 결함 수정):
- 설정 화면이 현재 앱에 없음 → 활용 경로 없는 데드 필드
- 범위(`relationship_duration_range`)만으로 충분함 (메시지 톤 분기, 맥락화)
- 향후 정확한 개월 수가 필요하면 별도 항목(예: 6-12 설정 화면)에서 추가

**useUserStore 영향** (V3-12 결함 수정):

```typescript
// stores/useUserStore.ts (기존 + 신규)
interface UserState {
  // 기존
  breakupDate: string | null;
  daysElapsed: number;
  onboardingCompleted: boolean;
  pushToken: string | null;

  // 신규 (6-0)
  relationshipDuration: DurationRange | null;
  setRelationshipDuration: (d: DurationRange) => Promise<void>;
}

// Zustand persist 사용 — 앱 재시작 후에도 유지
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // ...
      relationshipDuration: null,  // 옵셔널 (TypeScript strict 호환)
      setRelationshipDuration: async (d) => {
        set({ relationshipDuration: d });
        // public.users 테이블에도 upsert
        await supabase.from('users').update({
          relationship_duration_range: d
        }).eq('id', user.id);
      },
    }),
    { name: 'user-store' }
  )
);
```

기존 코드 영향: 없음 (옵셔널 필드 추가 — 기존 사용자는 `null`).

**연애 기간 맥락화 헬퍼** (`applyDurationContext`):

```typescript
// utils/duration-context.ts
const RANGE_LABEL = {
  under_1y: "1년이 안 되는",
  "1_to_3y": "1~3년 동안",
  "3_to_5y": "3~5년 동안",
  over_5y: "5년 넘게",
  skip: null
};

export function applyDurationContext(
  question: string,
  duration: DurationRange | null
): string {
  if (!duration || duration === 'skip') return question;
  const label = RANGE_LABEL[duration];
  if (!label) return question;
  // "연애할 때 너는 어떤 사람이야?" → "1~3년 동안 연애한 너는 어떤 사람이야?"
  return question.replace("연애할 때", `${label} 연애한`);
}
```

**활용 지점 (5곳)**

1. **6-11 자기 성찰 트랙 카테고리 1 (연애에서의 나)**
   ```
   "1년 8개월 동안 연애한 너에 대해, 어떤 사람이었어?"
   ```
2. **6-11 카테고리 5 (연애 중 자기 돌봄)**
   ```
   "1년 8개월 동안 어떤 방법들이 너에게 도움됐어?"
   ```
3. **6-3 Day 4 (감정 차트 메타 메시지)**
   ```
   장기 연애(3년+): "5년의 관계가 끝난 거니까, 슬픔이 깊은 게 당연해."
   단기 연애(<1년): "짧았지만 진심이었던 마음. 깊이는 시간이 만드는 게 아니야."
   ```
4. **6-9 졸업 작별 GPT 프롬프트**
   ```
   장기 연애: "5년의 시간을 마무리하는 너의 한 줄..."
   ```
5. **D+N 표시와 함께** (홈 화면)
   ```
   "5년의 관계, D+42"  (장기 연애만)
   "D+42"             (단기 또는 skip 시)
   ```

**메시지 톤 분기**

| 범위 | 회복 작업 깊이 | 메시지 톤 |
|------|--------------|---------|
| 1년 미만 | 가벼운 슬픔 | "짧았지만 진심이었어" |
| 1~3년 | 일반적 회복 | (기본 톤) |
| 3~5년 | 정체성 통합 | "긴 시간이었어. 천천히 가도 돼." |
| 5년 이상 | 가치관 재정립 | "5년이라는 시간은 너를 많이 키웠을 거야." |

**구현 순서**

1. 마이그레이션 015 (`public.users` 테이블 확장 — `relationship_duration_range`만)
2. `/onboarding/duration` 화면 생성 (Step 2/3 표기)
3. `/onboarding/index` → "Step 1/3" 표기 변경 + `push('/onboarding/duration')` 변경
4. `/onboarding/mood` → "Step 3/3" 표기 변경, `replace('/(tabs)')`은 그대로
5. `useUserStore`에 `relationshipDuration: DurationRange | null` 추가 (Zustand persist 적용)
6. 활용 지점 5곳에 데이터 연결

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 활용 항목: [6-3](6-3-cooling-day-content.md), [6-9](6-9-graduation-farewell.md), [6-11](6-11-self-reflection.md)
