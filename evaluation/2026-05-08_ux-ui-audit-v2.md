# UX/UI 평가 v2 — Reason: 그날 이후

> 평가일: 2026-05-08
> 관점: UX/UI 전문가 / grief-care 제품 기준 엄격 평가
> 비교 기준: `2026-05-03-ux-ui-audit.md` (v1)
> 평가 범위: 전체 화면(`app/`), 컴포넌트 시스템(`components/`), 디자인 토큰(`constants/`)

---

## 한 문장 평가

> **"toolbox에서 companion으로 한 걸음 들어왔다. 이제 한 걸음만 더 비우면 출시 가능."**

v1 시점의 "기능 풍부한 자기관리 도구" 인상은 사라짐. 3탭(오늘/기록/나) 재편 + 페르소나 우선 카드 + FAB 분리 + 일기 CTA 단일화로 *시각 위계*가 정리됐어. 다만 **[기록] 탭 6카드의 인지 충돌**과 **late_night CTA 불일치 잔존**이 v2의 두 가지 잔존 결함.

---

## v1 → v2 해소 현황

| v1 항목 | 해소 | 핵심 |
|---|---|---|
| C1 — 홈 7개 CTA 동시 노출 | ✅ 거의 해소 | 일기 CTA 단일화, FAB 분리, 보조카드 묶음화 |
| C2 — 추억 트랙 명칭 충돌 (`memory/`+`memories/`) | ⚠️ 부분 해소 | 두 폴더는 남아있으나 [기록]→추억 1개로 진입점 통합 |
| C3 — 탭바 시점별 동적 노출 | ✅ 해소 | D+7 baseline + 페르소나별 게이트 카드 subtitle 노출 |
| C4 — 색 7색 인플레이션 / WCAG | ⚠️ 미확인 | `constants/colors.ts` 토큰 자체는 그대로, 사용 빈도는 정리됨 |
| C5 — 모달 위계·쿨다운 | ✅ 해소 | crisis_modal 충돌 닫기 비활성·트래킹 추가 |
| M6 — BackHeader 영구 고정 | ✅ 일관됨 | 흐름 화면 표준화 |
| M7 — ProgressDots 인덱싱 | ✅ 일관됨 | 0-base 통일 |
| M8 — 일기 4단계 디폴트 단축 | ✅ 해소 | mini-mode primary로 분기 |
| M9 — 빈 상태 처리 | ⚠️ 부분 | 일기 CTA·history 일부 보강 |
| M10 — reassurance fatigue | ✅ 해소 | shame-guilt 카드 1회만 등 dismissable 정책 |
| M11 — Card variant 사용 규칙 | ⚠️ 미문서화 | 사용 패턴은 안정 |

---

## 🔴 Critical (잔존)

### 1. late_night 모달 CTA 약속-동작 불일치

**파일**: `components/EmotionalCheckModal.tsx:84~89`

```tsx
function handlePrimary() {
  onClose();
  if (type === 'consecutive_low') {
    router.push('/resources/hotline');
  } else {  // late_night
    router.replace('/(tabs)');  // ← "호흡하기"인데 홈으로 replace
  }
}
```

`BreathingGuide` 컴포넌트가 이미 있는데도 연결 안 됨. **새벽 위기 신호로 모달이 떴는데 "호흡하기" 누르니 홈**이 첫 신뢰 손상 지점. 다른 모든 안전 정책의 무게를 깎아 먹는 수준.

**수정**: BreathingGuide를 모달 내부에서 step 전환으로 띄우거나 `/safety/breathing` 라우트로 push.

---

### 2. DEV 페르소나 라벨 홈 노출

**파일**: `app/(tabs)/index.tsx:211~216`

```tsx
{__DEV__ && (
  <Caption className="text-amber-400 mt-2" style={{ fontSize: 11, fontFamily: 'monospace' }}>
    [DEV] persona: {personaPrimary ?? '—'}
    {personaSecondary ? ` · ${personaSecondary}` : ''}
  </Caption>
)}
```

production은 `__DEV__` 가드로 자동 제거되지만, 본인이 코멘트에 *"출시 전 제거 또는 디버그 패널로 이관"*으로 적어둠. **CLAUDE.md의 "페르소나 라벨 비노출" 절대 규칙과 정면 충돌**할 수 있는 코드라 출시 전 별도 디버그 패널(`__DEV__` 단독 화면)로 이관 권장.

---

## 🟠 P1 (출시 전 권장)

### 3. [기록] 탭 6카드 인지 충돌

**파일**: `app/(tabs)/records.tsx:88~127`

| 카드 | 진입 |
|---|---|
| 일기 모아보기 | `/journal/history` |
| 추억 | `/memories` |
| 회복의 결 | `/recovery-trace` |
| 질문통 | `/question-pool` |
| 내가 답한 질문 | `/answers` |
| 매듭의 흔적 | `/knot/archive` |

문제:

- **"일기 모아보기" vs "내가 답한 질문"** — 둘 다 시간순 텍스트 archive로 인식. 차이가 라벨에서 안 보임.
- **"질문통(인풋)" vs "내가 답한 질문(아웃풋)"** — 평행 라벨이라 인풋/아웃풋 관계 불명.
- **"추억" vs [기록] 탭 자체** — 카테고리명 충돌 잠재.

