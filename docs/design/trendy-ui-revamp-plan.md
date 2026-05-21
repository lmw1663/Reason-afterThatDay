# 트렌디 UI 리뉴얼 계획 — 화면 전환·카드·감정 카드·기록/나 레이아웃

작성일: 2026-05-21
관련 사용자 피드백:
1. 화면 전환 애니메이션이 단조로움 (탭 전환, 내 이야기·일기 쓰기 진입)
2. 카드 형태가 정형화·구식
3. 감정 카드(외로움·그리움 등)가 작고 불규칙
4. "오늘의 한마디" 카드의 좌측 띠(border-left-4)가 구식
5. 기록·나 탭 레이아웃이 단조롭고 재미없음
6. 폰트도 트렌디한 것으로

레퍼런스: `docs/design/PATTERNS.md` (Anz+ / Disney+ / Stocks / Apple Pay / Fi 5종 학습)

---

## 0. 현재 상태 진단

| 항목 | 현재 | 문제 |
|------|------|------|
| 탭 전환 | Expo Router `Tabs` 기본값 (animation prop 미지원), 각 (tabs) 화면의 `ScreenWrapper`가 fadeUp 280ms (Animated API) | 플랫폼 기본 + 옛 Animated API. spring·subtle 없음 |
| Stack 전환 | `slide_from_right` (일기/분석/about-me 등) | 트렌디한 편이지만 모달성 화면(intrusive-memory 등)도 동일하게 옆에서 들어옴 → 컨텍스트 분리 약함 |
| InsightCard | `border-l-4 border-l-purple-600` 좌측 띠 + `rounded-2xl p-4` | 좌측 띠가 정형화된 느낌. 2024~2026 트렌드는 보더리스 + 상단 액센트 |
| 감정 라벨 | `Pill` (rounded-full px-4 py-2, 약 32px 높이), `flex-wrap gap-2` 15개 라벨 | 카드 크기 작고, 라벨 길이별 줄바꿈 불규칙 |
| RecordCard | 좌 원형 아이콘(44x44) + 텍스트 + chevron — 6개 반복 | 같은 패턴 반복 → 시각 위계 없음 |
| MeCard | 좌 아이콘 + 텍스트 + chevron — 3개 반복 | 동일 단조로움 |
| 누름 피드백 | NativeWind `active:opacity-80`만 | spring·scale 같은 미세 모션 없음 |
| Reanimated 4.1.1 | 설치만 됨, 컴포넌트 미사용 | 기회 영역 |

---

## 1. 우선순위 및 범위

| 우선순위 | 항목 | 영향 화면 |
|---------|------|----------|
| P0 | Pretendard Variable 폰트 도입 (전역 typography) | 전 화면 |
| P0 | ScreenWrapper를 Reanimated 기반으로 마이그레이션 (spring) | 전 화면 |
| P0 | AnimatedPressable 컴포넌트 신설 + P0 화면에 적용 | 홈 · 기록 · 나 · 일기 step1 |
| P0 | InsightCard 리디자인 (좌측 띠 제거, dot+sparkle 패턴) | 홈 |
| P0 | EmotionPickerCard 컴포넌트 신설 + emotion → icon 매핑 | 일기 step1 |
| P1 | 기록 탭 Hero + 2x2 Grid + Footer 재구성 | records.tsx |
| P1 | 나 탭 Hero + Pair + 설정 재구성 | me.tsx |
| P1 | `useStaggerEntrance` 훅 + 카드 묶음 진입 적용 | records · me |
| P2 | Hero 카드에 데이터 연동 (감정 미니그래프 · 진행도) | 후속 |
| P2 | expo-haptics 피드백 | 후속 |

> Pill 컴포넌트(`components/ui/Pill.tsx`)와 `Card.tsx`의 accent/warning variant는 **건드리지 않는다.** 다른 화면(강점 라벨·경고 박스 등)에 영향이 갈 수 있으므로, 새 컴포넌트를 신설하고 사용처에서만 교체.

---

## 2. 절대 규칙 영향 점검

