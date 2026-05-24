# UX Audit — Cursor 세션 적용 기록 (2026-04-30)

> 작성 목적: `docs/ux-audit.md` 의 P0/P1/P2 권고를 코드에 반영하면서, 적용 도중 발견·해결한 런타임 버그까지 한 번에 정리한다.
> 범위: 이 세션(2026-04-30, Cursor) 안에서 변경된 파일만.

---

## 0. 작업 흐름 요약

1. `docs/ux-audit.md` 의 9개 권고(P0×3 / P1×3 / P2×3) 일괄 적용
2. 적용 직후 발생한 런타임 `ReferenceError` 두 건 진단·수정 (모듈 해석 / Metro 캐시)
3. `react-native-reanimated` 의 inline-style 경고 분석 (라이브러리 자체 경고로 결론, 무시 가능)
4. **신규 버그 리포트 — "감정 일기를 작성해도 일기창에 기록되지 않음"** 의 근본 원인 추적·수정

---

## 1. 디자인 시스템 정비 (P0~P2)

### 1.1 색상 토큰 단일 출처화 — P0
- `constants/colors.js` (CommonJS, Tailwind 전용) 와 `constants/colors.ts` (RN 코드용) 의 역할을 헤더 주석으로 명시.
- `gray.400` 을 `#888780 → #A8A6A0` 로 상향 (WCAG AA 본문 대비 4.5:1 충족).
- 화면 전반에 흩어져 있던 인라인 `rgba(...)` 7종을 다음 토큰으로 정리:
  - `overlayPurpleSoft`, `overlayPurpleWeak`
  - `overlayGrayMuted`, `overlayGrayStrong`
  - `overlayTealSoft`, `overlayAmberSoft`
  - `overlayBackdropDark`
- 결과: 앱 코드 내 인라인 hex/rgba 0건. 토큰만으로 모든 표면색 구성.

### 1.2 ProgressDots 정확도 + 접근성 — P0
- `components/ui/ProgressDots.tsx` 에 `accessibilityRole="progressbar"` / `accessibilityValue` / `accessibilityLabel` 부여.
- 활성/비활성 도트 색을 `colors.purple[400]` / `colors.purple[800]` 로 통일.
- 분석 4단계, 일기 4단계, 나침반 5단계의 카운팅과 화면 매핑을 다시 확인.

### 1.3 KeyboardAvoidingView 일괄 적용 — P0
- `components/layout/ScreenWrapper.tsx` 의 `keyboardAvoiding` prop 을 입력 화면 전반에 적용:
  - `app/journal/index.tsx`, `app/journal/question.tsx`
  - `app/analysis/reasons.tsx`, `app/analysis/pros-cons.tsx`
  - `app/onboarding/*`
- multiline + autoFocus 입력에서 키보드가 입력창을 가리는 핵심 폼 버그 제거.

### 1.4 Typography 4단계 강제 — P1
- `components/ui/Typography.tsx` 의 `Display / Heading / Body / Caption` 을
  분석·나침반·일기·졸업 화면에 일괄 적용. 화면별로 자유 박혔던 `text-xl/2xl/sm` 자유 조합 제거.

### 1.5 공통 컴포넌트 신설 — P1
- `components/ui/Card.tsx` 를 다음 variant 로 확장:
  - `default` / `accent (purple|teal|coral|amber)` / `warning` / `subtle (+tone: soft|weak)`
- 화면 곳곳의 `<View style={{ backgroundColor: '#1A1A22' }}>` 즉석 카드를 `<Card>` 로 교체.
- `BackHeader` 미사용 화면(`journal/history`, `journal/[id]`, `cooling/index`, `cooling/checkin`)에 일괄 적용. `router.push` / `router.replace` 혼용으로 막혀 있던 "갇힌 느낌" 제거.

### 1.6 접근성 라벨/역할 — P2
- 핵심 Pressable, 탭, 슬라이더, ProgressDots, BackHeader, MoodSlider 에
  `accessibilityRole` / `accessibilityLabel` / `accessibilityState` 부여.
- 순수 장식 이모지에는 `accessibilityElementsHidden` 으로 노이즈 차단.

### 1.7 Disclaimer 카피 변주 — P2
- `constants/copy.ts` 의 `disclaimer.{diagnosisResult, compassResult, cumulativeSummary, meterReference}` 4종을
  진단(`/analysis/result`) / 나침반(`/compass/needle`) / 누적(`/(tabs)/analysis`) / 메터 화면에 분산 적용.
