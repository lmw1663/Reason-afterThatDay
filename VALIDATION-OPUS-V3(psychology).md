# VALIDATION-OPUS-V3(psychology).md — 6-0/6-11 추가 후 검증

> **검증 결과**: **70% 동기화** (6-0/6-11 자체 설계는 좋으나 실제 DB와 충돌)
>
> 이번 검증은 **실제 supabase/migrations/ 파일을 확인**하여 진행.
> 그 결과 **2개의 치명적(Critical) 결함**과 **15개의 부수 결함**을 발견했습니다.
> Critical 결함은 마이그레이션을 그대로 실행하면 **DB 오류**가 발생하는 수준입니다.

---

## 🚨🚨 CRITICAL 결함 (코드 작성 즉시 실패)

### 결함 C-1: 마이그레이션 번호 005 **이미 존재** — 번호 충돌

**실제 supabase/migrations/ 파일**:
```
001_initial_schema.sql
002_rls_policies.sql
003_question_pool_seed.sql
005_question_pool_additions.sql ← 이미 존재! (004는 deleted)
```

**TODO(psychology).md에 명시한 신규 마이그레이션**:
```
005_emotion_layers.sql       ← ❌ 충돌!
006_affection_level.sql
007_cooling_reflections.sql
...
014_relationship_duration.sql
```

**문제**: 005는 이미 *나침반 체크 + 졸업 회한 질문 추가*용으로 사용 중 (`005_question_pool_additions.sql`). 같은 번호로 새 마이그레이션을 만들면 **CI/CD 또는 supabase db push에서 에러**.

**해결 방법**: 모든 신규 마이그레이션 번호를 **+1 시프트**:
```
005_emotion_layers.sql           → 006_emotion_layers.sql
006_affection_level.sql          → 007_affection_level.sql
007_cooling_reflections.sql      → 008_cooling_reflections.sql
008_intrusive_memory.sql         → 009_intrusive_memory.sql
009_pros_cons_timeline.sql       → 010_pros_cons_timeline.sql
010_journal_mini_mode.sql        → 011_journal_mini_mode.sql
011_graduation_farewell.sql      → 012_graduation_farewell.sql
012_memory_organization.sql      → 013_memory_organization.sql
013_self_reflections.sql         → 014_self_reflections.sql
014_relationship_duration.sql    → 015_relationship_duration.sql
```

또는 **빠진 004 자리 활용** (004가 deleted 상태):
```
004_pg_cron_setup.sql 자리에 "복구된 004"라고 명시하거나 별도 처리
```

---

### 결함 C-2: journal_entries 실제 컬럼명과 TODO의 컬럼명 불일치

**실제 DB (`001_initial_schema.sql`)**:
```sql
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users not null,
  created_at  timestamptz default now(),
  mood_score  int check (mood_score between 1 and 10),  -- ← 감정 온도
  mood_label  text[],                                    -- ← 감정 라벨 (이미 존재!)
  direction   text check (direction in ('catch', 'let_go', 'undecided')),
  free_text   text,
  ...
);
```

**TODO(psychology).md 6-1에 명시**:
```sql
ALTER TABLE journal_entries
  ADD COLUMN emotion_labels JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ❌ 새로 추가?
  ADD COLUMN physical_signals JSONB NOT NULL DEFAULT '[]'::jsonb;
```

**문제 1**: `mood_label TEXT[]`이 **이미 존재**. `emotion_labels JSONB`를 추가하면 **이중 필드**.

**문제 2**: TODO의 다른 곳에서 사용한 `temperature`라는 컬럼은 실제로 **`mood_score`**.

**문제 3**: TODO 7-1 draft 데이터 구조:
```typescript
mood: {
  temperature: number;       // ❌ 실제는 mood_score
  emotionLabels: string[];   // ❌ 실제는 mood_label
  physicalSignals: string[]; // 신규
  freeText: string;          // ✅ 실제는 free_text
}
```

→ 4개 필드 중 3개가 실제 DB와 불일치.

**해결 방법 A** (권장): TODO를 실제 DB에 맞춤
- `temperature` → `mood_score`로 모두 치환 (수십 곳)
- `emotion_labels JSONB` 추가 X — 기존 `mood_label TEXT[]`을 활용
- `physical_signals JSONB`만 새로 추가

**해결 방법 B**: 실제 DB를 TODO에 맞춰 변경
- `mood_score` → `temperature`로 RENAME (큰 위험, 기존 데이터/쿼리 영향)
- `mood_label TEXT[]` → `emotion_labels JSONB`로 변환

