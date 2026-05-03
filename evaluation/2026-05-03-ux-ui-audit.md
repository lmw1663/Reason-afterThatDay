# UX/UI 평가 — Reason: 그날 이후

> 평가일: 2026-05-03
> 관점: UX/UI 전문가 / grief-care 제품 기준 엄격 평가
> 평가 범위: 전체 화면(`app/`), 컴포넌트 시스템(`components/`), 디자인 토큰(`constants/`)

---

## 한 문장 평가

> **"기능적으로 야심차지만, 사용자가 슬픔 속에서 안전히 머물 수 있는 *방*은 아직 만들어지지 않았다."**

가장 큰 문제는 *결정 보조 도구*(분석/나침반/졸업)와 *애도 공간*(일기/떠올랐어/추억)이 같은 평면에 놓여 같은 비중으로 보인다는 것. D+N에 따라 우선 노출 트랙을 동적으로 바꿔야 진정한 "회복 도구"가 됨. 지금은 도구 모음(toolbox)이지 회복의 동반자(companion)는 아님.

---

## 전제

이 앱의 핵심은 **회복 중인 사람**을 다루는 것. 사용자는 인지능력·집중력·동기가 모두 낮은 상태로 들어옴. 그 관점에서 엄격하게 평가하면, **현재 상태는 "기능 풍부한 자기관리 도구"에 가깝지, "이별 후의 안전한 공간"에는 미달**.

---

## 🔴 Critical — 핵심 사용성/감정 안전성 문제

### 1. 홈 화면이 *grief 앱*이 아니라 *대시보드*다

**파일**: `app/(tabs)/index.tsx`

현재 구조:
```
헤더 + D+N 배지
오늘의 한마디 (InsightCard)
일기 CTA (1~2개)
빠른 진입 (떠올랐어 / 나에 대해) — 카드 2개
QuickLink (일기 목록 / 추억 돌아보기 / 추억 정리) — 3개
```

**최대 7개 CTA**가 동시에 노출됨. 이별 D+3에 무기력한 사용자에게 7개 결정을 강요하는 건 잔인함.

**비교**: 명상 앱(Calm/Headspace)은 첫 화면에 *오늘 추천 1개* + 부가 1~2개만 노출.

**처방**: 홈은 *오늘 무엇을 할지 결정해주는 화면*이어야 함. D+N과 최근 감정 온도를 보고 시스템이 1개 권장 액션만 띄우고, 나머지는 "더 보기" 뒤로 숨길 것.

---

### 2. "추억 돌아보기"와 "추억 정리" 동시 존재 — 사용자가 절대 이해 못 함

**파일**: `app/(tabs)/index.tsx:213, 219`

홈에 둘 다 노출됨:
- `/memory` = AI 회상 가이드
- `/memories` = 자유 메모장

이름만으로 차이를 알 수 없음. 코드를 봐야 비로소 정체 파악. 게다가 `app/journal/`에도 또 다른 일기 트랙. **"기록 비슷한 화면"이 5개**:

| 경로 | 정체 |
|------|------|
| `journal/` | 4단계 일기 |
| `journal/mini` | 감정 온도만 |
| `journal/today` | 오늘 일기 수정 |
| `memory/` | AI 회상 |
| `memories/` | 메모장 |

**처방**: 두 트랙을 통합하든 한쪽을 묻어야 함. 이름이 충돌하는 채로 두면 첫 사용자는 100% 헤맴.

---

### 3. 진단·나침반·졸업이 *결정-보조 트랙*인데 D+1부터 진입 가능

**파일**: `app/(tabs)/_layout.tsx`

탭바에 "관계분석/나침반/졸업"이 항상 노출. CLAUDE.md에 "D+0~7엔 부드러운 만류" 규칙이 있지만 *진입 자체*는 막지 않음. 이별 다음 날 손이 떨려서 들어가면 "회복 가망 67%" 같은 수치를 봄 — **반추(rumination) 가속의 정확한 정의**.

**처방**: 탭바를 시점별로 동적 노출 / dim 처리. D+0~7은 일기·떠올랐어·자원만 살리고 나머진 회색.

---

### 4. 색 시스템이 7개 패밀리 — 의미 인플레이션

**파일**: `constants/colors.ts`