- "이건 정답이 아니야 …" 라는 문장이 4곳에 동일 복붙되던 문제 해소.

### 1.8 Modal/LoadingOverlay 토큰화 — P2
- `components/ui/Modal.tsx`, `components/ui/LoadingOverlay.tsx` 의 backdrop 색을
  `colors.overlayBackdropDark` 로 교체. ActivityIndicator 색은 `colors.purple[400]`.

---

## 2. 적용 직후 발생한 런타임 오류 처리

### 2.1 `ReferenceError: Property 'KeyboardAvoidingView' doesn't exist`
- `ScreenWrapper.tsx` 자체 import 는 정상.
- 원인: 디자인 시스템 정비 도중 `colors.ts` 의 모듈 해석 패턴 변경으로 Metro 번들 일관성이 깨졌고, 캐시가 `keyboardAvoiding` 분기 코드를 실어 나르지 못함.
- 조치: `npx expo start --clear` 안내 + 아래 2.2 와 함께 모듈 해석 패턴 정리.

### 2.2 `ReferenceError: Property 'colors' doesn't exist`
- 원인: `constants/colors.ts` 가 `require('./colors.js')` (CJS 동적 import) 로 토큰을 가져오던 부분이 Hermes/Metro 환경에서 평가 시점 문제로 `colors` 가 `undefined` 가 되는 케이스 발생.
- 조치: `colors.ts` 를 **직접 ESM inline export** 로 재정의해 `require()` 를 제거. `colors.js` 는 Tailwind config 전용으로만 유지하고, 두 파일을 손으로 동기화한다는 주석을 명시.

### 2.3 `react-native-reanimated` shared-value 경고
- 원인: NativeWind v4 가 `Pressable` 의 `active:` 클래스를 처리하면서 내부적으로 `reanimated` 의 `.value` 를 inline style 에 넣음.
- 결론: 라이브러리 내부 경고. `app/_layout.tsx` 의 `LogBox.ignoreLogs` 로 이미 디바이스에서 숨김 처리됨. 코드 변경 없음.

---

## 3. 일기 저장/표시 버그 추적·수정

### 3.1 사용자 리포트
> "감정 일기를 작성해도 일기창(history)에서 일기가 기록되지 않아"

### 3.2 근본 원인 — 3중 결함
1. **익명 가입 자동 실행 누락**
   - `hooks/useAuth.ts` 가 세션 체크만 하고 `signInAnonymously()` 는 함수 export 만 함.
   - 첫 진입 시 `userId === null` → 일기 저장 분기 `if (!userId) return;` 에서 차단.
2. **store `entries` 미반영**
   - `app/journal/response.tsx` 가 저장 후 `setTodayEntry` 만 호출.
   - history 화면이 의존하는 `entries` 배열이 갱신되지 않아 비어 보임.
3. **Silent failure**
   - `.catch(() => {})` 패턴이 저장 실패를 사용자/콘솔 양쪽 모두에서 숨김. UX 감사 시 이미 지적했던 패턴이 남아 있던 케이스.

### 3.3 수정 내용

| 파일 | 변경 |
|------|------|
| `hooks/useAuth.ts` | mount 시 세션 없으면 `signInAnonymously()` 자동 호출. 실패 시 `console.warn`. |
| `store/useJournalStore.ts` | `upsertEntry(entry)` 신설 — 같은 id 가 있으면 교체, 없으면 prepend, todayEntry 도 동시 갱신. |
| `app/journal/response.tsx` | 스트리밍 종료 시 (1) `local-{ts}` id 로 즉시 `upsertEntry` → history 즉시 반영. (2) `userId` 가 있을 때만 DB 저장. (3) 성공 시 서버 응답으로 다시 `upsertEntry`. (4) 실패는 `console.warn` 으로 surface. |
| `app/journal/history.tsx` | `.catch(() => {})` 제거 → `console.warn`. |
| `app/(tabs)/index.tsx` | 홈 진입 시 `fetchTodayEntry` + `fetchRecentEntries(30)` 동기화 추가. 앱 재시작·다른 기기 케이스 커버. |