→ A안이 안전. 단, TODO 본문 전체 치환 필요.

---

## 🟡 부수 결함 (15건)

### 결함 V3-3: CoolingOffWarningModal에 신규 prop 누락

6-11에서 사용:
```typescript
<CoolingOffWarningModal
  visible={showCoolingOff}
  day={daysSinceBreakup}
  contextMessage="아직 너 자신을 깊이 묻기엔 일러..."  ← 신규 prop
  onProceed={...}
  onCancel={...}
/>
```

하지만 6-6의 컴포넌트 정의에는 `contextMessage` prop 없음. 6-6 메시지는 *분석/나침반 만류* 톤으로 고정 ("결정을 미뤄둬, 반추 위험").

**심리학적으로 다른 톤**:
- 6-6: "조기 분석 → 반추 위험" (인지적)
- 6-11: "조기 자기 성찰 → 부담" (정서적)

**해결**: 6-6 컴포넌트에 `contextMessage` prop 추가, 또는 6-11에서 별도 모달 사용.

---

### 결함 V3-4: 온보딩 mood 화면 step 표기 변경 누락

기존: 2단계 (날짜 → 감정)
- `/onboarding/index`: "Step 1/2"
- `/onboarding/mood`: "Step 2/2"

신규 6-0: 3단계 (날짜 → **기간** → 감정)
- `/onboarding/index`: "Step 1/3" (변경)
- `/onboarding/duration`: "Step 2/3" ✅ 명시됨
- `/onboarding/mood`: "Step 3/3" ❌ **변경 명시 누락**

→ 연쇄 변경 누락. 구현 시 mood 화면 표기도 수정 필요.

---

### 결함 V3-5: `mergeOrCreateReflection` 함수 정의 누락

6-3 Day 5/6 hook 코드:
```typescript
await mergeOrCreateReflection('love_self', prefix + text);
```

이 함수가 정의되지 않음. `updateReflection`(6-11에서 정의됨)과 어떻게 다른지 명시 X.

또한 **prefix 누적 방식의 데이터 구조적 결함**:
- 사용자가 6-11 카테고리 1을 직접 답변한 후, Day 5에서 또 prefix가 붙은 텍스트가 누적됨
- 사용자 입장에서 "내가 쓴 답변" vs "시스템이 누적한 답변" 구분 불가
- *수정 가능* 정책 — 6-11에서 답변 수정해도 다음 Day 5에 또 누적되는 무한 루프 위험

**해결**: `self_reflections`에 `source` 컬럼 추가 — 'manual' | 'cooling_day5' | 'cooling_day6'. UI에서 source별로 다르게 표시.

---

### 결함 V3-6: relationship_duration_months 데드 필드

마이그레이션 014 (or 015):
```sql
ALTER TABLE users
  ADD COLUMN relationship_duration_range TEXT ...,
  ADD COLUMN relationship_duration_months INT ...;
```

본문 명시: "`relationship_duration_months`은 향후 설정 화면에서 정확한 값 입력 시 사용"

**문제**: 설정 화면이 현재 앱에 없고, 추가하는 항목도 명시되지 않음. → **활용 경로 없는 데드 필드**.

**해결 옵션**:
- A: months 필드 빼고 range만 사용
- B: 6-12로 "설정 화면" 추가 (사용자 정보 수정 가능 화면)

---

### 결함 V3-7: 6-11 hook (자존감 흔들림) 시점 일관성 위반

명세:
```
"자존감 흔들림" 라벨 선택 시 → /journal/response 끝에 권유 카드
→ /about-me/self_love 카테고리로 push
```

**문제**: 
- D+8 미만 사용자도 "자존감 흔들림" 라벨 선택 가능
- 권유 카드 클릭 시 → CoolingOffWarningModal 만류 → 사용자 혼란
- 권유했는데 막는 *self-defeating UX*

**해결**: 권유 카드 자체를 D+8 이상에서만 노출하는 조건 추가.

---

### 결함 V3-8: P1-A 8개 — 우선순위 묽어짐

P1-A 항목:
1. 6-0 (온보딩 확장)
2. 6-1 (감정 라벨)
3. 6-5 (떠오름)
4. 6-6 (D+7 게이트)
5. 6-7 (시간성 명시)
6. 6-11 (자기 성찰)
7. 7-1 (draft)
8. 7-3 (재시도 UI)

**8개는 너무 많음**. P1-A의 본래 의미는 "가장 효과 높음"인데 8개면 우선순위 의미 약함.

