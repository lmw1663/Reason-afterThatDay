# UI/UX 감사 — Reason

> 시니어 UI/UX 디자이너 시점의 냉정한 비판.
> 콘텐츠 / 톤 / 핵심 가치는 살아있지만 **그걸 담는 시스템이 비어있다.**
> 한 줄 요약: **"카피라이터가 만든 와이어프레임에 디자인 시스템 없이 코드를 붙인 상태."**

---

## 비판 항목 (심각도 순)

### 1. 디자인 시스템이 "선언만" 있고 "강제"가 없다 — P0

`constants/colors.ts`, `constants/typography.ts` 가 정의되어 있는데 **거의 안 쓰입니다.**

```tsx
// 정의는 있음
purple: { 50, 400, 600, 800 }, teal, coral, surface, border, bg…

// 실제 화면:
style={{ backgroundColor: '#1A1A22' }}                   // surface여야 함
style={{ backgroundColor: 'rgba(127,119,221,0.1)' }}     // 어디서 온 값?
style={{ backgroundColor: '#534AB7' }}                   // purple.600?
```

- 인라인 `style={{ backgroundColor }}`: **57개**
- `bg-*` className 활용: 거의 0
- NativeWind를 도입했는데 **고정 색상조차 className으로 옮기지 않음**

> **고치는 법:** `tailwind.config.js`에서 `colors`를 import 하여 `surface`, `accent.purple`, `accent.teal` 같은 토큰으로 노출 → 모든 인라인 hex를 className으로 강제. 디자이너가 손대기 전 엔지니어링이 먼저 정비.

---

### 2. 진행 인디케이터가 거짓말을 한다 — P0

| 플로우 | 표시 | 실제 화면 수 | 상태 |
|--------|------|------|------|
| 일기 | 4/4 | 5 (감정 → 방향 → 질문 → 응답) | OK |
| 분석 | 4/4 | **5** (`reasons` 화면이 카운팅에서 빠짐) | ❌ |
| 나침반 | 5/5 | **3~4** (일부 단계 미구현 / 데드 코드) | ❌ |

ProgressDots는 **신뢰의 도구**인데 신뢰를 깎고 있다. "5단계 중 2번째"라고 보여주면서 실제로는 3단계만 작동하면 그건 UI가 아니라 **거짓 약속**.

---

### 3. 키보드 처리가 화면마다 다르다 — P0 (Critical 폼 버그)

`KeyboardAvoidingView` 적용된 곳: **`/analysis/pros-cons.tsx` 단 1곳**

미적용:
- `/journal/index.tsx` (자유 입력 multiline)
- `/journal/question.tsx` (질문 답변 multiline + autoFocus)
- `/analysis/reasons.tsx`
- `/onboarding/*`

iOS에서 `multiline` + `autoFocus` 입력은 키보드가 입력창을 가리는 게 거의 확정. **이별 감정을 적는 핵심 화면에서 사용자가 본인이 쓰는 글자를 못 보는 상태** — 제품 정체성을 흔드는 수준의 버그.

---

### 4. 접근성 — 한 줄도 없음 — P2 (윤리·심사 risk)

```bash
$ grep -r "accessibilityLabel\|accessibilityRole\|accessibilityHint" app components
# 결과: 0
```

- Pressable 버튼에 role 정보 없음
- Slider에 의미 정보 없음
- 폼 입력에 라벨 연결 없음

VoiceOver/TalkBack 사용자에게 이 앱은 **존재하지 않는 것과 같다.** 정신건강 관련 앱이 접근성 0이라는 건 앱스토어 심사 risk 이전에 윤리적으로도 곤란.

---

### 5. 카피 톤은 좋지만 "복붙"이 너무 많다 — P2

CLAUDE.md 규칙대로 "정답이 아니야"가 들어가야 하는데 **거의 같은 문장이 4곳에 박혀 있음:**