**권장**:
1. `질문통` 화면 내부에 `(미답)` `(답함)` 탭으로 통합 → `내가 답한 질문` 카드 제거.
2. 또는 `내가 답한 질문`을 `질문통` 하위 진입(secondary CTA)으로 격하.
3. 결과적으로 [기록] 탭은 5카드로 압축.

---

### 4. 카드 disabled 상태 시각 단서 부족

**파일**: `app/(tabs)/me.tsx:178~199`

```tsx
disabled
  ? subtitle 변경 + opacity 0.5 + chevron 제거
  : 활성
```

- subtitle만 바뀌면 *왜 잠겼는지*는 보이지만 *잠금 상태*임이 한눈에 안 박힘.
- accessibilityState `{ disabled }`만 의지하지 말고 lock/hourglass 아이콘을 시각적으로 노출 권장.

```tsx
<Card>
  <Icon name={icon} ... />
  <View>
    <Body>{title}</Body>
    <Caption>{subtitle}</Caption>
  </View>
  {disabled ? <Icon name="hourglass" /> : <Icon name="chevron-right" />}
</Card>
```

`disabled && reason === 'gate'` 일 때만 hourglass, `'lock'` 일 때 lock — 잠금 사유에 따라 분기.

---

### 5. 나침반 "5단계" 헤더의 무게

**파일**: `app/compass/want.tsx:62`

```
결정 나침반 · 1 / 5
솔직하게, 지금 뭘 원해?
```

- 톤은 좋음. 그러나 `결정 나침반 · 1 / 5`가 *공식 어세스먼트* 인상을 줘.
- D+7 게이트 + 페르소나 차단으로 안전선은 잘 만들었지만 *진입 후 사용자에게 결정 절차 인상*은 임상 톤과 균열.

**권장**:
- 헤더 `오늘의 방향` 또는 `오늘 마음 살피기 · 1/5`로 통일.
- `결정 나침반` 어휘는 [나] 탭 진입 카드(`오늘의 방향`)와도 라벨 불일치 — 통일.

---

### 6. PersonaPriorityCard "왜 떴는지" 메타 부재

**파일**: `components/PersonaPriorityCard.tsx`

- 페르소나 라벨 비노출 정책으로 사용자는 *알고리즘 불투명성*으로 받아들일 위험.
- 한 줄 메타 카피 추가 권장: *"네가 적은 답들을 보고 골랐어"* 류.
- 24h dismiss 정책은 좋음. 그러나 dismiss 했을 때 다음 카드가 *왜 또 다른 색깔*인지가 안 보여.

---

## 🟡 Minor (출시 후)

### 7. [기록] 탭 카피 추상도 불일치

`너에 대해 알아가기` `네가 걸어온 길` `그날 이후` — 시적이지만 [기록]만 추상도가 더 높음. 첫 사용자에게 "기록"이 무엇을 담는지 부설명 한 줄(`Body`) 추가.

### 8. ScreenWrapper fadeUp 일관성 검증

`fadeUp` 애니메이션이 화면 전환마다 적용되는지 *측정* 필요. 모달은 별도 spring이라 위계가 분리되어 있는데, 모달→화면 전환 시 미세 jitter가 있는지 디바이스에서 확인.

### 9. WCAG 4.5:1 보정 (v1 C4 잔존)

다크 bg 위 `teal[400]`/`amber[400]` 명도 — 도구로 측정하지 않은 상태. `/recovery-trace` 차트는 색상 의존도 높음. 출시 전 색맹 시뮬레이터 1회 통과 필요.

### 10. ContactUrgeChip 7일 추세 막대 의미 학습

- 첫 노출 시 *왜 이 위젯이 있는지* 설명이 없음.
- 페르소나 비노출 게이팅으로 노출 자체가 선별되긴 하지만, 노출된 사용자에겐 메타 한 줄("연락 충동을 적어두면 추세를 볼 수 있어") 권장.

---

## 시각 시스템 — 칭찬 1

`InsightCard` accent border + tag/title/body 위계는 동급 grief 앱 통틀어 *가장 깔끔한 카드 시스템* 중 하나. 색만 갈아 끼우면 어떤 컨텍스트에도 들어맞아 — 디자인 토큰의 *정체성*이 됨.

---

## 종합 점수

| 축 | v1 점수 | v2 점수 | Δ |
|---|---|---|---|
| 시각 위계 | 60 | 85 | +25 |
| 정보 구조 | 55 | 82 | +27 |
| 발견성 | 50 | 75 | +25 |
| 일관성 | 70 | 88 | +18 |
| 빈 상태/에러 | 55 | 78 | +23 |
| **종합 UX** | **58** | **82** | **+24** |

---

## 우선순위 PR 제안

### PR-A (출시 전 필수, 1~2일)
- 1번 late_night → BreathingGuide 연결
- 2번 DEV 라벨 디버그 패널 이관
- 3번 [기록] 탭 카드 통합

### PR-B (출시 직후, 1주)
- 4번 disabled 시각 단서
- 5번 나침반 헤더 통일
- 6번 PersonaPriorityCard 메타 카피

### PR-C (다음 스프린트)
- 7~10번 카피·접근성·세부 다듬기
