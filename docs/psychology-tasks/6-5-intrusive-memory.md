# 6-5. 떠오름(intrusive memory) 빠른 진입점 🟢 P1-A

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-A (의존성 없음)
> **마이그레이션**: 009
> **출처**: `TODO(psychology).md` 라인 1271-1445

---

**심리학 근거**
- 이별 회복에서 **가장 자주 호소되는 상황**: "갑자기 떠올랐을 때"
- **DBT(변증법적 행동치료)의 distress tolerance** — 순간의 정서 폭주를 30초 안에 완화

**문제**

현재 앱은 떠올림을 처리하는 진입점이 없음.
→ 사용자가 자발적으로 "일기 쓰러" 4단계 흐름에 들어와야만 함.
→ 그 사이 30초~1분 안에 떠올림이 확산되고, 사용자는 앱을 닫을 가능성 높음.

**개선 방향**

홈 화면에 **빠른 "떠올림 처리" 버튼** 1개 추가.
탭하면 **30초 짧은 플로우** (호흡→문장→감정 기록→끝).

### 구현 방식

**홈 화면 레이아웃**

```
/(tabs)/index
├─ [D+N 배지]
├─ [오늘 일기 쓰기] 버튼 (기존)
├─ 🫧 [지금 갑자기 떠올랐어] 버튼 ← 신규
├─ [일기 목록 / 관계 분석 / 나침반] QuickLink (기존)
└─ [오늘의 통계] (기존)
```

새로운 버튼 스타일:
```
📱 버튼 외형
┌─────────────────────┐
│ 🫧 지금 갑자기       │
│    떠올랐어         │
└─────────────────────┘

색상: 보조 색상 (attention-drawing)
아이콘: 🫧 (bubble — 순간성, 일시성을 상징)
```

**플로우 상세**

```
[홈] → [🫧 버튼 클릭]
   ↓
[떠오름 진정 모달 시작]
   ↓
1단계: 호흡 가이드 (BreathingGuide pattern="quick", 8초)
   "천천히 숨을 들이쉬어 (3초)"
   "멈추고 있어 (2초)"
   "천천히 내쉬어 (3초)"
   ※ 6-3 Day 1과 같은 컴포넌트, props만 다름

2단계: 마인드풀니스 문장 (2초)
   "그 기억은 사실이지만,
    지금의 너는 그 기억 속이 아니야."

3단계: 감정 온도 기록 (1~3초)
   "지금 기분이 어때?"
   [1 ─ 5 ─ 10] 슬라이더

4단계: 저장 + 완료
   "기록됐어. 고마워."
   [뒤로 가기] / [일기 쓰러 가기]

총 소요 시간: 약 30초
```

**마인드풀니스 문장의 심리학적 효과**

"그 기억은 사실이지만, 지금의 너는 그 기억 속이 아니야"
- **인지적 재구조화** (CBT): 기억과 현재를 분리
- **마인드풀니스**: "지금 여기"에 집중
- **정서 조절** (DBT): 떠올림이 "사실"이지만 "전부"가 아니라는 깨달음

**데이터 저장**

`intrusive_memory_response` 새 테이블 + RLS (마이그레이션 009, CLAUDE.md 절대 규칙):
```sql
-- migrations/009_intrusive_memory.sql
CREATE TABLE public.intrusive_memory_response (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 컬럼명 일관성: journal_entries.mood_score와 동일 의미
  mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  is_escalated_to_journal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intrusive_memory_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_intrusive" ON public.intrusive_memory_response
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_intrusive" ON public.intrusive_memory_response
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_intrusive" ON public.intrusive_memory_response
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_intrusive" ON public.intrusive_memory_response
  FOR DELETE USING (auth.uid() = user_id);
```

**UI 코드 스펙**

```typescript
// components/IntrinsicMemoryModal.tsx

export const IntrusiveMemoryModal = ({ isVisible, onClose }) => {
  const [step, setStep] = useState(1);  // 1: 호흡, 2: 문장, 3: 온도, 4: 완료
  const [moodScore, setMoodScore] = useState(5);  // DB 컬럼명과 일관

  useEffect(() => {
    if (step === 1 && isVisible) {
      // 자동으로 6초 후 step 2로
      const timer = setTimeout(() => setStep(2), 6000);
      return () => clearTimeout(timer);
    }
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, isVisible]);

  const handleSave = async () => {
    await addIntrusiveMemoryResponse({
      mood_score: moodScore,  // 실제 DB 컬럼명 (journal_entries와 일관)
      is_escalated_to_journal: false
    });
    setStep(4);
  };

  return (
    <Modal visible={isVisible} transparent>
      <ScreenWrapper>
        {step === 1 && <BreathingGuide />}
        {step === 2 && <MindfulnessText />}
        {step === 3 && (
          <>
            <Text>지금 기분이 어때?</Text>
            <Slider
              value={moodScore}
              onValueChange={setMoodScore}
              minimumValue={1}
              maximumValue={10}
              step={1}
            />
            <Button onPress={handleSave}>기록하기</Button>
          </>
        )}
        {step === 4 && (
          <>
            <Text>기록됐어. 고마워.</Text>
            <Button onPress={onClose}>뒤로 가기</Button>
            <Button onPress={() => router.push('/journal')}>
              일기 쓰러 가기
            </Button>
          </>
        )}
      </ScreenWrapper>
    </Modal>
  );
};
```

**구현 순서**
1. `intrusive_memory_response` 테이블 + RLS 생성 (마이그레이션 009)
2. `BreathingGuide` 통합 컴포넌트 작성 (pattern props 분기 — 6-3 Day 1과 공유)
3. `IntrusiveMemoryModal` 컴포넌트 작성 (BreathingGuide 사용)
4. 홈 화면 🫧 버튼 추가
5. 관련 Zustand 액션 추가 (`addIntrusiveMemoryResponse`)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 컴포넌트 공유: [6-3](6-3-cooling-day-content.md) (BreathingGuide)