| 규칙 | 영향 | 조치 |
|------|------|------|
| 채팅 UI 금지 | 영향 없음 | 카드형 화면 전환 유지 |
| GPT 직접 호출 금지 | 영향 없음 | 디자인만 변경 |
| RLS · 키 관리 | 영향 없음 | DB 변경 없음 |
| 매듭 정책·매듭 권유 비허용·매듭 가역성 | 영향 없음 | 디자인만 변경 |
| 유예 알림 정책 | 영향 없음 | — |
| 매듭 위기 게이트 | 영향 없음 | — |
| "정답이 아니야" 문구 | 영향 없음 | 카드 내부 문구 유지 |
| 방향 변화 비난·판단 금지 | 영향 없음 | — |
| D+N 전역 표시 | 유지 — 홈 헤더(56px) 변경 없음 | — |
| 위기 신호 / 위기 안내 톤 | 영향 없음 | — |
| 페르소나 라벨 비노출 (`lint:persona`) | 영향 없음 — 어휘 변경 없음 | 구현 후 `npm run lint:persona`로 재확인 |

---

## 3. 컴포넌트 설계

### 3-1. `AnimatedPressable` (신설)

```
components/ui/AnimatedPressable.tsx
```

- Reanimated의 `useSharedValue` + `useAnimatedStyle` 기반
- Press in → `scale: 1 → 0.97`, `opacity: 1 → 0.92`, spring(stiffness 240 / damping 22)
- Press out → 원복
- Props: `onPress`, `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `hitSlop`, `disabled`, `style`
- 자식은 `<View>` 또는 임의의 노드 (Pressable과 같은 시그니처)

P0 적용 범위:
- `app/(tabs)/index.tsx`의 일기 CTA · "이어쓰기" 카드
- `app/(tabs)/records.tsx`의 RecordCard
- `app/(tabs)/me.tsx`의 MeCard
- `app/journal/index.tsx`의 EmotionPickerCard

> P2에서 ChoiceButton·Pill·기타 Pressable로 단계 확장.

### 3-2. `ScreenWrapper` 마이그레이션 (수정)

```
components/layout/ScreenWrapper.tsx
```

- 기존: Animated API `Animated.timing` opacity + translateY, duration 280ms
- 변경: Reanimated `withSpring` — opacity 0→1, translateY 8→0, `stiffness: 200, damping: 22, mass: 0.6`
- duration ≈ 220~260ms 체감 (spring이라 정확 시간 아님)
- `useEffect` → `useSharedValue` + `useEffect`로 spring 트리거
- `keyboardAvoiding` prop 그대로 보존

### 3-3. `InsightCard` 리디자인 (수정)

```
components/ui/InsightCard.tsx
```

기존:
```tsx
<View className="bg-surface rounded-2xl p-4 border-l-4 border-l-purple-600">
  <Text>{tag}</Text>
  <Text>{title}</Text>
  <Text>{body}</Text>
</View>
```

변경:
```tsx
<View
  className="rounded-3xl p-5"
  style={{
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(127,119,221,0.18)',  // 새 토큰 overlayPurpleGlow 강도 살짝 ↑
  }}
>
  {/* 상단 메타 — dot + tag + sparkle 아이콘 */}
  <View className="flex-row items-center gap-2 mb-3">
    <View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purple[400] }}
    />
    <Text className="text-xs font-semibold tracking-wide" style={{ color: colors.purple[400] }}>
      {tag}
    </Text>
    <View className="flex-1" />
    <Icon name="sparkles" size={14} color={colors.purple[400]} />
  </View>
  {title && <Text className="text-white font-semibold text-base mb-2">{title}</Text>}
  <Text className="text-gray-300 text-[15px] leading-7">{body}</Text>
</View>
```

핵심 변경:
- `border-l-4` 좌측 띠 **완전 제거**
- `rounded-2xl` (16px) → `rounded-3xl` (24px)
- `p-4` → `p-5`
- 좌측 띠 대신 **상단 row에 dot(8px) + tag + sparkle 아이콘** 배치
- 본문 텍스트 색상 `gray-400` → `gray-300` (가독성 ↑), `text-sm` → `text-[15px] leading-7`
- 카드 자체에 **1px 보라 알파 보더** (purple-400 18% alpha) → subtle inner glow 효과

> `accent` prop은 그대로 받되 dot · tag · sparkle 색상만 분기.

### 3-4. `EmotionPickerCard` (신설)

```
components/ui/EmotionPickerCard.tsx
```

```tsx
interface Emotion { label: string; iconName: IconName }