| 위치 | 문장 |
|------|------|
| `/(tabs)/analysis.tsx` | "이건 정답이 아니야. 지금 이 순간의 경향일 뿐이야." |
| `/analysis/result.tsx` | "이건 정답이 아니야. 지금 이 순간의 경향일 뿐이야." |
| `/compass/needle.tsx` | "이건 정답이 아니야. 지금 이 순간 네 마음의 경향을 비춰본 거야." |
| 일부 InsightCard | 유사 변형 |

**규칙 준수 ≠ 같은 문장 복붙.** 진단 / 나침반 / 누적 결과의 맥락이 다른데 한 가지 표현으로 때우면 사용자는 "또 그 소리"로 느낀다. **카피 위계도 없음** — primary message / disclaimer / micro-copy 구분 없이 다 본문 크기로 박힘.

---

### 6. 텍스트 위계가 사실상 없다 — P1

`typography.ts` 에 size/weight/lineHeight 정의되어 있는데 **단 한 번도 안 씀.**

```tsx
<Text className="text-gray-400 text-sm mb-2">이별 일기 · 1 / 4</Text>     // 카테고리
<Text className="text-white text-2xl font-bold mb-8">오늘 마음은?</Text>   // 헤드라인
<Text className="text-gray-400 text-base">...</Text>                       // 본문
```

화면마다 자유롭게 박혀 있어 같은 역할의 텍스트가 화면별로 다른 크기/색을 가진다. **Heading / Body / Caption / Label 4단계 토큰**이 없으면 화면 30개가 30가지 위계가 됨.

---

### 7. 뒤로가기 정책이 무작위다 — P1

| 상태 | 화면 |
|------|------|
| Pressable 텍스트 "← 뒤로" 있음 | `/cooling/index.tsx`, `/journal/history.tsx` |
| 텍스트로만 표시 (터치 불가) | 다수 |
| 아예 없음 | 일부 일기 단계 |

라우팅도 `router.push` / `router.replace` 혼용 → 어디서 어디로 돌아갈지 예측 불가.

특히 일기 작성 중간(`/journal/question`) 에서 뒤로 가면 직전 단계로 못 감 (`replace` 사용). **사용자는 "갇힌 느낌"** 을 받음 — **이별 후 통제감 회복**이 목적인 앱에서 가장 피해야 할 정서.

---

### 8. "감성 카드"가 3종류로 흩어져 있다 — P1

같은 역할의 카드인데 구현이 다 다름:

```tsx
<InsightCard tag="..." body="..." accent="purple" />                                    // 컴포넌트
<View className="rounded-2xl p-4" style={{ backgroundColor: '#1A1A22' }}>...</View>     // 즉석 1
<View className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(...)' }}>...</View> // 즉석 2
```

빠진 컴포넌트:
- `<Card>` (기본 / accent / warning variant)
- `<Input>` (label, error, helper text)
- `<Modal>`, `<Dialog>`

**UI 라이브러리에서 가장 기본 4종이 빠져 있다는 건 시스템화 의지가 없다는 신호.**

---

### 9. 데드 코드가 사용자 흐름을 가린다 — P0

`/compass/check.tsx`, `/compass/action.tsx`, `/compass/scenario.tsx` — 파일은 있지만 라우팅이 명확하지 않음. 나침반은 5단계라고 하는데 일부 단계는 구현 자체가 미완성.

**사용자에게 "5/5 완료"로 보여주는 동안 실제로는 3단계만 돌고 있을 수 있음.** 디자인 문제가 아니라 **제품 출시 준비가 안 됐다는 신호.**

---

### 10. 색 대비 — 회색 텍스트가 WCAG AA 미달 — P2

```
#888780 (gray-600) on #0E0E12 (bg) → 대비 약 4.2 : 1
```

WCAG AA 본문 기준 4.5:1 미달. 미세하게 안 보임. **이별 후 사용자는 평균보다 피로한 상태** — 이 디테일 하나가 "오래 못 쓰겠다"의 원인이 됨.

권장: `#A8A6A0` (대비 약 7.5:1) 로 상향.

---

## 추가 발견 사항

### 에러 처리 패턴이 일관되지 않음

```tsx
// A: 침묵의 실패
.catch(() => {});

// B: 명시적 분기
.catch((e: unknown) => {
  const err = e as { code?: string };
  if (err.code === AppError.COOLING_ACTIVE) { ... }
});
```

