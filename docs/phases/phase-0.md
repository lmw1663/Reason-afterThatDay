# Phase 0 — 인프라 / DB / 디자인 시스템 (원문 이관본)

## 0-1. Expo 프로젝트 초기화

**접근 방식**  
Expo Router 기반으로 초기화 (`app/` 디렉토리 구조). 기존 React Navigation v6와 함께 쓰는 파일 기반 라우팅.

```bash
npx create-expo-app reason --template expo-template-blank-typescript
cd reason
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install nativewind tailwindcss
```

**생성 파일**
- `app.json` — expo 설정 (bundler: metro, scheme: reason)
- `tsconfig.json` — strict: true
- `tailwind.config.js`
- `global.css`
- `babel.config.js` — nativewind/babel + jsxImportSource
- `metro.config.js` — withNativeWind

**트레이드오프**
| 선택 | 장점 | 단점 |
|------|------|------|
| Expo Router | 파일 기반 라우팅, 딥링크 자동 | React Navigation 직접 제어보다 유연성 낮음 |
| React Navigation v6 직접 | 세밀한 전환 제어 | 보일러플레이트 많음 |

→ **Expo Router 추천**: 화면이 많고(journal, compass, cooling...) 딥링크(푸시 알림 탭 시 특정 화면 이동)가 필요하기 때문.

---

## 0-2. Supabase 프로젝트 + DB 스키마

**접근 방식**  
`supabase/migrations/` 디렉토리에 순번 SQL 파일로 관리. 테이블 생성 + RLS 동시 적용.

**생성 파일**
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_question_pool_seed.sql`

**마이그레이션 001 스니펫**
```sql
-- users 확장 (Supabase Auth uid 기반)
create table public.users (
  id uuid references auth.users primary key,
  created_at timestamptz default now(),
  breakup_date date not null,
  onboarding_completed boolean default false,
  graduation_requested_at timestamptz,
  graduation_confirmed_at timestamptz,
  push_token text
);

-- journal_entries
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  created_at timestamptz default now(),
  mood_score int check (mood_score between 1 and 10),
  mood_label text[],        -- 멀티 선택
  direction text check (direction in ('catch', 'let_go', 'undecided')),
  free_text text,
  ai_response text
);

-- question_responses — (user_id, question_id) unique 강제
create table public.question_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  question_id text not null,
  response_type text not null,
  response_value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, question_id)
);

-- graduation_cooling
create table public.graduation_cooling (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  requested_at timestamptz default now(),
  cooling_ends_at timestamptz generated always as (requested_at + interval '7 days') stored,
  status text default 'cooling' check (status in ('cooling', 'confirmed', 'cancelled')),
  checkin_responses jsonb default '[]',
  notifications_sent int default 0
);
```

**RLS 002 스니펫**
```sql
-- ⚠️ USING만으로는 SELECT만 차단됨 — INSERT/UPDATE 타 유저 데이터 주입을 막으려면 WITH CHECK 필수
alter table public.journal_entries enable row level security;
create policy "users_own_journals" on public.journal_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);  -- INSERT/UPDATE 시 타 유저 데이터 주입 방지

alter table public.question_responses enable row level security;
create policy "users_own_responses" on public.question_responses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.graduation_cooling enable row level security;
create policy "users_own_cooling" on public.graduation_cooling
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.relationship_profile enable row level security;
create policy "users_own_profile" on public.relationship_profile
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.decision_history enable row level security;
create policy "users_own_decisions" on public.decision_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- question_pool은 모두 읽기 가능, 쓰기는 service_role만
alter table public.question_pool enable row level security;
create policy "anyone_can_read_pool" on public.question_pool
  for select using (true);
```

**updated_at 자동 갱신 트리거 (migration 002에 포함)**
```sql
-- question_responses.updated_at 자동 갱신 — 변화 추적의 핵심
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger question_responses_updated_at
  before update on public.question_responses
  for each row execute function update_updated_at();

-- ⚠️ 앱단 upsert 규칙: updated_at은 트리거가 관리 — 클라이언트에서 직접 세팅 금지
```

**트레이드오프**
- `cooling_ends_at` generated column vs 앱 계산: DB에서 계산하면 서버/클라이언트 불일치 없음 → DB 계산 선택
- `mood_label text[]` vs jsonb: 단순 string 배열이므로 text[] 충분

---

## 0-3. 디자인 시스템 (colors, 공통 컴포넌트)

**생성 파일**
- `constants/colors.ts` — 6색 팔레트 전체
- `constants/typography.ts` — 폰트 크기/웨이트
- `components/ui/PrimaryButton.tsx`
- `components/ui/Pill.tsx`
- `components/ui/InsightCard.tsx`
- `components/ui/ChoiceButton.tsx`
- `components/ui/MeterBar.tsx`
- `components/ui/ProgressDots.tsx`
- `components/layout/ScreenWrapper.tsx` — fadeUp 애니메이션 포함
- `components/layout/StepLabel.tsx`

**colors.ts 스니펫**
```ts
export const colors = {
  purple: { 50: '#EEEDFE', 400: '#7F77DD', 600: '#534AB7', 800: '#3C3489' },
  teal:   { 50: '#E1F5EE', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
  coral:  { 50: '#FAECE7', 400: '#D85A30', 600: '#993C1D', 800: '#712B13' },
  pink:   { 50: '#FBEAF0', 400: '#D4537E', 600: '#993556', 800: '#72243E' },
  amber:  { 50: '#FAEEDA', 400: '#BA7517', 600: '#854F0B', 800: '#633806' },
  gray:   { 50: '#F1EFE8', 400: '#888780', 600: '#5F5E5A', 800: '#444441' },
} as const;
```

**ScreenWrapper — fadeUp 애니메이션 스니펫**
```tsx
// components/layout/ScreenWrapper.tsx
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
```

**트레이드오프**
- Reanimated v3 vs Animated API: fadeUp처럼 단순 진입 애니메이션은 `Animated` API로 충분. Gesture 연동 필요 시 Reanimated로 교체.

