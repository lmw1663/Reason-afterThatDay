# User Flow — Reason: 그날 이후

> 실제 코드(`router.push` / `router.replace` / `router.back` / `<Link>` 호출)를 근거로 정리한 화면 흐름 문서.
> 기획안이 아니라 **현재 코드에 구현된 사실**만 적는다.
> 마지막 검증: 2026-05-02

---

## 0. 전체 흐름 한눈에

```
[앱 첫 진입]
   │
   ▼
/index ──(Redirect)──▶ /onboarding ─────▶ /onboarding/mood ─(replace)─▶ /(tabs)
                                                                          │
              ┌────────────────────┬─────────────┴──────────────┬─────────────────┐
              ▼                    ▼                            ▼                 ▼
         [홈 탭]              [관계분석 탭]                 [나침반 탭]        [졸업 탭]
            │                      │                            │                 │
   ┌────────┼─────────┐            ▼                            ▼                 ▼
   ▼        ▼         ▼      /analysis/reasons           /compass/index    /(tabs)/graduation
[일기작성][일기조회][다른탭]   → pros-cons               → want                 │ status
   │        │                  → stay-leave             → check                 ├─ default → report → letter → confirm → request
   ▼        ▼                  → result                 → scenario              │                                              │
/journal  /journal/                                     → needle                │                                       (replace)
  index   history                                       → action                ▼                                              ▼
   ↓        ↓                                                                /cooling (7일 유예)                          /cooling
/journal  /journal/                                                              │                                              │
direction   [id]                                                          ┌──────┼──────┐                              ┌──────┼──────┐
   ↓                                                                       ▼     ▼     ▼                                ▼     ▼     ▼
/journal/                                                              checkin  최종확인  취소                       checkin  D-7  취소
question                                                                   (Day 7만)
   ↓                                                                                ▼
/journal/                                                                       /cooling/final
response (replace → /(tabs))                                                        ↓
                                                                          confirmed | reset(7일 연장)
```

---

## A. 진입 / 라우팅 분기

| 화면 | 동작 | 다음 |
|------|------|------|
| `/index.tsx` | `<Redirect href="/onboarding" />` 하드코딩 | 항상 `/onboarding` |
| `/_layout.tsx` | Stack 기반, `headerShown: false`, `animation: 'fade'`, `AppBootstrap` (useAuth/useQuestionPool/usePushNotifications/useOfflineSync) | — |

> **미확정**: 온보딩 완료 여부에 따른 분기는 코드 주석상 "Phase 1 Auth 이후" 로 미구현. 현재는 매번 온보딩 진입.

---

## B. 온보딩 (2단계)

```
/onboarding/index ──push──▶ /onboarding/mood ──replace──▶ /(tabs)
   (날짜 선택)                  (감정 선택)
```

| Step | 화면 | 행동 | 다음 라우팅 | BackHeader |
|------|------|------|-------------|-----------|
| 1/2 | `/onboarding/index` | Calendar로 이별 날짜 선택 → Supabase `breakup_date` upsert + `useUserStore.breakupDate` 저장 | `router.push('/onboarding/mood')` | ❌ |
| 2/2 | `/onboarding/mood` | Pill로 현재 감정 다중 선택 → `onboarding_completed=true` upsert | `router.replace('/(tabs)')` | ❌ |

**특징**: 두 화면 모두 BackHeader 없음. 마지막 단계는 `replace` → 온보딩 재진입 불가.

---

## C. 홈 탭 (`/(tabs)`)

### C-1. 탭 구조 (`/(tabs)/_layout.tsx`)

| 탭 | 경로 | 아이콘 |
|----|------|--------|
| 홈 | `/(tabs)/index` | Home |
| 관계분석 | `/(tabs)/analysis` | Search |
| 결정 나침반 | `/(tabs)/compass` | Compass |
| 졸업 | `/(tabs)/graduation` | GraduationCap |

### C-2. 홈 화면 (`/(tabs)/index.tsx`) 진출 링크