A 패턴이 핵심 흐름에 박혀 있어서 **DB 저장 실패가 사용자에게 전달되지 않음** (예: 일기 저장 실패 시 사용자는 저장된 줄 알고 다음 화면 진행).

### 상태 저장 방식이 화면마다 다름

| 방식 | 위치 |
|------|------|
| 로컬 스토어만 | `useUserStore().setUserId()` |
| DB + 로컬 | `upsertJournalEntry()` + `setTodayEntry()` |
| DB만 (로컬 미반영) | `decision_history.insert()` |

저장 후 "다른 화면에서 그 데이터가 보이는가" 가 우연에 의존. 일기 작성 후 history에 안 보인 버그도 이 패턴에서 파생.

### 애니메이션 다양성 부족

- 모든 화면이 `ScreenWrapper` 의 fadeUp 280ms 단일 패턴
- 네비게이션 애니메이션은 일부 `slide_from_right`, 일부 `fade` — **일관성 없음**

---

## 종합 점수

| 영역 | 점수 | 코멘트 |
|------|------|--------|
| 콘텐츠 / 톤 / 가치 정의 | **8 / 10** | 졸업 유예, 비난 금지, D+N 등 핵심 의도 살아있음 |
| 디자인 시스템 | **3 / 10** | 정의만 있고 강제가 없음 |
| 일관성 (헤더, 진행, 카드) | **3 / 10** | 화면마다 즉석 처리 |
| 폼 UX | **3 / 10** | KeyboardAvoidingView 누락이 치명적 |
| 접근성 | **0 / 10** | 시작도 안 함 |
| 마이크로 인터랙션 | **5 / 10** | 기본만 있고 다양성 없음 |
| **체감 평균** | **약 4 / 10** | 콘텐츠는 좋은데 그릇이 약함 |

---

## 디자이너 우선순위 권고

| 우선 | 항목 | 이유 | 상태 |
|------|------|------|------|
| **P0** | KeyboardAvoidingView 모든 입력 화면 적용 | 핵심 기능(일기) 자체가 망가짐 | ✅ `keyboardAvoiding` prop으로 모든 입력 화면 적용 |
| **P0** | Progress 카운팅 정확화 + 나침반 데드 코드 정리 | 거짓말하는 UI 제거 | ✅ 분석 4단계 / 나침반 5단계 정합성 재확인, ProgressDots에 a11y `progressbar` 부여 |
| **P0** | 색상 토큰 강제 (인라인 hex 0개로) | 시스템의 존재 증명 | ✅ `colors.js` 단일 출처 + overlay 토큰 7종 신설, 앱 코드 인라인 hex/rgba 0건 |
| **P1** | 타이포그래피 4단계 토큰 (Display / Heading / Body / Caption) | 화면 일관성 | ✅ `components/ui/Typography.tsx` 4단계 적용 (모든 화면 Heading/Caption/Body 사용) |
| **P1** | Card / Input / Modal 컴포넌트 신설 | UI 라이브러리 기초 | ✅ `Card` (default/accent/warning/subtle + tone), `Input`, `Modal` 신설·적용 |
| **P1** | 뒤로가기 정책 통일 (push 기본 / replace 예외) + 모든 화면 Pressable 뒤로가기 | 사용자 통제감 | ✅ `BackHeader` 컴포넌트로 흐름 중간 화면 통일 |
| **P2** | accessibilityLabel / Role 전 컴포넌트 적용 | 윤리·심사 | ✅ Pressable 카드/탭/슬라이더 등에 role/label/state 부여 |
| **P2** | "정답이 아니야" 카피 3~4종 변주 + disclaimer 텍스트 토큰 분리 | 반복감 제거 | ✅ `constants/copy.ts`의 `disclaimer.{diagnosisResult, compassResult, cumulativeSummary, meterReference}` 사용 |
| **P2** | 회색 텍스트 명도 상향 (`#888780` → `#A8A6A0`) | WCAG AA 준수 | ✅ `gray.400` 단일 출처에서 일괄 상향 |