`purple/teal/coral/pink/amber/blue/gray` — 각 색이 무엇을 뜻하는지 *어디에도 명시 안 됨*. 결과:

| 색 | 같은 색이 의미하는 것들 |
|----|----------------------|
| teal | "보내기"(history) + "감정 흐름"(analysis/result) + "정보 박스"(cooling) |
| amber | "Day 6 미래" + "경고" + "긍정 8~9점 mood" |
| coral | "분노" + "단점" + "DANGER_OBSESSION" |

색이 의미를 잃으면 사용자는 색을 무시 → 색이 있을 의미가 없어짐.

**WCAG 위반**: `teal[400]=#1D9E75` / `amber[400]=#BA7517`는 다크 bg(`#0E0E12`) 위에서 명도 대비 4.5:1 미달. 차트 라인·작은 텍스트는 거의 안 보임.

**처방**: 4색으로 압축
- `purple` (브랜드/긍정)
- `gray` (중립/UI)
- 빨강 계열 1개 (경고/위기 only)
- 파랑 계열 1개 (차분/let_go)

다크 톤 위에선 `400`보다 `300` 또는 lighter 톤 도입 필요.

---

### 5. *Reassurance fatigue* — "정답이 아니야"가 도처에

**파일**: `compass/want.tsx:135`, `journal/direction.tsx:117`, `compass/action.tsx`, `cooling/index.tsx` 외 다수

검색 결과 6개 화면에서 "자연스러운 거야 / 그럴 수 있어 / 정답이 아니야" 패턴 반복. 처음엔 위로지만 *매번 같은 톤*으로 나오면 사용자는:

1. "AI가 책임 회피하는 disclaimer구나" 학습
2. 점차 무시
3. **결국 진짜 위험 신호(EmotionalCheckModal의 핫라인 안내)도 같은 강도로 인식 → 위기 신호 둔감화**

**처방**: 위기/저강도/중강도 안전 메시지의 *시각적 위계*를 분리. 일반 disclaimer는 회색 작은 글씨, 위기 자원은 강한 톤으로 명확히 구분.

---

## 🟡 Major — 경험 훼손

### 6. BackHeader가 스크롤 안에 있어서 긴 화면에서 사라짐

**파일**: `app/journal/direction.tsx:43`, `app/analysis/pros-cons.tsx:66` 외 다수

모바일은 *영구 고정 상단 바* 패턴이 표준. 현재는 `pt-14` 안의 ScrollView 첫 자식으로 들어 있어서 아래로 내려가면 사라짐 → 사용자가 뒤로 가려면 위로 올라가야 함. PrimaryButton은 항상 하단 고정인데 BackHeader만 비대칭.

---

### 7. ProgressDots가 0-indexed인데 텍스트는 1-indexed

**파일**: `app/journal/index.tsx:128, 198`

같은 화면에서:
- 텍스트: "이별 일기 · **1 / 4**"
- ProgressDots: `total={4} current={0}` → **0/4**

같은 화면에서 1/4과 0/4 동시 노출 = 사용자 혼란. 둘 중 하나로 통일 필수.

---

### 8. 일기 4단계 / 나침반 5단계 — 무기력 상태 사용자에게 너무 길다

일기는 mini 모드(감정 온도만) 추가했지만 *디폴트가 여전히 4단계*. 무기력한 사용자에게 첫인상이 "오늘 4단계 채워야 함"이면 회피.

나침반은 5단계 끝에서야 결과가 나옴 — 중간에 이탈하면 데이터 사라져 "30초 동안 5문제 풀었는데 결과 없음" 경험.

**처방**: 나침반은 단계마다 *임시 결과* 노출. "지금까지의 답변이라면 이런 방향이야" — 이탈 시점에서도 가치를 줘야 함.

---

### 9. 빈 상태(empty state) 처리 누락

| 화면 | 현재 |
|------|------|
| `journal/history.tsx` | 일기 0개 → 빈 화면 |
| `about-me/index.tsx` | 6개 모두 미완 → 그리드만 덩그러니 |
| `compass/index.tsx` | "아직 일기 안 썼어" 한 줄, 어디 가서 쓰는지 안내 없음 |

빈 상태는 *온보딩의 연장*. 지금은 빈 화면 같음.

---

### 10. 모달 4종이 시각적으로 비슷