| 트리거 | 라우팅 |
|--------|--------|
| "오늘 일기 쓰기" 버튼 | `router.push('/journal')` |
| "관계 분석" QuickLink | `router.push('/(tabs)/analysis')` |
| "결정 나침반" QuickLink | `router.push('/(tabs)/compass')` |
| "일기 목록" QuickLink | `router.push('/journal/history')` |

**부수 동작**: 포그라운드 진입 시 `refreshDaysElapsed()`, 진입 시 `fetchTodayEntry` + `fetchRecentEntries(30)` 동기화.

---

## D. 일기 작성 흐름 (4단계)

### 진입
- 홈 "오늘 일기 쓰기" → `/journal`
- 나침반 action 화면 "일기 쓰러 가기" → `/journal`

### 단계

```
/journal/index ─push─▶ /journal/direction ─push─▶ /journal/question ─push─▶ /journal/response ─replace─▶ /(tabs)
   (감정 온도)             (방향 선택)              (스마트 질문)               (AI 응답 스트리밍)
```

| Step | 화면 | 핵심 행동 | 다음 라우팅 | BackHeader |
|------|------|----------|-------------|-----------|
| 1/4 | `/journal/index` | MoodSlider(0~10) + 태그 Pill + 자유 메모 | `push('/journal/direction', { score, tags, freeText })` | ❌ |
| 2/4 | `/journal/direction` | 잡고싶어 / 보내고싶어 / 모르겠어 | `push('/journal/question', { ...params, direction })` | ✅ |
| 3/4 | `/journal/question` | 방향별 스마트 질문 답변 (또는 건너뛰기) | `push('/journal/response', { ...params, questionAnswer })` | ✅ |
| 4/4 | `/journal/response` | AI 스트리밍 응답 → 로컬 prepend → DB upsert | `router.replace('/(tabs)')` | ❌ |

**저장 로직 (response.tsx)**:
1. 스트리밍 종료 직후 `local-{ts}` id로 store에 즉시 prepend → history 즉시 반영
2. `userId` 있으면 Supabase 저장
3. 성공 시 서버 응답으로 로컬 엔트리 교체
4. 실패 시 `console.warn` (silent failure 아님)

---

## E. 일기 조회 흐름

```
/(tabs)/index → /journal/history ─push─▶ /journal/[id] ─back─▶ /journal/history
                  (목록)                    (상세, 읽기 전용)
```

| 화면 | 행동 | 라우팅 | BackHeader |
|------|------|--------|-----------|
| `/journal/history` | FlatList로 최근 30개 일기 | `router.push('/journal/${item.id}')` | ✅ |
| `/journal/[id]` | 날짜/온도/방향/태그/메모/AI응답 표시 | `router.back()` | ✅ (label="목록") |

---

## F. 관계 분석 흐름 (4단계)

### 진입
- 탭: `/(tabs)/analysis`
- 데이터 있으면 결과 카드 + "다시 분석" / 없으면 "분석 시작하기"

### 단계

```
/(tabs)/analysis ─push─▶ /analysis/reasons ─push─▶ /analysis/pros-cons ─push─▶ /analysis/stay-leave ─push─▶ /analysis/result ─replace─▶ /(tabs)
                          (이유 선택)                (장단점 입력)              (3가지 슬라이더)             (진단 결과)
                                                                                                              │
                                                                                                              └─push─▶ /compass
```

| Step | 화면 | 핵심 행동 | 다음 라우팅 | BackHeader |
|------|------|----------|-------------|-----------|
| 1/4 | `/analysis/reasons` | 12개 이유 카테고리 Pill 선택 | `push('/analysis/pros-cons')` | ❌ |
| 2/4 | `/analysis/pros-cons` | 장점/단점 탭 전환 + 리스트 입출력 | `push('/analysis/stay-leave')` | ✅ |
| 3/4 | `/analysis/stay-leave` | 극복가능성 / 상대방 마음 / 내 역할 슬라이더 | `push('/analysis/result')` | ✅ |
| 4/4 | `/analysis/result` | `upsertRelationshipProfile` + Meter + 진단 텍스트 | `replace('/(tabs)')` 또는 `push('/compass')` | ❌ |

---

## G. 결정 나침반 흐름 (5단계 + 사전화면)

