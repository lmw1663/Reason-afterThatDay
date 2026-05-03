# 6-11. 자기 성찰 트랙 "나에 대해" (자존감 회복) 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성: 6-0, 6-1, 6-6 모두 선행)
> **마이그레이션**: 014
> **출처**: `TODO(psychology).md` 라인 2274-2711

---

**심리학 근거**
- **Kristin Neff의 자기 연민(self-compassion)**: 이별 후 자기 비난 대신 자기 친절
- **ACT의 가치 명료화(values clarification)**: "나는 무엇을 원하는가" 명확화
- **Bandura의 자기 효능감(self-efficacy)**: "나는 할 수 있다"는 확신
- **Worden 4과제 중 "재배치"**: 새로운 정체성 정착

**현재 상태**
- 결정/감정 트랙은 있으나 *자존감/정체성* 트랙 0개
- 6-1에서 "자존감 흔들림" 라벨을 만들었지만 *그 라벨에 대한 처치가 없음* (자기 모순)
- 이별 회복의 핵심 차원인 "나는 누구인가"가 비어있음

**위치 결정 (탭 추가 X)**

탭은 4개로 유지 (홈/관계분석/나침반/졸업).
홈 화면에 진입점 카드 추가 + 별도 라우트:

```
/(tabs)/index
├─ [D+N 배지]
├─ [오늘 일기 쓰기]
├─ 🫧 [지금 갑자기 떠올랐어]                  (6-5)
├─ 🌱 [나에 대해 알아가기] ← 신규              (6-11)
├─ [일기 목록 / 관계 분석 / 나침반] QuickLink
└─ [오늘의 통계]
```

새 라우트:
- `/about-me` (그리드 — 6개 카테고리)
- `/about-me/[category]` (개별 답변 화면)

졸업 후에도 영구 유지되는 트랙 (자기 인식은 평생 자산).

**시점 게이트 (D+8 이상)**

D+0~7: 6-6과 동일한 부드러운 만류 (CoolingOffWarningModal 재사용)
> "아직 너 자신을 깊이 묻기엔 일러. 일주일은 그냥 흘려보내자.
>  그래도 둘러볼래?"

D+8 이상: 정상 진입.

**6개 카테고리 (자유 답변, 의무성 X)**

각 카테고리는 메인 질문 1개 + 보조 질문 1~2개 + 입력 형식.
사용자는 진입한 카테고리만 답변. 답변 안 한 카테고리는 빈 상태로 유지.

```
/about-me 그리드 화면:

┌─────────────────┬─────────────────┐
│ 💕 연애에서의 나 │ 💎 이상적 매칭   │
│ ⚪ 답변 미완    │ ⚪ 답변 미완    │
├─────────────────┼─────────────────┤
│ ❤️ 자기애 측정   │ 🌟 강점 발견     │
│ 5/10 → 7/10 ✅ │ 7개 강점 ✅     │
├─────────────────┼─────────────────┤
│ 🌸 연애 중       │ 🌿 독립 시       │
│ 자기 돌봄        │ 자기 돌봄        │
│ ✅              │ ⚪              │
└─────────────────┴─────────────────┘
```

#### 카테고리 1: 연애에서의 나 (`love_self`)

**메인 질문**: "연애할 때 너는 어떤 사람이야?"
**보조 질문**:
- "내가 가장 잘 표현하는 사랑의 방식은?"
- "상대방에게 무엇을 줬어?"

**입력 형식**: 자유 텍스트 (200자 제한)

**연애 기간 맥락화** (온보딩 데이터 활용):
> "1년 8개월 동안 연애한 너에 대해, 어떤 사람이었어?"

#### 카테고리 2: 이상적 매칭 (`ideal_match`)

**메인 질문**: "어떤 사람이랑 잘 맞을 것 같아?"
**보조 질문**:
- "관계에서 가장 중요한 가치는?"
- "양보할 수 없는 것 / 양보 가능한 것"

**입력 형식**: 자유 텍스트

#### 카테고리 3: 자기애 측정 (`self_love`)

**메인 질문**: "너는 너를 얼마나 사랑해?"
**입력 형식**:
- 슬라이더 1~10 (필수)
- 자유 텍스트: "오늘의 너에게 한마디" (선택)

**시각화**: 이전 점수와 비교 (예: 5/10 → 7/10 ↑)