### 3.4 동작 시나리오
- **익명 가입 성공** → DB 저장 → 서버 응답으로 로컬 엔트리 교체 → history 정상 노출.
- **익명 가입 실패** → 로컬 임시 엔트리(id `local-...`) 가 `entries` 에 prepend 되어 history 에 보임. 콘솔에 `[auth] anonymous sign-in failed` 경고가 남아 환경 문제로 식별 가능.
- **앱 재시작 후 홈 진입** → `fetchTodayEntry` / `fetchRecentEntries` 가 서버 데이터로 store 채움. 다른 기기에서 작성한 일기도 즉시 보임.

### 3.5 테스트 절차
1. 앱 완전 종료 → 재실행 (`useAuth` 의 mount-once effect 보장).
2. 일기 4단계 작성 → 홈 → "📔 일기 목록" 진입 → 작성한 일기가 맨 위에 노출되는지 확인.
3. (옵션) Supabase Dashboard → Authentication → Sign In/Up → **Anonymous Sign-Ins** 가 활성화돼 있는지 확인. 비활성화 시 콘솔에 `[auth] anonymous sign-in failed` 가 뜨고, 그 경우에도 history 는 로컬 임시 엔트리로 표시됨.

---

## 4. 변경 파일 목록 (이 세션 한정)

### 디자인 시스템
- `constants/colors.js`
- `constants/colors.ts`
- `components/ui/Card.tsx`
- `components/ui/Modal.tsx`
- `components/ui/LoadingOverlay.tsx`
- `components/ui/PrimaryButton.tsx`
- `components/ui/ChoiceButton.tsx`
- `components/ui/ProgressDots.tsx`
- `components/ui/BackHeader.tsx`
- `components/ui/Typography.tsx` (참조 정리)
- `components/layout/ScreenWrapper.tsx` (`keyboardAvoiding` 사용 확장)

### 화면
- `app/(tabs)/index.tsx`
- `app/(tabs)/analysis.tsx`
- `app/(tabs)/graduation.tsx`
- `app/(tabs)/compass.tsx`
- `app/journal/index.tsx`
- `app/journal/direction.tsx`
- `app/journal/question.tsx`
- `app/journal/response.tsx`
- `app/journal/history.tsx`
- `app/journal/[id].tsx`
- `app/analysis/reasons.tsx`
- `app/analysis/pros-cons.tsx`
- `app/analysis/stay-leave.tsx`
- `app/analysis/result.tsx`
- `app/compass/needle.tsx`
- `app/cooling/index.tsx`
- `app/cooling/checkin.tsx`
- `app/graduation/confirm.tsx`
- `app/graduation/request.tsx`
- `app/graduation/report.tsx`
- `app/graduation/letter.tsx`
- `app/onboarding/index.tsx`
- `app/onboarding/mood.tsx`

### 데이터 / 인증 / 스토어
- `hooks/useAuth.ts`
- `store/useJournalStore.ts`
- `api/journal.ts` (참조 정리)
- `constants/copy.ts` (참조 정리)

### 문서
- `docs/ux-audit.md` (적용 상태/후속 메모 갱신)
- `docs/ux-audit(cursor).md` (본 문서, 신규)

---

## 5. 남은 사항 / 주의

- `react-native/no-inline-styles`, React Hook deps 류의 기존 lint 경고는 이번 정비와 직결되지 않아 유지. 추후 별도 PR 권장.
- `constants/colors.js` 와 `constants/colors.ts` 는 **수동 동기화** 가 원칙. Tailwind config 가 ESM `colors.ts` 를 직접 import 하지 않는 환경 제약 때문이며, 한쪽만 수정하면 디자인이 깨질 수 있음.
- `journal/response.tsx` 의 로컬 임시 엔트리는 id 가 `local-...` 형태로 남는다. DB 저장 성공 시 서버 응답으로 즉시 교체되지만, 실패 시 `local-...` id 가 그대로 남는 점을 추적할 때 참고.
- 익명 가입이 비활성화돼 있으면 DB 영속화는 동작하지 않는다. 운영 전 Supabase Dashboard 의 Anonymous Sign-Ins 토글 확인 필요.

---

## 6. 검증

- `npx tsc --noEmit` : 0 error
- `eslint` : 신규 lint 0 (기존 경고 그대로 유지)
- 수동 시나리오 (위 3.5) : 일기 작성 → history 즉시 반영 / 앱 재시작 후 진입 시 서버 동기화 확인용 절차 수립