### 진입
- 탭: `/(tabs)/compass` → "나침반 탐색하기"
- 분석 결과: `result.tsx` 의 `push('/compass')`

### 단계

```
/(tabs)/compass ─push─▶ /compass/index ─push─▶ /compass/want ─push─▶ /compass/check ─push─▶ /compass/scenario ─push─▶ /compass/needle ─push─▶ /compass/action
                       (여정 요약)             (의도)                (5체크)                (3시나리오)              (바늘 시각화)            (행동 제안)
                                                                                                                                                  │
                                                                                                                                                  ├─push─▶ /journal
                                                                                                                                                  └─replace─▶ /(tabs)
```

| Step | 화면 | 핵심 행동 | 다음 라우팅 | BackHeader |
|------|------|----------|-------------|-----------|
| 사전 | `/compass/index` | D+N + 7일 방향 분포 + 평균온도 + 이전 결과 | `push('/compass/want')` | ❌ |
| 1/5 | `/compass/want` | 잡고싶어 / 보내고싶어 / 모르겠어 | `push('/compass/check', { want })` | ✅ |
| 2/5 | `/compass/check` | 5개 예/아니오 + want 가중치로 score 계산 | `push('/compass/scenario', { want, score })` | ✅ |
| 3/5 | `/compass/scenario` | 3개 시나리오 → finalScore 계산 | `push('/compass/needle', { ...params, finalScore })` | ✅ |
| 4/5 | `/compass/needle` | SVG 바늘 -80°~+80° 회전, 5종 verdict 결정 + `addDecision()` | `push('/compass/action', { verdict })` | ❌ |
| 5/5 | `/compass/action` | verdict별 3개 행동 제안 + 주의사항 | `push('/journal')` 또는 `replace('/(tabs)')` | ❌ |

**Verdict 5종**: `strong_catch / lean_catch / undecided / lean_let_go / strong_let_go`

---

## H. 졸업 흐름 (4단계 + 유예)

### 졸업 탭 (`/(tabs)/graduation.tsx`) — 3가지 분기

| status | 화면 | CTA |
|--------|------|-----|
| 일반 | 통계 + 차트 | canGraduate(D+30 & 일기 5개) ? "졸업 신청하기" : "성장 리포트 먼저 보기" → `push('/graduation/report')` |
| `cooling` | 유예 안내 | `push('/cooling')` |
| `confirmed` | 축하 메시지 | 버튼 없음 |

### 졸업 흐름 4단계

```
/(tabs)/graduation ─push─▶ /graduation/report ─push─▶ /graduation/letter ─push─▶ /graduation/confirm ─push─▶ /graduation/request ─replace─▶ /cooling
                          (성장 리포트)              (AI 졸업 편지)              (3확인 질문)                  (졸업 신청 처리)
                                                                                       │
                                                                                       └─replace('/(tabs)') ─▶ "아직 아니야, 돌아갈게"
```

| Step | 화면 | 핵심 행동 | 다음 라우팅 | BackHeader |
|------|------|----------|-------------|-----------|
| 1/4 | `/graduation/report` | 통계 + 7일 차트 + 요약 | `push('/graduation/letter')` | ❌ |
| 2/4 | `/graduation/letter` | `fetchGraduationLetter()` AI 생성 | `push('/graduation/confirm')` | ❌ |
| 3/4 | `/graduation/confirm` | 3개 확인 질문 (allYes 여부 표시) | `push('/graduation/request')` 또는 `replace('/(tabs)')` | ❌ |
| 4/4 | `/graduation/request` | `requestGraduation(userId)` → status='cooling' + `coolingEndsAt = now+7d` | `replace('/cooling')` | ❌ |

**진입 가드**: `request.tsx` 에서 이미 `status === 'cooling'` 이면 `replace('/cooling')` 후 return.
**미로그인 케이스**: `userId` 없으면 로컬 상태로만 유예 진행.

---

## I. 유예 기간 흐름 (7일)

### 대시보드 (`/cooling/index.tsx`)

