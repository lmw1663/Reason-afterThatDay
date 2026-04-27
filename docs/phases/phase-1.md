# Phase 1 — 온보딩 / 홈 / 이별 일기 / Auth (원문 이관본)

## 1-1. Supabase Auth + useUserStore

**접근 방식**  
익명 가입(`signInAnonymously`) 으로 마찰 최소화. 이별 날짜 입력 후 `users` 테이블에 row 생성.

**생성 파일**
- `api/supabase.ts` — 클라이언트 싱글톤
- `hooks/useAuth.ts`
- `store/useUserStore.ts`

**useUserStore 스니펫**
```ts
// store/useUserStore.ts
interface UserState {
  userId: string | null;
  breakupDate: Date | null;
  daysElapsed: number;  // D+N
  onboardingCompleted: boolean;
  pushToken: string | null;
  setBreakupDate: (date: Date) => void;
}
```

**D+N 계산 방식**
```ts
// utils/dateUtils.ts
// ⚠️ Date.now() - breakupDate.getTime() 방식은 타임존/자정 경계에서 오차 발생
// → 로컬 날짜 기준 day diff로 고정 (기기 타임존 무관하게 "오늘 날짜" 기준)
export function calcDaysElapsed(breakupDate: Date): number {
  const now = new Date();
  // 시각(시/분/초)을 제거하고 로컬 날짜만 비교
  const localNow    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const localBreakup = new Date(
    breakupDate.getFullYear(),
    breakupDate.getMonth(),
    breakupDate.getDate()
  );
  return Math.floor(
    (localNow.getTime() - localBreakup.getTime()) / (1000 * 60 * 60 * 24)
  );
}
// → useUserStore에서 앱 포그라운드 진입 시마다 daysElapsed 갱신
// → breakup_date는 DB에 date 타입으로 저장 (시각 없음) — 서버도 동일 기준
```

**트레이드오프**
- 익명 가입 vs 이메일 가입: 익명 선택 이유 — 이별 직후 사용자에게 회원가입 마찰은 이탈 유발. 추후 이메일 연결(업그레이드) 기능 추가 가능.

---

## 1-2. 온보딩 화면

**파일**
- `app/onboarding/index.tsx` — 이별 날짜 입력 (달력)
- `app/onboarding/mood.tsx` — 지금 기분 멀티 선택

**화면 흐름**: 날짜 입력 → 기분 선택 → 홈으로 이동 (각 화면 ScreenWrapper fadeUp)

**트레이드오프**
- 달력 라이브러리: `@react-native-community/datetimepicker` (Expo 기본 지원) vs `react-native-calendars`. 단순 날짜 1개 선택이므로 기본 datetimepicker 충분.

-- 이건 너가 선택해서 더 이쁜것으로 하고싶어

---

## 1-3. 홈 화면

**파일**
- `app/(tabs)/index.tsx`

**레이아웃 요소**
```
┌─────────────────────────────┐
│  reason   D+47              │  ← D+N 배지 항상 표시
│─────────────────────────────│
│  오늘의 한마디 카드           │  ← ai-daily-quote 응답
│─────────────────────────────│
│  [ 오늘 일기 쓰기 ▶ ]        │  ← 가장 눈에 띄는 CTA
│  작성 완료: 온도 6° ✓        │  ← 작성 후 상태 변경
│─────────────────────────────│
│  관계분석  나침반  추억  리포트 │
└─────────────────────────────┘
```

---

## 1-4. 이별 일기 — 4화면 흐름

**파일**
- `app/journal/index.tsx` — 화면1: 감정 온도 슬라이더 + 뱃지
- `app/journal/direction.tsx` — 화면2: 잡기/보내기/모름 + 이전 선택 비교
- `app/journal/question.tsx` — 화면3: 맥락형 질문 (공유 질문 풀)
- `app/journal/response.tsx` — 화면4: AI 공감 응답
- `app/journal/history.tsx` — 일기 목록
- `app/journal/[id].tsx` — 상세
- `components/ui/MoodSlider.tsx`
- `components/ui/DirectionPicker.tsx`
- `components/ui/ChangeIndicator.tsx`
- `api/journal.ts`
- `store/useJournalStore.ts`

**ChangeIndicator 스니펫**
```tsx
// components/ui/ChangeIndicator.tsx
// 이전 방향과 현재 방향 비교 표시
type Props = { prev: Direction | null; current: Direction };

const LABEL = { catch: '잡고싶다', let_go: '보내고싶다', undecided: '모르겠다' };

export function ChangeIndicator({ prev, current }: Props) {
  if (!prev || prev === current) return null;
  return (
    <Text className="text-gray-400 text-sm mb-3">
      어제는 <Text className="text-purple-400">{LABEL[prev]}</Text>고 했는데, 오늘은?
    </Text>
  );
}
```

**맥락형 질문 선택 로직 (화면3)**
```ts
// hooks/useSmartQuestion.ts
// 규칙:
// 1. direction이 어제와 바뀌면 → "뭐가 마음을 바꿨어?" 질문 우선
// 2. 3일 연속 같은 방향 → "이 마음이 꽤 단단해 보여" 질문
// 3. 그 외 → question_pool에서 context: ['journal'] 중 unseen 질문 1개
```

**트레이드오프**
- AI 응답(화면4)을 동기 대기 vs 비동기 백그라운드: 일기 작성 완료 후 바로 화면4로 이동하고 로딩 스피너 표시가 자연스러움. 타임아웃(5초) 후 fallback 템플릿 응답 표시.

-- 자연스러운 화면이 좋은거 같아.

---

## 1-5. Zustand 스토어 구조

**파일**
- `store/useUserStore.ts`
- `store/useJournalStore.ts`
- `store/useQuestionStore.ts`
- `store/useRelationshipStore.ts`
- `store/useDecisionStore.ts`
- `store/useCoolingStore.ts`

**useJournalStore 스니펫**
```ts
interface JournalState {
  todayEntry: JournalEntry | null;
  entries: JournalEntry[];
  stats: { moodTrend: number[]; directionHistory: Direction[] } | null;
  setTodayEntry: (entry: JournalEntry) => void;
  fetchEntries: () => Promise<void>;
  fetchStats: () => Promise<void>;
}
```

**트레이드오프**
- 스토어별 분리 vs 단일 스토어: 각 도메인이 독립적(일기/질문/결정/유예)이므로 분리가 유지보수에 유리. Zustand는 스토어 간 구독 비용 낮음.
-- 분리로 하자

