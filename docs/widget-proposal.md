# 홈 위젯 제안 — 빠른 진입 동선

> 침투 사고·일상 기록의 진입 비용을 줄이기 위한 OS 홈 위젯 도입 제안.
> 상태: **제안 단계** (구현 미진행). 우선순위가 정해지면 별도 Phase로 추진.

## 1. 배경

### 1.1 문제 정의
현재 핵심 빠른 액션들의 진입 비용:

| 동선 | 현재 진입 깊이 | 빈도 |
|---|---|---|
| 갑자기 떠올랐어 (침투 사고) | 앱 실행 → 홈 칩 탭 → 모달 step 1 (호흡) | **돌발·즉시성 ↑** |
| 일기 쓰기 | 앱 실행 → 홈 → 일기 카드 | 매일 |
| 장점·단점 정리 (관계 분석) | 앱 실행 → me 탭 → 분석 진입 | 가끔 |

특히 **"갑자기 떠올랐어"는 돌발 상황 대응**이라 앱을 여는 1~2초가 진입 장벽. CLAUDE.md G-5 주석도 *"항상 접근 가능해야 함"*을 명시.

### 1.2 위젯의 가치
- **잠금화면/홈화면 1탭 진입** — 앱 실행 단계 자체 생략
- 침투 사고처럼 *순간 대응이 효과적인 케어*에 정확히 부합
- 일상 기록은 *접근성 = 지속률*이라 위젯이 일기 빈도 증가에 기여 가능

---

## 2. 후보안

### 2.1 단일 액션 위젯 (권장 1순위)

```
┌─────────────────────┐
│  💜  잠깐, 숨 한 번만 │  ← 1탭 → reason://intrusive
└─────────────────────┘
```

- **하나의 액션만**: "갑자기 떠올랐어"
- 1탭 → deep link `reason://intrusive` → IntrusiveMemoryModal 자동 오픈
- 침투 사고 대응의 **"1초" 가치**를 가장 잘 살림. 메뉴 선택 자체가 인지 부담

**장점**: 단순·빠름. 위젯의 본질 가치 그대로.
**단점**: 일기·분석 같은 다른 빠른 액션은 별도 동선 필요.

### 2.2 메뉴형 위젯 (사용자 제안 안)

```
┌─────────────────────┐
│  reason             │
├──────┬──────────────┤
│ 떠오름 │ 일기        │
├──────┼──────────────┤
│ 장점  │ 단점        │
└──────┴──────────────┘
```

- 4~6개 빠른 액션 그리드
- 각 셀 → 해당 화면 deep link
- 항목 후보: 떠오름·일기·장점·단점·이유·자존감 검사 등

**장점**: 다양한 진입로를 한 곳에 모음, 사용자가 그날 필요한 것 선택.
**단점**: 메뉴 선택의 인지 부담이 위젯의 1초 가치를 갉아먹음. 특히 침투 사고 케이스에선 역효과 가능.

### 2.3 하이브리드 (권장 2순위)

위젯 사이즈별로 다른 변형 노출:
- **Small**: 단일 액션 (잠깐, 숨 한 번만)
- **Medium**: 떠오름 + 일기 2버튼
- **Large**: 메뉴형 (4~6셀)

iOS WidgetKit이 사이즈별 다른 view 정의를 표준 지원. 사용자가 필요에 맞게 선택.

---

## 3. 기술 스택

### 3.1 현재 구조와의 차이

| 항목 | 현재 (Expo Managed) | 위젯 추가 후 |
|---|---|---|
| Native 코드 | 없음 (Expo가 관리) | Swift(iOS) + Kotlin(Android) 추가 |
| 빌드 환경 | `npx expo start` | EAS Dev Client 필수 |
| 구성 | `app.json` | `app.json` + `ios/`, `android/` 디렉터리 |

### 3.2 필요 작업

1. **Expo Prebuild** — `npx expo prebuild`로 native 디렉터리 생성. 이후 native 코드는 git에 포함.
2. **iOS Widget Extension** — Xcode에서 Widget target 추가. WidgetKit + SwiftUI로 view 작성.
3. **Android App Widget** — `RemoteViews` + `AppWidgetProvider` 구현.
4. **데이터 공유** —
   - iOS: **App Group** (`group.com.reason.app`) → UserDefaults·shared 파일
   - Android: SharedPreferences (multi-process mode)