#### 카테고리 4: 강점 발견 (`strengths`)

**메인 질문**: "너의 장점이 뭐야?"
**입력 형식**:
- Pill 다중 선택 (12개 강점 라벨)
- 자유 입력: "내가 자랑스러워하는 순간"

**강점 라벨 (12개)**:
```typescript
export const STRENGTH_LABELS = [
  "친절함", "유머", "책임감",
  "공감력", "성실함", "창의성",
  "포용력", "정직함", "인내심",
  "적극성", "차분함", "솔직함"
] as const;
```

#### 카테고리 5: 연애 중 자기 돌봄 (`self_care_in_relationship`)

**메인 질문**: "연애할 때 뭐로 스트레스 풀었어?"
**보조 질문**:
- "관계가 힘들 때 너를 살린 것"
- "혼자만의 시간이 어떻게 도움됐어?"

**입력 형식**: 자유 텍스트

**연애 기간 맥락화**:
> "1년 8개월 동안 어떤 방법들이 너에게 도움됐어?"

#### 카테고리 6: 독립 시 자기 돌봄 (`self_care_alone`)

**메인 질문**: "연애 안 할 때 뭐로 스트레스 풀었어?"
**보조 질문**:
- "혼자 있을 때 가장 행복한 순간"
- "너를 채워주는 것들"

**입력 형식**: 자유 텍스트

**기능**: 졸업 후 활용 (V3-14 결함 수정 — 노출 위치 결정)
- 노출 화면: `/(tabs)/graduation` 의 `status === 'confirmed'` 분기 (졸업 확정 후 화면)
- 노출 형식: "추천 행동" 카드
  ```
  ┌──────────────────────────────┐
  │ 너가 적었던 자기 돌봄 방법   │
  ├──────────────────────────────┤
  │ • 친구 만나기                │
  │ • 새로운 취미 시작            │
  │ • 휴식 충분히 하기           │
  │                              │
  │ 오늘 하나 실천해볼까?         │
  └──────────────────────────────┘
  ```
- 데이터 출처: `self_reflections` WHERE category='self_care_alone' AND is_current=true
  (manual + cooling_day6 모두 표시)

---

**수정 가능성 + 변경 이력 보관**

1회 답변 후 *언제든 수정 가능*. 단, 변경 이력은 보관 (시간에 따른 변화 추적용).

**DB 설계** (마이그레이션 014):

```sql
-- migrations/014_self_reflections.sql
CREATE TABLE public.self_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'love_self',
    'ideal_match',
    'self_love',
    'strengths',
    'self_care_in_relationship',
    'self_care_alone'
  )),
  -- 카테고리별 입력 형식이 다름 (NULL 허용)
  score INT CHECK (score IS NULL OR score BETWEEN 1 AND 10),  -- self_love 전용
  labels TEXT[] DEFAULT '{}'::text[],                          -- strengths 전용 (mood_label과 동일 패턴)
  text_response TEXT,
  -- 출처 추적 (V3-5 결함 수정 — prefix 누적 방식 대체)
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'cooling_day5', 'cooling_day6')),
  -- 변경 이력 추적
  is_current BOOLEAN NOT NULL DEFAULT true,  -- 가장 최신 row만 true
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 가장 최신 답변 빠르게 조회용 인덱스
CREATE INDEX idx_self_reflections_current
  ON public.self_reflections(user_id, category)
  WHERE is_current = true;

-- CLAUDE.md 절대 규칙: RLS 필수
ALTER TABLE public.self_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_reflection" ON public.self_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reflection" ON public.self_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reflection" ON public.self_reflections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- DELETE 정책 의도적 미생성 (이력 보존)
```

**source 컬럼의 의미** (V3-5 prefix 누적 결함 수정):
- `'manual'`: 사용자가 직접 6-11에서 입력
- `'cooling_day5'`: 6-3 Day 5 (의미 재구성)에서 자동 누적 — `category='love_self'` 전용
- `'cooling_day6'`: 6-3 Day 6 (미래 상상)에서 자동 누적 — `category='self_care_alone'` 전용

UI에서 source별로 다르게 표시 (예: cooling_day5 답변은 "🌱 Day 5에 쓴 글" 라벨).
사용자가 직접 쓴 답변과 자동 누적된 답변을 구분 가능 → prefix 텍스트 합치기 방식 폐기.

