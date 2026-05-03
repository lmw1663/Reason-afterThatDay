# 6-3. Day별 유예 콘텐츠 (Day 1~6 회복 작업) 🟡 P1-B

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-B (의존성: 6-1 mood_score 차트, 6-6 CoolingOffWarningModal 공유)
> **마이그레이션**: 008
> **출처**: `TODO(psychology).md` 라인 631-1026

---

**심리학 근거**
- **Worden의 4과제**: 상실 인정 → 고통 통과 → 적응 → 재배치
- **인지부조화(cognitive dissonance)**: 졸업 결정 직후 정서가 최고조
- Day 1~6은 "7일 유예"가 아니라 **"7일 회복 프로세스"**여야 함

**현재 상태**
```
/cooling/index
├─ "자율 체크인" 버튼
└─ "취소할게" 버튼

Day 1~6이 모두 동일 화면 = 심리적 방치
Day 7 "최종 졸업 확인" 버튼만 추가
```

**개선 방향**

Day 1~6 각각이 다른 심리적 작업(grief work)에 초점을 맞춤.
**알림 없이, 사용자가 앱을 열었을 때만 표시** (CLAUDE.md 절대 규칙 준수)

### Day 1 화면

**심리적 단계**: 충격/안도의 혼재
**권장 콘텐츠**: 호흡 가이드 (deep 모드) + "첫 하루 버티기"

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 1/7           │
├─────────────────────────────┤
│ 지금 이 마음이 정상이야.    │
│                             │
│ 첫 24시간은 어떤 감정을     │
│ 느껴도 괜찮아.              │
│                             │
│ [호흡 함께 하기] 버튼       │
│  → BreathingGuide(pattern="deep") │
│                             │
│ 호흡 모달 (deep, 36초):      │
│  "천천히 숨을 들이쉬어"     │
│  (4초 카운트다운)           │
│  "숨을 멈추고 있어" (4초)   │
│  "천천히 내쉬어" (4초)      │
│  → 3회 반복 (총 36초)        │
│                             │
│ [체크인]  [홈으로]          │
└─────────────────────────────┘
```

**메시지 톤** (반말 — 기존 앱 톤 일관성)
> "지금 너의 마음이 하는 모든 반응이 정상이야.
> 혼란도, 안도감도, 후회도 다 이 시점의 자연스러운 감정이야.
> 오늘은 아무것도 다시 결정하지 않아도 돼."

**호흡 가이드 컴포넌트 — 통합 사양** (Opus 검증 결함 5 수정)

같은 `BreathingGuide` 컴포넌트가 두 곳에서 props로 분기:

```typescript
// components/BreathingGuide.tsx
interface BreathingGuideProps {
  pattern: "quick" | "deep";
  onComplete?: () => void;
}

const PATTERNS = {
  // 떠오름 진정용 — 짧은 1회
  quick: {
    cycles: 1,
    inhale: 3,    // 들이쉬기 3초
    hold: 2,      // 멈춤 2초
    exhale: 3,    // 내쉬기 3초
    totalDuration: 8  // 약 8초
  },
  // Day 1 안정용 — 긴 3회 반복
  deep: {
    cycles: 3,
    inhale: 4,
    hold: 4,
    exhale: 4,
    totalDuration: 36  // 36초
  }
};
```

- **6-5 떠오름 진입점** → `<BreathingGuide pattern="quick" />` (8초)
- **6-3 Day 1** → `<BreathingGuide pattern="deep" />` (36초)
- 한 컴포넌트에서 사양만 분기. 진정한 재사용.

### Day 2 화면

**심리적 단계**: 결정 후회 가능성 증가
**권장 콘텐츠**: 두 시점의 일기를 *듀얼 카드*로 회상 ("그날의 너 → 결심하던 너")

> 원본 §4의 "처음 일기 회상: '그날 너는'" 의도는 **이별의 그날**과 **졸업 결심의 그날** 두 가지로 해석 가능.
> 둘 다 다른 임상 효과를 가지므로 **두 카드 모두 보여주는** 방식 채택.

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 2/7           │
├─────────────────────────────┤
│ 너는 어떻게 여기까지 왔을까  │
│                             │
│ [카드 1 — 시작]              │
│ 🌱 "이별 다음날, D+1"       │
│    "오늘은 정말 힘들었어..." │
│    온도: 2/10               │
│    → 그때의 너              │
│                             │
│ [카드 2 — 결심]              │
│ 🍂 "졸업 결심한 날, D+30"    │
│    "이제는 보내주려고 해..." │
│    온도: 5/10               │
│    → 결심하던 너            │
│                             │
│ "그 사이 너는 이렇게         │
│  많이 자랐어."              │
│                             │
│ [체크인]  [홈으로]          │
└─────────────────────────────┘
```

**데이터 출처 (두 시점)**
- **카드 1 (시작)**: `breakup_date` 직후 첫 일기 — 가장 강한 감정이 적힌 일기
  ```sql
  SELECT * FROM journal_entries
  WHERE user_id = $1
    AND date >= breakup_date
  ORDER BY date ASC
  LIMIT 1;
  ```