`IntrusiveMemoryModal`, `EmotionalCheckModal`, `CoolingOffWarningModal`, 일반 `Modal` — 모두 다크 surface + 둥근 모서리 + 본문 텍스트.

위기용(`EmotionalCheck`)이 일상용(`CoolingOff`)과 외형이 같으면 "또 그 안내구나" 무시. **위기 모달은 눈에 띄게 다른 시각적 패턴**(색상, 아이콘, 진동)이어야 함.

---

### 11. Card variant 5개 + tone 2개 = 사용 규칙 미문서화

**파일**: `components/ui/Card.tsx`

`default / accent / warning / subtle` × `soft / weak`. 같은 정보(예: "이전에 너는 이렇게 답했어")가 한 화면에선 `Card border border-gray-700`, 다른 화면에선 `Card variant="subtle" accent="purple"`. 일관성 없음.

---

## 🟢 Minor — 마감 디테일

### 12. Korean 타이포그래피 미세조정 부재

**파일**: `components/ui/Typography.tsx`

영문 기준 라인 하이트(`leading-relaxed`) 사용. 한글은 자간/행간이 다른데 `letterSpacing`이나 한글 친화 lineHeight 설정 없음. 읽기 피로도 약간 증가.

---

### 13. D+N 배지가 헤더에 작게 박혀서 *심리적 의미*를 못 살림

홈 우상단 작은 보라색 캡슐. 이 앱의 정체성이 "시간이 흐르는 걸 안전하게 관찰하는 도구"라면 D+N은 더 *서사적*으로 보여야 함. 작은 배지는 너무 사무적임.

---

### 14. Onboarding 너무 짧음

**파일**: `app/onboarding/`

3화면(date / duration / mood)뿐. *왜 이 앱을 쓰는가*에 대한 첫 약속이 없음. "여기서 너는 무엇을 얻을 거야"가 빠짐 → retention 문제로 이어짐.

---

## 🎯 추천 우선순위 (Top 3)

| # | 작업 | 효과 | 비용 |
|---|------|------|------|
| 1 | **홈 화면 단일 추천 액션화** + 추억 트랙 통합 | 첫인상 명확화, 이탈률 ↓ | 중 |
| 2 | **색 시스템 4색으로 축소 + 다크 대비 보정** | 가독성·일관성 동시 해결 | 중 |
| 3 | **위기 신호 시각 위계 분리** (모달/색/문구 차등화) | 안전 책임 — 가장 중요 | 작 |

---

## 부록: 적용 시 점검할 곳

### Critical 1 (홈 단일화) 작업 시
- `app/(tabs)/index.tsx` 전체 재구성
- D+N과 최근 7일 mood 평균을 input으로 받는 추천 엔진 함수 1개 (`utils/dailyRecommendation.ts` 신설 권장)
- 기존 6개 CTA는 "더 보기" 시트 하나로 collapse

### Critical 2 (추억 통합) 작업 시
- `app/memory/`와 `app/memories/`를 하나로 합치고, 진입점은 `/memories`로 단일화
- `memory/index.tsx`의 카테고리 회상 흐름은 *내부 옵션*으로 흡수
- 라우팅 변경 시 기존 링크 (홈, 일기 detail 등) 동기화 필요

### Critical 4 (색 시스템) 작업 시
- `constants/colors.ts` 토큰 재정의
- `tailwind.config.js`도 동기화 (CLAUDE.md 규칙)
- 영향 범위: `app/journal/history.tsx`, `app/graduation/report.tsx`, `app/analysis/result.tsx`, `components/ui/MoodSlider.tsx`, `components/ui/MoodChart.tsx`, `utils/diagnosis.ts`(VERDICT_COLOR)
- WCAG 검증: 모든 텍스트/UI가 4.5:1 이상 대비

### Critical 5 (위기 신호 위계) 작업 시
- `components/EmotionalCheckModal.tsx`의 시각 패턴을 다른 모달과 *명확히* 분리 (예: coral 배경, 큰 아이콘, 진동)
- `app/resources/hotline.tsx` 진입 강조
- 일반 disclaimer("정답이 아니야")는 가장 약한 회색 톤으로 일괄 다운그레이드

---

*평가 기준 문서: `CLAUDE.md`, `docs/guide/01-product-principles.md`, `docs/psychology-analysis.md`*