**수정 시 로직**:
```typescript
// 새 답변 저장 = 이전 row를 is_current=false로, 새 row 생성
async function updateReflection(category, newData) {
  // 1. 같은 category의 기존 current row를 false로
  await supabase
    .from('self_reflections')
    .update({ is_current: false })
    .eq('user_id', user.id)
    .eq('category', category)
    .eq('is_current', true);

  // 2. 새 row 삽입
  await supabase
    .from('self_reflections')
    .insert({
      user_id: user.id,
      category,
      ...newData,
      is_current: true
    });
}
```

이 방식으로 변경 이력이 모두 보존되어, 졸업 시 "이별 전후 너의 자기 인식 변화" 시각화 가능.

---

**UI 구현**

```typescript
// screens/about-me/index.tsx (그리드)
export const AboutMeScreen = () => {
  const daysSinceBreakup = getDaysSinceBreakup();
  const [showCoolingOff, setShowCoolingOff] = useState(false);
  const [reflections, setReflections] = useState<Record<Category, Reflection | null>>({});

  useEffect(() => {
    // D+0~7 만류 모달
    if (daysSinceBreakup < 8) setShowCoolingOff(true);
    // 모든 카테고리의 current 답변 조회
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    const { data } = await supabase
      .from('self_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true);
    setReflections(groupByCategory(data));
  };

  return (
    <ScreenWrapper>
      <CoolingOffWarningModal
        visible={showCoolingOff}
        day={daysSinceBreakup}
        context="self_reflection"  // 6-6과 같은 컴포넌트 + Day별 메시지 분기
        onProceed={() => setShowCoolingOff(false)}
        onCancel={() => router.back()}
      />

      <Text style={styles.title}>나에 대해 알아가기</Text>
      <Text style={styles.subtitle}>
        답하고 싶은 것만 답해도 돼. 언제든 수정할 수 있어.
      </Text>

      <Grid>
        {CATEGORIES.map(cat => (
          <ReflectionCard
            key={cat.key}
            category={cat}
            reflection={reflections[cat.key]}
            onPress={() => router.push(`/about-me/${cat.key}`)}
          />
        ))}
      </Grid>
    </ScreenWrapper>
  );
};

// screens/about-me/[category].tsx (개별 답변)
export const ReflectionCategoryScreen = () => {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const [current, setCurrent] = useState<Reflection | null>(null);
  const [draft, setDraft] = useState({
    score: 5,
    labels: [] as string[],
    text_response: ""
  });
  const config = CATEGORY_CONFIGS[category];
  const userDuration = useUserStore(s => s.relationshipDuration);  // 6-0 데이터

  // current row 조회 + draft 초기화 (V3-10, V3-11 결함 수정)
  const fetchCurrent = useCallback(async () => {
    const { data } = await supabase
      .from('self_reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('source', 'manual')      // 사용자 직접 답변만 (cooling_day5/6은 별도)
      .eq('is_current', true)
      .maybeSingle();

    setCurrent(data);
    if (data) {
      // 이전 답변이 있으면 draft를 그 값으로 초기화
      setDraft({
        score: data.score ?? 5,
        labels: data.labels ?? [],
        text_response: data.text_response ?? ""
      });
    }
  }, [category]);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);

  const handleSave = async () => {
    await updateReflection(category, { ...draft, source: 'manual' });
    router.back();  // 그리드로 복귀
  };

  // 자기애 점수 변화 메시지 (V3-13 결함 수정)
  const getProgressMessage = (): string | null => {
    if (category !== 'self_love' || !current?.score) return null;
    const diff = draft.score - current.score;
    if (Math.abs(diff) < 1) return null;
    if (diff > 0) return `${current.score}점 → ${draft.score}점. 너 자신을 더 사랑하게 됐네.`;
    return `${current.score}점 → ${draft.score}점. 요즘 힘든가 봐. 그것도 정상이야.`;
  };

  return (
    <ScreenWrapper>
      <BackHeader label="나에 대해" />

      {/* 연애 기간 맥락화 (6-0 데이터 활용) */}
      <Text style={styles.mainQuestion}>
        {applyDurationContext(config.mainQuestion, userDuration)}
      </Text>

      {config.subQuestions?.map(q => (
        <Text style={styles.subQuestion} key={q}>{q}</Text>
      ))}

      {/* 이전 manual 답변 표시 */}
      {current && (
        <Card style={styles.previousCard}>
          <Text>이전에 너는 이렇게 답했어:</Text>
          <ReflectionDisplay reflection={current} />
        </Card>
      )}

      {/* cooling_day5/6 답변도 표시 (love_self/self_care_alone 카테고리) */}
      <CoolingSourceReflections category={category} userId={user.id} />

      {category === 'self_love' && (
        <Slider
          value={draft.score}
          onValueChange={s => setDraft({...draft, score: s})}
          minimumValue={1}
          maximumValue={10}
          step={1}
        />
      )}
      {category === 'strengths' && (
        <PillGroup
          options={STRENGTH_LABELS}
          selected={draft.labels}
          onChange={l => setDraft({...draft, labels: l})}
        />
      )}
      <TextInput
        value={draft.text_response}
        onChangeText={t => setDraft({...draft, text_response: t})}
        maxLength={200}
        multiline
      />

      {/* 자기애 점수 변화 메시지 (저장 전 미리보기) */}
      {getProgressMessage() && (
        <Text style={styles.progressMessage}>{getProgressMessage()}</Text>
      )}

      <Button onPress={handleSave}>
        {current ? "수정하기" : "저장하기"}
      </Button>
    </ScreenWrapper>
  );
};
```