- **카드 2 (결심)**: 졸업 신청 직전 마지막 일기 — 결심을 정당화한 일기
  ```sql
  SELECT * FROM journal_entries
  WHERE user_id = $1
    AND date < graduation_requested_at
  ORDER BY date DESC
  LIMIT 1;
  ```

**일기가 부족한 경우 폴백**:
- 일기가 1개뿐이면 카드 1만 표시
- 일기가 0개면 Day 2 화면 자체를 호흡 가이드로 대체

**메시지 톤** (반말 — 기존 앱 톤 일관성)
> "너는 이미 이 결정을 충분히 고민했어.
> 그 과정에서 쌓인 이유들이 있었어.
> 지금 흔들리는 것도 정상이지만,
> 너는 그날의 너보다 분명히 자라있어."

### Day 3 화면

**심리적 단계**: 분노 기능 활성화 가능성
**권장 콘텐츠**: 상대방 단점/관계의 한계 회상

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 3/7           │
├─────────────────────────────┤
│ 너가 느낀 관계의 한계        │
│                             │
│ 상대방의 단점:              │
│ • 일을 우선시했어           │
│ • 내 말을 듣지 않았어        │
│ • 자기중심적이었어          │
│ (이미 입력한 pros-cons      │
│  데이터를 여기서 노출)       │
│                             │
│ "이 한계들이 있었기에       │
│  너의 선택이 정당했어."      │
│                             │
│ [체크인]  [홈으로]          │
└─────────────────────────────┘
```

**데이터 출처**
- `relationship_profile.cons` (이미 입력한 "상대방 단점" 데이터)
- 관계 분석 트랙에서 입력한 "장단점"

**메시지 톤** (반말 + 비난 금지, CLAUDE.md 절대 규칙)
> "지금 그 사람이 미웠던 부분이 많이 떠오를 수 있어.
> 분노는 이별의 매우 정상적인 단계야.
> 미움도, 후회도, 안도도 모두 너의 정당한 감정이야."

### Day 4 화면

**심리적 단계**: 슬픔 깊어짐 (주요 쇠락 시기)
**권장 콘텐츠**: 7일 감정 차트 + "정상적인 그래프" 메타 메시지

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 4/7           │
├─────────────────────────────┤
│ 너의 감정 변화               │
│                             │
│ [라인 차트: Day 1~4 온도]   │
│  (위아래로 출렁이는 그래프)  │
│                             │
│ Day 1: 8점                  │
│ Day 2: 5점 (↓)             │
│ Day 3: 4점 (↓↓)            │
│ Day 4: 3점 (↓↓↓)           │
│                             │
│ "이렇게 내려가는 그래프가    │
│  정상이야.                  │
│  슬픔이 깊어지는 것은        │
│  너가 그 관계를              │
│  소중하게 여겼다는 뜻이야."  │
│                             │
│ [체크인]  [홈으로]          │
└─────────────────────────────┘
```

**기술 스펙**
- `journal_entries`에서 Day별 `mood_score` 평균/최신값 조회
- 차트: `react-native-chart-kit`의 LineChart 사용 (기존)
- Y축 범위: 1~10 (고정)

**메타 메시지의 중요성** (심리학적 개입)
> "이 그래프가 정상적인 그래프야.
> 슬픔이 깊어지는 것은 너가 약해서가 아니라,
> 그 관계가 너에게 얼마나 의미 있었는지를 보여줄 뿐이야.
> 넘어야 할 산이 있으면 깊게 내려가는 거니까."

### Day 5 화면