5. **Deep Link 핸들러** — `expo-router` 가 이미 deep link 지원. `reason://intrusive` 라우트 추가.

### 3.3 대안 라이브러리
- [`react-native-android-widget`](https://github.com/sAleksovski/react-native-android-widget) — Android 한정, JSX로 위젯 정의 가능
- iOS 전용 안정적 RN 라이브러리는 없음 (WidgetKit 직접 작성이 표준)

---

## 4. 데이터 흐름

```
[홈화면 위젯 (native)]
        ↓ 1탭
[Deep Link: reason://intrusive]
        ↓
[Expo Router] → IntrusiveMemoryModal 자동 오픈
        ↓
[사용자 응답·저장] → Supabase
```

### 4.1 위젯에 표시할 데이터 (선택)
- D+N (이별 경과일)
- 오늘 일기 작성 여부
- 최근 mood_score

→ App Group / SharedPreferences로 앱 → 위젯 sync. 위젯은 정적 표시 + 1탭 액션이 핵심이므로 **데이터 표시는 부가**.

---

## 5. UX 우려사항

### 5.1 홈 칩 제거는 신중
사용자 제안에 *"홈화면에서는 빼고"*가 있었으나:
- 위젯 추가는 **사용자가 직접 홈에 끌어와야** 함 (대다수가 안 함)
- 위젯 미추가 사용자에게는 핵심 안전 동선이 사라짐
- 침투 사고 대응은 *모든 사용자에게 보장*되어야 함

→ **권장: 위젯 추가 + 홈 칩 유지**. 두 진입로 공존.

### 5.2 메뉴형의 인지 부담
"갑자기 떠올랐어"의 핵심은 *생각할 시간을 주지 않고 호흡으로 유도*. 메뉴 4개를 띄우면 "어디 누르지?" 결정 단계가 추가됨. 침투 사고 케이스에선 단일 액션이 우월.

### 5.3 일관된 톤
위젯 카피도 CLAUDE.md 톤 정합:
- 반말·부드러운 어휘
- 단정 금지 ("정리됐네" X)
- 비난 금지

---

## 6. 작업 체크리스트 (구현 시)

### 6.1 사전 작업
- [ ] Expo Bare/Prebuild 전환 결정 (`app.json` → `ios/`, `android/`)
- [ ] EAS Dev Client 설정
- [ ] iOS App Group ID 등록 (Apple Developer 콘솔)
- [ ] Bundle ID 변경 영향 검토 (위젯은 별도 target)

### 6.2 iOS
- [ ] Xcode Widget Extension target 추가
- [ ] SwiftUI view 작성 (Small/Medium/Large)
- [ ] App Group으로 D+N·mood 등 sync
- [ ] Deep link URL scheme 등록 (`reason://`)

### 6.3 Android
- [ ] AppWidgetProvider 추가
- [ ] RemoteViews layout XML
- [ ] SharedPreferences sync
- [ ] Deep link intent-filter

### 6.4 RN 측
- [ ] Deep link 라우트 (`reason://intrusive` → IntrusiveMemoryModal 자동 오픈)
- [ ] `expo-router` linking 설정 확인
- [ ] App Group/SharedPrefs에 sync할 데이터 결정 (D+N·mood 등)

### 6.5 검증
- [ ] iOS Simulator·실기기에서 위젯 추가·탭 테스트
- [ ] Android 에뮬레이터·실기기 위젯 테스트
- [ ] 잠금화면 위젯 (iOS 16+) 동작 확인
- [ ] App Store/Play Store 심사 가이드라인 준수

---

## 7. 미루는 항목 (결정 필요 시)

- **단일 액션 vs 메뉴형 vs 하이브리드** 중 어느 안으로 갈지
- 메뉴형 선택 시 항목 우선순위 (떠오름·일기·장점·단점·이유·자존감 검사 중 무엇을)
- 위젯에 표시할 데이터 (없음/D+N/일기 작성 여부 등)
- 잠금화면 위젯 지원 여부 (iOS 16+ Lock Screen Widget)
- 작업 시점 — 별도 Phase로 분리 vs 다음 안정성/UX 라운드에 포함

---

## 8. 참고

- iOS WidgetKit: https://developer.apple.com/documentation/widgetkit
- Android AppWidget: https://developer.android.com/develop/ui/views/appwidgets
- Expo Prebuild: https://docs.expo.dev/workflow/prebuild/
- 본 문서는 *제안*이며 구현 결정·우선순위는 별도 회의로 정함