**또한 6-11은 6-1에 의존** (감정 라벨 시스템 활용) — 즉 6-11은 *6-1 이후* 가능. P1-B로 내리는 게 적절.

**권고 재정렬**:
- P0: 7-4 (생명 안전)
- P1-A (필수, 의존성 없음): 6-1, 6-5, 6-6, 6-7, 7-1, 7-3
- P1-B (필수, 의존성 있음): 6-0, 6-11 (서로 의존), 6-2, 6-3, 6-4
- P2: 6-8, 6-9, 7-2
- P3: 6-10, 회복 신호

---

### 결함 V3-9: ReflectionCard, Grid, ReflectionDisplay 컴포넌트 미정의

6-11 코드에 등장하지만 정의 X:
- `<ReflectionCard>` — 그리드 카드 (신규)
- `<Grid>` — 2x3 레이아웃 (신규? 기존?)
- `<ReflectionDisplay>` — 이전 답변 표시 (신규)
- `<PillGroup>` — 다중 선택 Pill (기존? 신규?)
- `<Card>` — 일반 카드 (기존?)

**문제**: 디자인 시스템에 있는지 새로 만드는지 불명확.

**해결**: 6-11 구현 체크리스트에 "디자인 시스템 확인 + 미존재 시 신규 작성" 명시.

---

### 결함 V3-10: 자기애 슬라이더 min/max 누락 + 초기값 복구 로직 미구현

```typescript
<Slider value={draft.score} onValueChange={s => setDraft({...draft, score: s})} />
```

**문제 1**: `min`, `max` 누락 (DB는 `BETWEEN 1 AND 10`이지만 UI는 0~10일 수도)

**문제 2**: 이전 답변(`current.score`)이 있으면 `draft.score`를 그 값으로 초기화해야 함. 코드에 그 로직 없음.

```typescript
useEffect(() => {
  if (current) {
    setDraft({
      score: current.score ?? 5,
      labels: current.labels ?? [],
      text_response: current.text_response ?? ""
    });
  }
}, [current]);
```

→ 이런 초기화 로직 누락.

---

### 결함 V3-11: `fetchCurrent` 함수 본문 누락

```typescript
useEffect(() => {
  fetchCurrent();
}, []);
```

→ 함수 정의 본문 없음. 추정 가능하지만 명시 필요.

---

### 결함 V3-12: useUserStore에 `relationshipDuration` 추가 영향 미명시

기존 useUserStore: 이별 날짜, D+N, 온보딩, 푸시 토큰

**누락된 결정**:
- Zustand persist 사용 여부
- 타입 정의
- 기존 코드 영향 (typescript strict 모드에서 신규 필드는 옵셔널?)

---

### 결함 V3-13: 자기애 점수 변화 시각화 알고리즘 미명시

```
자기애 점수 변화 시:
"5점 → 7점. 너 자신을 더 사랑하게 됐네."
"7점 → 5점. 요즘 힘든가 봐."
```

**문제**:
- 비교 기준은? (직전 답변 vs 30일 전 vs 최초 답변?)
- 변화 폭 임계값은? (1점도 변화?)
- 같은 점수면 메시지 노출?

→ 6-2의 `generateProgressMessage` 같은 명세가 6-11에는 없음.

---

### 결함 V3-14: 카테고리 6 "졸업 후 추천 행동" 노출 위치 미정

```
카테고리 6: 독립 시 자기 돌봄
기능: 졸업 후 활용 — 답변 → 졸업 후 추천 행동으로 노출
```

**문제**: 어디에 노출되는지 명시 X.
- `/(tabs)/graduation` (졸업 확정 후 화면)?
- `/graduation/report` (성장 리포트)?
- 별도 화면?

→ **구현 위치 결정 필요**.

---

### 결함 V3-15: STRENGTH_LABELS 한글 키 i18n 호환성

```typescript
export const STRENGTH_LABELS = [
  "친절함", "유머", "책임감", ...
] as const;
```

EMOTION_LABELS와 동일 패턴 (한글 키). i18n 시 마이그레이션 필요. 현재 한국어 전용이면 OK이지만 명시 필요.

---

### 결함 V3-16: D+8 게이트 시점 정의 모호

6-11:
> D+0~7: 부드러운 만류
> D+8 이상: 정상 진입

**모호함**: D+N 계산 시점은?
- breakup_date 기준? (이별 후 8일째)
- onboarding_completed 기준? (앱 가입 후 8일째)
- 첫 일기 작성일 기준?

CLAUDE.md의 "D+N(이별 경과일) 전역 표시" 규칙에 따르면 **breakup_date** 기준이 표준. 명시 필요.