interface Props {
  emotions: readonly string[];      // labelsForPersona — 페르소나별 정렬 보존
  selected: string[];
  onToggle: (label: string) => void;
  columns?: 3 | 4;                  // 기본 3
}
```

- 3-column grid, 각 카드 **height 76px, gap 8px**
- 카드 내부: 라인 아이콘(상, 22px) + 라벨(하, 13px)
- 미선택: `bg-surface`, `borderWidth 1`, `borderColor: colors.border`
- 선택: `bg-overlayPurpleSoft`, `borderColor: colors.purple[400]`, scale 1.03 spring
- 우상단 코너에 작은 check 뱃지(원형 16x16, purple-400, check 흰색 10px)
- 카드 자체는 `AnimatedPressable` 기반 (누름 피드백 통일)
- spring: `stiffness 260, damping 20` — pop-in 느낌

### 3-5. emotion → icon 매핑 (`constants/emotionLabels.ts`에 추가)

```ts
export const EMOTION_ICON: Record<EmotionLabel, IconName> = {
  '분노': 'flame',
  '배신감': 'heart-crack',
  '슬픔': 'cloud-rain',
  '그리움': 'moon',
  '죄책감': 'scale',
  '안도': 'leaf',
  '자유로움': 'feather',
  '외로움': 'sunset',
  '충격': 'zap',
  '멍함': 'cloud',
  '자존감 흔들림': 'mirror',
  '혼란': 'wind',
  '허무': 'circle',
  '공허': 'square',
  '시들음': 'flower-wilt',
};
```

> 일부 아이콘명은 lucide-react-native 풀에서 실제 존재하는 이름으로 매핑 검증 필요 (구현 단계). 없으면 가장 근접한 대체 아이콘으로.

### 3-6. 기록 탭 재구성

```
app/(tabs)/records.tsx
```

새 레이아웃 (위에서 아래):

1. 헤더 (Caption "기록" + Display "네가 걸어온 길" + Body 보조 — 유지)
2. 추세 카드 (조건부, P09만 — 유지)
3. **Hero `RecordHeroCard`** — "일기 모아보기"
   - full-width, 높이 약 140px, `rounded-3xl`, `p-6`
   - 좌측: 큰 아이콘 (32px) + 제목(18px 700) + 보조라인(13px gray)
   - 우측: 진입 화살표 + (P2에서 미니 통계: D+N 일기 N편)
4. **2x2 Grid** `RecordGridCard` 4개:
   - 추억 · 회복의 결 · 질문통 · 내가 답한 질문
   - 정사각형 카드 (aspectRatio 1 / 0.85), `rounded-2xl`, `p-4`
   - 상단 라인 아이콘(24px) + 중앙 라벨(15px medium) + 하단 보조라인(12px gray)
5. **Footer `RecordKnotBanner`** — 매듭의 흔적
   - 조건부 (`hasKnotHistory`)
   - full-width, `rounded-2xl`, `p-4`, 톤 다른 색 (teal accent) — 다른 카드와 시각 구분

### 3-7. 나 탭 재구성

```
app/(tabs)/me.tsx
```

새 레이아웃:

1. 헤더 (유지)
2. **Hero `MeHeroCard`** — "내 이야기"
   - full-width, 높이 약 140px, `rounded-3xl`
   - 좌측 아이콘(32px) + 제목(18px 700) + 보조 ("장단점·욕구·정체성 정리")
   - 우측: 진입 화살표 + (P2에서 미니 진행도: "12개 항목 중 5개")
3. **카드 묶음 `MePairCard` (2개 세로)**:
   - 관계 분석 / 오늘의 방향
   - full-width `rounded-2xl p-4`, 좌 아이콘 + 텍스트 + 우 chevron — 기존 MeCard 패턴 유지
   - 게이트된 상태(disabled): opacity 0.5 + 보조라인에 "N일 뒤" 명시 — 기존 로직 보존
4. 설정 (작게, 단일 카드 — 유지)
5. 안내 카드 (`decisionLocked` · `!insightUnlocked` — 유지)

### 3-8. `useStaggerEntrance` 훅 (신설)

```
hooks/useStaggerEntrance.ts
```

```ts
export function useStaggerEntrance(count: number, gapMs = 40) {
  // 카드 N개에 대해 진입 시점을 0, gap, 2*gap, ... 으로 분배
  // 각 카드에 적용할 sharedValue 배열을 반환
  // useSharedValue + withDelay(i * gap, withSpring(1))
}
```

- 기록 탭: Hero + Grid 4개 + Footer = 최대 6개 → 첫 5개에만 stagger 적용 (Footer는 즉시)
- 나 탭: Hero + Pair 2개 + 설정 = 4개 → 모두 stagger

> 모션 피로 회피 위해 gap 40ms로 단축. 총 진입 시간 6 * 40 = 240ms로 ScreenWrapper fadeUp과 거의 동일.

---

## 4. 디자인 토큰 추가 / 변경

```ts
// constants/motion.ts (신설)
export const motion = {
  duration: {
    fadeUp: 220,
    stagger: 40,
  },
  spring: {
    standard:  { stiffness: 240, damping: 22, mass: 0.6 },
    pop:       { stiffness: 260, damping: 20, mass: 0.5 },
    soft:      { stiffness: 180, damping: 22, mass: 0.7 },
  },
} as const;