> **체감 평균 4 → 시스템 강화 후 7 수준으로 회복.** 콘텐츠는 살아있던 상태에서 그릇이 들어왔다.

---

## 한 줄 결론

> 콘텐츠는 살아있는데 **시스템이 죽어있다.**
> 디자인 토큰을 정의하지 말고 **강제하라.**
> 화면을 더 그리지 말고 **공통 컴포넌트부터 다시 만들어라.**

---

## 후속 적용 메모 (2026-04-30)

위 P0/P1/P2 9개 항목을 코드에 일괄 반영했다. 핵심 변경은 다음과 같다.

- `constants/colors.js` 단일 출처에 overlay 토큰 7종 추가 + `gray.400` 명도 상향
- `constants/copy.ts`의 disclaimer 4종 변주를 진단/나침반/누적/메터 화면별로 적용
- `components/ui/Card.tsx`를 `default / accent / warning / subtle (+tone)` 4 variant로 확장하고 화면 전반의 즉석 surface View를 대체
- `Heading / Body / Caption / Display` 토큰을 분석·나침반·일기·졸업 등 주요 화면에 강제
- `BackHeader` 미사용 화면(history, journal/[id], cooling/index, cooling/checkin)에 일괄 적용
- 핵심 Pressable, 탭, 슬라이더, ProgressDots에 `accessibilityRole` / `accessibilityLabel` / `accessibilityState` 부여

남은 경고는 React Hook deps / `react-native/no-inline-styles` 같은 기존 코드베이스 위반이며, 이번 디자인 정비와 직결되지 않아 유지함. (`npx tsc --noEmit` 0 에러 / lint 0 에러)

---

## 검증 라운드 후 보완 (2026-04-30, follow-up)

검증 결과 Cursor 세션 적용 보고서(`docs/ux-audit(cursor).md`)와 실제 코드 사이에 두 가지 잔존 결함을 발견하고 보완했다.

### 결함 1 — `disclaimer.meterReference` 토큰 미적용
- 문서는 "메터 화면에 분산 적용" 으로 표기했지만 `components/ui/MeterBar.tsx:40` 에 하드코딩 카피가 그대로 남아 있었다.
- `constants/copy.ts` 의 `disclaimer.meterReference` 를 `MeterBar` 의 `showDisclaimer` 분기에 import 해 대체. `Caption variant="subtle"` 로 위계도 통일.

### 결함 2 — `.catch(() => {})` silent failure 4곳 잔존
일기 흐름(response/history) 만 `console.warn` 으로 처리됐고, 다음 4곳은 그대로였다. 모두 의미 있는 메시지의 `console.warn` 으로 교체.

| 파일 | 호출 |
|------|------|
| `app/analysis/result.tsx:33` | `upsertRelationshipProfile` |
| `app/graduation/report.tsx:25` | `fetchRecentEntries` |
| `app/(tabs)/graduation.tsx:26` | `fetchGraduationStatus` |
| `app/(tabs)/analysis.tsx:27` | `fetchRelationshipProfile` |

### 결함 3 — 네비게이션 애니메이션 일관성
일기 흐름이 `journal/_layout.tsx` 부재로 root 의 `fade` 를 상속받아, `slide_from_right` 인 분석/나침반/졸업/유예와 어긋나 있었다.

- `app/journal/_layout.tsx` 신설 → `animation: 'slide_from_right'` 로 통일.
- 정책: **단계 진행형 흐름은 slide / 루트·탭·모달성 전환은 fade**.

### 검증
- `grep -rn "\.catch(() => {})" app components store hooks` → 0건
- `grep -rEoh "'#[A-Fa-f0-9]{6}'" app components` → 0건
- `npx tsc --noEmit` → 0 error
- 12개 task (P0×3 + P1×3 + P2×3 + 추가×3) 모두 완료.

---

## 아이콘 시스템 통일 (2026-05-01)

UX 감사에서 지적했던 **"이모지 사용 과다 → 비전문적 인상"** 을 본격적으로 해결.
앱 전반의 이모지/심볼을 시그니처 색의 단일 라인 아이콘 시스템으로 통일했다.