---

### 결함 V3-17: 6-3 Day 5/6 hook 트랜잭션 처리 누락

```typescript
async function saveDay5Reflection(text: string) {
  await db.insert_cooling_reflection({...});           // 1번
  await mergeOrCreateReflection('love_self', ...);     // 2번
}
```

**문제**: 1번 성공 + 2번 실패 시 → cooling_reflections에는 저장됐지만 self_reflections에는 누락 → 데이터 불일치.

**해결**: 트랜잭션 또는 idempotent 보장 (재시도 가능).

---

## 📊 영역별 점수

| 항목 | 1차 V2 점수 | 2차 V3 점수 | 변화 |
|------|------------|------------|------|
| 6-0 (신규 온보딩) | - | **75%** | 신규 |
| 6-1 감정 다층화 | 95% | **70%** | ⬇️ -25% (DB 컬럼명 불일치 발견) |
| 6-3 Day별 콘텐츠 | 75% | **75%** | 변화 없음 |
| 6-3 Day 5/6 hook | - | **70%** | 신규 |
| 6-9 hook | - | **90%** | 신규 |
| 6-11 자기 성찰 (신규) | - | **80%** | 신규 |
| 7-1 draft (DB 명) | 95% | **75%** | ⬇️ -20% (컬럼명 충돌) |
| 마이그레이션 일람 | 90% | **30%** | ⬇️ -60% (번호 충돌!) |

**가중 평균**: V2 92% → **V3 70%**

⚠️ **점수가 하락한 이유**: V3에서 처음으로 *실제 DB 스키마*를 확인. 이전 검증은 TODO 자체의 일관성만 봤지, 실제 코드 호환성은 검증 안 됨.

---

## 🎯 즉시 수정 권고 (우선순위 순)

### P0 (코드 작성 즉시 실패 — 반드시 먼저)

1. **마이그레이션 번호 +1 시프트** (006~015)
2. **`temperature` → `mood_score`** 전역 치환
3. **`emotion_labels JSONB` 추가 제거** — 기존 `mood_label TEXT[]` 활용
   - 또는 `mood_label`을 JSONB로 마이그레이션 (큰 결정)

### P1 (논리적 결함)

4. **6-6 CoolingOffWarningModal에 contextMessage prop 추가** (6-11과 호환)
5. **6-3 Day 5/6 hook의 `source` 컬럼 추가** (prefix 방식 대체)
6. **6-11 hook의 D+8 가드 추가** (자존감 라벨 권유 카드)
7. **온보딩 mood 화면 step 표기 변경 명시** (Step 3/3)

### P2 (보강)

8. `relationship_duration_months` 활용처 결정 (또는 제거)
9. `mergeOrCreateReflection` 함수 정의 추가
10. 6-11 컴포넌트들 (ReflectionCard 등) 신규/기존 명시
11. 자기애 슬라이더 min/max + 초기값 복구 로직
12. P1-A 우선순위 재정렬 (6-0, 6-11을 P1-B로)
13. 카테고리 6 졸업 후 노출 위치 결정
14. D+8 기준 명시 (breakup_date)
15. Day 5/6 hook 트랜잭션 처리

---

## 결론

### 수정한 후의 진정한 상태

이전 V2 검증(92%)은 *문서 자체의 일관성*을 본 것. 그러나 V3에서 *실제 코드와의 호환성*을 검증하니 **70%**.

### 의미

- 새 기능 자체의 설계는 좋음 (6-0, 6-11 모두 심리학적 의도 충실)
- 하지만 **실제 DB 스키마를 확인하지 않고 마이그레이션 SQL을 작성**한 결과
  - 마이그레이션 번호 충돌
  - 컬럼명 불일치 (mood_score / mood_label)
- 이는 **TODO를 그대로 구현하면 빌드/마이그레이션 실패**로 이어짐

### 권고

지금 **P0 3건을 먼저 수정**해야 합니다. 그 후 P1 4건, 마지막으로 P2 8건. 약 30분~1시간 작업.

수정하지 않고 코드를 작성하면:
- `supabase db push` 실행 시 마이그레이션 005 충돌
- `INSERT INTO journal_entries (temperature, ...)` 컬럼 미존재 오류
- 7-1 draft 인터페이스가 실제 DB와 매핑 안 됨

---

*Opus 4.7 V3 검증 | 검증일: 2026-05-02 | 실제 DB 스키마 확인 후 작성 | 대상: TODO(psychology).md (6-0/6-11 추가 후) vs 실제 supabase/migrations/*