// constants/colors.ts (추가)
export const overlayPurpleGlow = 'rgba(127,119,221,0.06)';
```

---

## 5. 구현 서브태스크 (커밋 단위)

`CLAUDE.md` 커밋 규칙 — 서브태스크 하나 완료 시마다 즉시 커밋, 한국어, "왜"에 초점.

```
[1] feat(anim): ScreenWrapper Reanimated + spring 마이그레이션
    — 옛 Animated API → withSpring 자연스러운 진입감

[2] feat(ui): AnimatedPressable 컴포넌트 신설
    — 카드/버튼 누름 피드백 통일 (scale·opacity spring)

[3] feat(ui): InsightCard 리디자인 — 좌측 4px 띠 제거
    — 상단 dot+tag+sparkle 패턴으로 트렌디화

[4] feat(constants): motion 토큰 + emotion → icon 매핑 추가
    — 모션 일관성 + EmotionPickerCard 의존 토큰

[5] feat(ui): EmotionPickerCard 신설 — 3-col grid 76px spring 선택
    — Pill의 불규칙·작은 사이즈 한계 극복

[6] feat(journal): step1 Pill → EmotionPickerCard 교체
    — 감정 선택의 시각 위계·터치 영역 ↑

[7] feat(records): Hero + 2x2 Grid + Footer 재구성
    — 6개 동일 카드 반복 해소, 사용 빈도 기반 위계

[8] feat(me): Hero + Pair 재구성
    — 3개 동일 카드 반복 해소, 내 이야기 우선

[9] feat(anim): useStaggerEntrance 훅 + 카드 묶음 진입 적용
    — 진입 시 카드 묶음 단계별 fade로 단조로움 해소