**메시지 톤 (반말 일관성)**

```
그리드 진입 시:
"답하고 싶은 것만 답해도 돼. 언제든 수정할 수 있어."

자기애 점수 변화 시:
"5점 → 7점. 너 자신을 더 사랑하게 됐네." (상승 시)
"7점 → 5점. 요즘 힘든가 봐. 그것도 정상이야." (하강 시 — 비난 X)

강점 라벨 선택 시:
"너의 좋은 점 ${count}가지를 발견했네."
```

**기존 기능과의 hook 연계 (5가지)**

→ 기존 항목들(6-1, 6-3, 6-9)에 각각 hook 명시 (별도 항목으로 추가)

---

### 6-11 구현 체크리스트

- [ ] `self_reflections` 테이블 + RLS + source 컬럼 + is_current 인덱스 생성 (마이그레이션 014)
- [ ] `public.users.relationship_duration_range` 필드 추가 (마이그레이션 015, 온보딩 6-0 연계)
- [ ] `/about-me` 그리드 화면
- [ ] `/about-me/[category]` 동적 라우트 (6개 카테고리)
- [ ] `ReflectionCard` 컴포넌트 신규 작성 (그리드 카드용 — 디자인 시스템 패턴 따름)
- [ ] `ReflectionDisplay` 컴포넌트 신규 작성 (이전 답변 표시 + source 라벨)
- [ ] `CoolingOffWarningModal` 재사용 + `contextMessage` prop 추가 (6-6/6-11 공유)
- [ ] STRENGTH_LABELS 12개 enum (한글 키 — 한국어 전용 단계)
- [ ] `updateReflection` 함수 (이력 보존 로직, 트랜잭션 처리)
- [ ] `mergeOrCreateReflection` 함수 (Day 5/6 hook 전용 — source 활용)
- [ ] `fetchCurrent` 함수 (current row 조회 + draft 초기화)
- [ ] 자기애 점수 변화 시각화 알고리즘 (직전 답변과 비교, 1점 이상 변화 시 메시지)
- [ ] 홈 화면 🌱 카드 추가 + D+8 미만 시 만류 모달
- [ ] 카테고리 6 → `/(tabs)/graduation` 화면(졸업 확정 후)에 추천 행동 카드 노출
- [ ] 기존 항목 hook 연계 (6-1 D+8 가드, 6-3 Day 5/6 source, 6-9, 졸업 리포트)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-0](6-0-onboarding-duration.md) (연애 기간 맥락화), [6-1](6-1-emotion-layers.md) (자존감 라벨), [6-6](6-6-time-gate.md) (CoolingOffWarningModal)
- 🔗 hook 입력: [6-3 Day 5/6](6-3-cooling-day-content.md) (source='cooling_day5/6')
- 🔗 hook 출력: [6-9](6-9-graduation-farewell.md) (졸업 후 안내)