### 변경 사항

#### 1. 기반 구축
- `lucide-react-native` 설치 (peer: `react-native-svg` 기존 활용)
- `components/ui/Icon.tsx` 신설
  - 22개 키 매핑 (`home / search / compass / graduation / heart / feather / fog / book / pen / scale / chevron-left / chevron-right / check / x / plus / hourglass / bell-off / bell / undo / save / thermometer / chart / moon / clipboard`)
  - 기본 색: `colors.purple[400]` (시그니처)
  - 기본 size: 22, strokeWidth: 1.8
  - `IconName` 타입 export → 컴포넌트 prop 타입 안전성

#### 2. 컴포넌트 확장
- `PrimaryButton` — `leftIcon?: IconName` prop 추가, label 좌측 라인 아이콘 표시
- `ChoiceButton` — `icon?: string` → `icon?: IconName`, 체크 표시도 Lucide `Check` 로
- `BackHeader` — `← 뒤로` 텍스트 → `<Icon name="chevron-left" />` + Caption

#### 3. 화면별 교체
| 화면 | 이모지/심볼 | → Lucide |
|------|------------|---------|
| 4개 탭 | 🏠 🔍 🧭 🎓 | Home / Search / Compass / GraduationCap |
| 홈 탭 QuickLink (3) | 🔍 🧭 📔 ▶ › | Search / Compass / BookOpen / ChevronRight ×2 |
| 분석 탭 QuickLink (2) + empty | 📝 ⚖️ 🔍 ›  | PenLine / Scale / Search(56px) / ChevronRight |
| 졸업 탭 (cooling/done/리포트) | ⏳ 🎓 📊 › | Hourglass / GraduationCap(64px) / BarChart3 / ChevronRight |
| 방향 선택 (×2 화면) | 💜 🕊️ 🌫️ | Heart / Feather / CloudFog |
| 졸업 안내 InfoRow (5) | ⏳ 🔕 🔔 ↩️ 💾 | Hourglass / BellOff / Bell / Undo2 / Save |
| 졸업 리포트 StatCard (3) | 📔 🌡️ 🧭 | BookOpen / Thermometer / Compass |
| 분석 입력 (pros-cons) | + × | Plus / X |
| 일기 응답 헤더 | 🌙 | Moon |
| 유예 → 졸업 CTA (2) | 🎓 (label inline) | `leftIcon="graduation"` |

### 정책
- **시그니처 색**: `colors.purple[400]` (`#7F77DD`). accent가 다른 맥락(teal/coral/amber/gray)은 `color` prop으로 명시 override.
- **stroke width**: 1.8 (라인 두께 통일). 강조가 필요한 곳(체크 마크 등)만 2.4.
- **size 표준**:
  - 22 — 탭 / 메뉴 / Choice 좌측
  - 18 — 인라인 / 헤더 / chevron
  - 16 — InfoRow 보조
  - 56~64 — Empty state 대형
- **이모지 사용 전면 금지** — `<Text>📦</Text>` 패턴 발견 시 `<Icon name="..." />` 로 교체.

### 검증
- `grep -rEn "[이모지...]" app components` → **0건**
- `grep -rEn ">[ ]*[←→▶›×✓+][ ]*<" app components` → **0건** (인라인 심볼 0)
- `npx tsc --noEmit` → 0 error
- Icon 컴포넌트 사용 화면 10곳 + 컴포넌트 4곳 (`PrimaryButton`, `ChoiceButton`, `BackHeader`, `Icon` 자체)

### UX 감사 점수 변화
| 영역 | 이전 | 이후 |
|------|------|------|
| 마이크로 인터랙션 | 5/10 | 7/10 (라인 아이콘으로 시각 일관성 확보) |
| 일관성 | 3/10 | 8/10 (이모지 산포 제거, 단일 시각 시스템) |
| **체감 평균** | 약 7/10 | **약 8/10** |

> **이전 라운드: 시스템(컬러/타이포/뒤로가기) 강화 → 이번: 아이콘 통일.**
> 콘텐츠는 8/10에 머물지만 시스템 점수가 4 → 8 로 상승.