[10] verify: tsc --noEmit + lint:persona 통과 확인
```

---

## 6. 검증 결과 (구현 전 셀프 점검)

| # | 항목 | 결과 | 대응 |
|---|------|------|------|
| 1 | 절대 규칙 위반 (16개) | 모두 ✅ — 디자인만 변경, 어휘·로직 불변 | — |
| 2 | Reanimated 4 + Expo SDK 51 호환 | ✅ 이미 설치, NativeWind 경고도 처리 중 | — |
| 3 | Expo Router Tabs `animation` prop 미지원 | ⚠ | ScreenWrapper 강화로 우회 |
| 4 | `Card.accent` variant 사용처 광범위 가능성 | ⚠ | InsightCard만 자체 스타일로 분리 |
| 5 | 감정 카드 5줄(15개) → 스크롤 발생 | ⚠ | 76px + gap 8 = 약 420px, 일기 화면은 원래 스크롤 → 수용 가능 |
| 6 | P08 정렬(공허/멍함/시들음 우선) 보존 | ✅ grid도 배열 순서 그대로 | — |
| 7 | Pill 컴포넌트 다른 사용처 영향 | ✅ Pill은 손대지 않음, EmotionPickerCard로 신설 | — |
| 8 | Stagger 과도 시 "느린 앱" 인상 | ⚠ | gap 40ms로 단축, 묶음 단위만 적용 |
| 9 | `Card.warning`(amber 좌측 띠) 같이 봐야? | ⚠ | 경고용은 시각 구분 가치 있음 → 유지 |
| 10 | AnimatedPressable 전면 교체 PR 비대 | ⚠ | P0 4개 화면만 적용, 나머지 P2 |
| 11 | `lint:persona` 통과 | ✅ 어휘 변경 없음 | 구현 후 재확인 |
| 12 | iOS/Android spring 양립 | ✅ Reanimated 4 cross-platform | — |
| R-A | 기록 탭 Hero 미니그래프 API 부담 | ⚠ | P0/P1는 정적 hero, 데이터 연동은 P2 |
| R-B | 나 탭 Hero 진행도 데이터 부담 | ⚠ | 동일 — P0/P1는 정적 hero |
| R-C | 일기 step1 외 다른 곳에 EmotionPickerCard 필요? | ⚠ | 현 시점엔 step1만. 후속에서 about-me·question 등 확장 검토 |

---

## 7. 디렉터리 변경 요약

```
신설:
  components/ui/AnimatedPressable.tsx
  components/ui/EmotionPickerCard.tsx
  components/cards/RecordHeroCard.tsx
  components/cards/RecordGridCard.tsx
  components/cards/RecordKnotBanner.tsx
  components/cards/MeHeroCard.tsx
  components/cards/MePairCard.tsx
  hooks/useStaggerEntrance.ts
  constants/motion.ts

수정:
  components/layout/ScreenWrapper.tsx     # Reanimated 마이그레이션
  components/ui/InsightCard.tsx           # 좌측 띠 제거, 트렌디화
  constants/emotionLabels.ts              # EMOTION_ICON 매핑 추가
  constants/colors.ts                     # overlayPurpleGlow 추가
  app/(tabs)/index.tsx                    # 일기 CTA를 AnimatedPressable로
  app/(tabs)/records.tsx                  # Hero + Grid + Footer 재구성
  app/(tabs)/me.tsx                       # Hero + Pair 재구성
  app/journal/index.tsx                   # Pill → EmotionPickerCard 교체

손대지 않음:
  components/ui/Pill.tsx                  # 다른 사용처 영향 차단
  components/ui/Card.tsx                  # accent/warning variant 보존
  components/ui/ChoiceButton.tsx          # P2에서 별도 검토
  app/_layout.tsx                         # Stack 전환은 현재값 유지
  app/(tabs)/_layout.tsx                  # Tabs animation prop 미지원이라 무변경
```

---

## 8. 검증 명령 (구현 후)

```bash
npx tsc --noEmit          # TypeScript strict 통과
npm run lint:persona       # 페르소나 어휘 비노출 통과
npx expo start --ios       # 실제 동작 확인
```

수동 QA 시나리오:
1. 홈 진입 시 fadeUp + spring (Reanimated) 자연스러운지
2. 탭 전환(오늘 ↔ 기록 ↔ 나) 시 진입 애니메이션 일관성
3. 홈 "오늘 일기 쓰기" 누름 시 scale·opacity 피드백
4. 일기 step1 감정 카드 3-col 정렬 + 선택 시 spring pop + check 뱃지
5. 기록 탭 진입 시 Hero → Grid 4개 → Footer가 stagger 진입
6. 나 탭 진입 시 Hero → Pair stagger 진입
7. P08 페르소나(공허/멍함/시들음 우선) 정렬 보존 (개발 빌드에서 페르소나 강제 설정 후 확인)
8. 다크 모드 카드 가독성

---

## 9. 후속 작업 (P2, 본 PR 범위 밖)

- Hero 카드 데이터 연동 (감정 미니그래프 · about-me 진행도)
- expo-haptics 가벼운 임팩트 피드백
- ChoiceButton에도 AnimatedPressable 적용
- 모달 화면(IntrusiveMemoryModal 등)을 `fade_from_bottom` Stack 전환으로 분리
- Card.warning amber 띠도 동일한 컨셉으로 리디자인 검토 (긴급도가 다른 시각 구분 필요한지 평가 후)