**심리적 단계**: 의미 재구성 시작
**권장 콘텐츠**: "이 관계에서 배운 것" 1문장 질문

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 5/7           │
├─────────────────────────────┤
│ 의미 찾기                    │
│                             │
│ "이 관계에서                │
│  너는 무엇을 배웠어?"       │
│                             │
│ [텍스트 입력]               │
│ (플레이스홀더: "예:         │
│  내가 진짜 원하는 게 뭔지   │
│  알게 됐어")                │
│                             │
│ [저장]  [홈으로]            │
│                             │
│ 저장 후:                     │
│ "그 배움이 너를             │
│  더 단단하게 만들 거야."    │
└─────────────────────────────┘
```

**hook → 6-11 자기 성찰 연계** (V3-5 결함 수정 — prefix 누적 → source 컬럼 방식)

Day 5 답변 저장 시, **`self_reflections`에 별도 row로 누적** (source='cooling_day5'):

```typescript
async function saveDay5Reflection(text: string) {
  // 트랜잭션으로 두 작업 묶기 (V3-17 결함 수정)
  await supabase.rpc('save_day5_reflection', {
    p_user_id: user.id,
    p_cooling_period_id: cooling.id,
    p_text: text
  });
  // RPC 내부에서:
  //   1. cooling_reflections에 INSERT (day=5, type='learning')
  //   2. self_reflections에 INSERT (category='love_self', source='cooling_day5')
  //      → manual 답변과 별개 row로 보관 (prefix 합치기 X)
}
```

또는 클라이언트에서 별도 호출:
```typescript
await db.insert_cooling_reflection({...});
await db.insert_self_reflection({
  category: 'love_self',
  text_response: text,
  source: 'cooling_day5',
  is_current: true  // 같은 source 내에서 최신만 true
});
```

**source별 is_current 관리**:
- `manual` 답변과 `cooling_day5` 답변은 *별개 트랙*
- 같은 category 내에서도 source별로 최신 row 따로 관리
- 6-11 그리드에서는 둘 다 표시 (예: "내가 쓴 답변" + "🌱 Day 5에 쓴 글")

사용자가 6-11에 들어갔을 때:
> "유예 Day 5에서 너는 이렇게 답했어. (별도로 더 쓰고 싶어?)"

이렇게 두 트랙이 *유기적으로 연결* (CLAUDE.md "유기적 연결 원칙") + 사용자가 자기 답변과 자동 누적 답변을 구분 가능.

**저장 방식**
- 새 DB 테이블: `cooling_reflections` (마이그레이션 008)
- 필드: `id`, `user_id`, `cooling_period_id`, `day`, `reflection_type`, `reflection_text`, `created_at`
- RLS 정책 (CLAUDE.md 절대 규칙):
  ```sql
  -- migrations/008_cooling_reflections.sql
  CREATE TABLE public.cooling_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
    day INT NOT NULL CHECK (day BETWEEN 5 AND 6),  -- 실제 사용은 Day 5, 6만 (V2-7 결함 수정)
    reflection_type TEXT NOT NULL CHECK (reflection_type IN ('learning', 'future_plan')),
    reflection_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  ALTER TABLE public.cooling_reflections ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "select_own_reflections" ON public.cooling_reflections
    FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "insert_own_reflections" ON public.cooling_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "update_own_reflections" ON public.cooling_reflections
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "delete_own_reflections" ON public.cooling_reflections
    FOR DELETE USING (auth.uid() = user_id);
  ```

**메시지 톤** (Worden의 과제: 의미 재구성)
> "이 관계는 끝났지만,
> 너가 거기서 배운 것들은 남아있어.
> 그것들이 이제 너를 더 강하게 만들 거야."

### Day 6 화면

**심리적 단계**: 미래 상상 시작 (적응 진입)
**권장 콘텐츠**: "졸업 후 첫 한 주를 어떻게 보내고 싶어?" 질문

```
화면 구성:
┌─────────────────────────────┐
│ 졸업 유예: Day 6/7           │
├─────────────────────────────┤
│ 미래를 그려보기              │
│                             │
│ "졸업 후 첫 한 주를         │
│  어떻게 보내고 싶어?"       │
│                             │
│ [텍스트 입력]               │
│ (플레이스홀더: "친구들      │
│  만나기, 새로운 취미,       │
│  휴식 취하기...")           │
│                             │
│ [저장]  [홈으로]            │
│                             │
│ 저장 후:                     │
│ "너의 미래를 이미           │
│  상상하고 있네.             │
│  그것은 회복의 신호야."     │
└─────────────────────────────┘
```

**저장 방식**
- `cooling_reflections`에 `day=6`, `type=future_plan` 저장

**hook → 6-11 자기 성찰 연계** (Day 5와 동일 패턴 — source 활용)

Day 6 답변 저장 시, **별도 row로 self_reflections에 저장** (source='cooling_day6'):

```typescript
// "졸업 후 첫 한 주 계획" → "독립 시 자기 돌봄" 카테고리에 누적
await db.insert_self_reflection({
  category: 'self_care_alone',
  text_response: text,
  source: 'cooling_day6',
  is_current: true
});
```

사용자가 졸업 후 6-11에 들어가면 Day 6에 작성한 "첫 한 주 계획"을 다시 볼 수 있음 → *실행 가능성 ↑*.

**메시지 톤** (Worden의 과제: 재배치)
> "너가 이미 미래를 그리기 시작했어.
> 그것만으로도 너는 충분히 회복하고 있는 거야.
> 내일은 더 구체적으로 그 계획을 실행해 봐."

### 6-3 구현 체크리스트

- [ ] `cooling_reflections` 테이블 생성 (마이그레이션 008)
- [ ] `/cooling/index` UI 동적 렌더링 (Day 1~6 분기)
- [ ] Day별 콘텐츠 컴포넌트 분리 (`Day1Content`, `Day2Content`, ...)
- [ ] 호흡 가이드 모달 컴포넌트 (`BreathingGuide`, 6-5와 공유)
- [ ] 차트 컴포넌트 (Day 4용)
- [ ] 첫 일기 조회 로직 (Day 2용)
- [ ] 메시지 톤 리뷰 (비난 금지 확인)
- [ ] 데이터 진입 구문 조회 (Day 2~6용)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 hook 연계: [6-11](6-11-self-reflection.md) (Day 5/6 → self_reflections source)
- 🔗 컴포넌트 공유: [6-5](6-5-intrusive-memory.md) (BreathingGuide)
- 🔗 데이터: [6-1](6-1-emotion-layers.md) (mood_score 차트)