| 트리거 | 라우팅 |
|--------|--------|
| "자율 체크인" | `push('/cooling/checkin')` |
| Day 7 "최종 졸업 확인" | `push('/cooling/final')` |
| "취소할게" → Alert 확인 → `cancelCooling()` | `replace('/(tabs)')` |
| BackHeader (label="홈") | 홈 복귀 |

**isDay7 판정**: `coolingEndsAt - now < 24h` 일 때만 최종 확인 버튼 노출.

### 체크인 (`/cooling/checkin.tsx`)
- TextInput → `addCheckinResponse(id, response)` (DB 저장, 보존됨)
- 저장 후 또는 "다음에 할게" → `router.back()`
- BackHeader ✅

### Day 7 최종 (`/cooling/final.tsx`)

| 선택 | 동작 | 라우팅 |
|------|------|--------|
| "졸업할게" | `confirmGraduation()` → status='confirmed' | `replace('/(tabs)/graduation')` |
| "아직 아니야, 7일 더" | `resetCooling()` → requested_at 재설정 | `replace('/cooling')` |

BackHeader ❌ (의도된 최종 분기 화면)

---

## J. 라우팅 패턴 정리

### push vs replace 사용 기준

| 케이스 | 패턴 | 이유 |
|--------|------|------|
| 흐름 중간 단계 | `push` | 뒤로가기로 직전 단계 복귀 가능 |
| 흐름 종료 | `replace('/(tabs)')` | 흐름 스택 초기화 — "갇힌 느낌" 방지 |
| 온보딩 완료 | `replace('/(tabs)')` | 재진입 차단 |
| 졸업 신청 완료 | `replace('/cooling')` | 졸업 4단계 스택 초기화 |
| 유예 취소 / 졸업 확정 / 7일 연장 | `replace` | 유예 상태 변경 시 스택 정리 |
| 분석 결과 → 나침반 | `push` | 뒤로가기로 결과 복귀 의도 |
| 나침반 action → 일기 | `push` | 일기 작성 중 나침반으로 복귀 가능 |

### BackHeader 정책 표

| 흐름 구간 | BackHeader | 비고 |
|-----------|:---------:|------|
| 온보딩 전체 | ❌ | 진입 후 비가역 |
| 일기 1단계 (`index`) | ❌ | 탭에서 직접 진입 |
| 일기 2~3단계 (`direction`, `question`) | ✅ | 단계 복귀 가능 |
| 일기 4단계 (`response`) | ❌ | replace로 종료 |
| 일기 조회 (`history`, `[id]`) | ✅ | 목록 ↔ 상세 |
| 분석 1단계 (`reasons`) | ❌ | 탭에서 직접 진입 |
| 분석 2~3단계 | ✅ | 단계 복귀 가능 |
| 분석 4단계 (`result`) | ❌ | replace로 종료 |
| 나침반 사전 (`index`) | ❌ | 탭에서 직접 진입 |
| 나침반 1~3단계 (`want`, `check`, `scenario`) | ✅ | 단계 복귀 가능 |
| 나침반 4~5단계 (`needle`, `action`) | ❌ | 결과/제안 화면 |
| 졸업 1~4단계 | ❌ | "돌아갈게" 버튼으로만 종료 |
| 유예 대시보드 | ✅ (label="홈") | 일상 복귀 |
| 유예 체크인 | ✅ | 간단 입력 |
| 유예 Day 7 최종 | ❌ | 분기 결정 화면 |

---

## K. 코드 미확정 / 주의 사항

1. **온보딩 분기 미구현** — `/index.tsx` 가 항상 `/onboarding` 으로 Redirect. 완료 사용자도 매번 온보딩 진입 가능.
2. **일기 작성 임시 저장 없음** — 작성 중 탭 이동 시 입력 손실 가능.
3. **분석/나침반/졸업 진행 중 진입 가드** — `request.tsx`, `final.tsx` 만 명시적 가드 있음. 나머지는 상태 확인 안 함.
4. **에러 복구 경로 불명확** — 분석/졸업 저장 실패 시 재시도 UI 없음 (console.warn 만).
5. **`local-...` id 잔존** — 일기 저장 시 익명 가입 실패하면 로컬 임시 id가 그대로 남음 (역추적용 마커).
