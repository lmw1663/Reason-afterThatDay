# 7-2. 일기 미니 모드 (감정 온도만) 🔴 P2

> **Phase**: 7 — 기술 안정성 + 감정 안전장치
> **우선순위**: P2 (의존성: 6-1 mood_label, mood_score)
> **마이그레이션**: 011
> **출처**: `TODO(psychology).md` 라인 2958-3173

---

**심리학 근거**
- 이별 직후 무기력 단계(D+1~7): 4단계는 진입 장벽 매우 높음
- **"오늘은 감정 온도만"** = 진입 장벽 ↓, 누적 기록 ↑

**현재 상태**

```
모든 일기 기록이 4단계 강제:
mood → direction → question → AI response

D+1~7 무기력 사용자:
"이 4단계는 너무 길어... 포기"
```

**개선 방향**

```
[일기 쓰기] 버튼 → 2가지 옵션:
├─ [오늘은 감정 온도만] → 1단계 (간단)
└─ [깊게 쓰고 싶어] → 4단계 (기존)
```

### 구현 방식

**홈 화면 변경**

```
/(tabs)/index
├─ [D+N 배지]
├─ 오늘 일기 쓰기
│  ├─ [오늘은 감정 온도만 빠르게 (⚡)]
│  └─ [깊게 쓰고 싶어 (🔥)]
```

**Mini Journal Flow**

```
[홈] → ["오늘은 감정 온도만" 클릭]
   ↓
[간단 화면]
┌─────────────────────┐
│ 지금 기분이 어때?   │
│                     │
│ [감정 온도 슬라이더]│
│ 1 ─────○───── 10   │
│                     │
│ [저장]              │
└─────────────────────┘
   ↓
"오늘도 기록했어. 고마워." (메시지)
   ↓
[뒤로 가기] / [더 쓰고 싶어 (→ 4단계 흐름)]
```

**데이터 저장**

미니 모드도 같은 `journal_entries` 테이블에 저장하되,
`direction`, `question`, `ai_response`는 NULL:

```sql
-- migrations/011_journal_mini_mode.sql
ALTER TABLE public.journal_entries
  ADD COLUMN is_mini_mode BOOLEAN NOT NULL DEFAULT false;

-- 기존 RLS 그대로 상속 (별도 정책 불필요)
```

**미니 모드와 6-1 감정 라벨의 통합 (Opus 검증 누락 6 결정)**

미니 모드는 "감정 온도 + (선택) 감정 라벨" 까지만:
- ✅ 감정 온도 (필수)
- ⚪ 감정 라벨 (선택사항 — 빠른 입력의 본질 보존)
- ❌ 신체 신호 (생략)
- ❌ 자유 메모 (생략)
- ❌ 방향 / 질문 / AI 응답 (생략)

저장 예시 (실제 DB 컬럼명):
```json
{
  "mood_score": 5,
  "mood_label": ["외로움"],       // 빠른 1개 또는 0개
  "physical_signals": [],
  "direction": null,
  "is_mini_mode": true
}
```

이는 미니 모드의 "빠른 기록" 본질을 유지하면서도, 라벨 수집의 회복 효과를 일부 살림.

**canGraduate 로직 수정**

현재:
```
canGraduate = breakup_date >= 30일 && journal_count >= 5
```

개선:
```
canGraduate = breakup_date >= 30일 && 
              (journal_count >= 5 || mini_journal_count >= 10)
```

즉, mini journal 10개 = 일반 일기 5개 (완화된 게이트)

**UI 구현**

```typescript
// screens/(tabs)/index.tsx

const HomeScreen = () => {
  const [showJournalOptions, setShowJournalOptions] = useState(false);

  return (
    <>
      <Button 
        onPress={() => setShowJournalOptions(true)}
        title="오늘 일기 쓰기"
      />

      <Modal visible={showJournalOptions}>
        <Text>어떻게 기록하고 싶어?</Text>

        <Button
          onPress={() => {
            router.push('/journal/mini');
            setShowJournalOptions(false);
          }}
          title="⚡ 오늘은 감정 온도만 빠르게"
        />

        <Button
          onPress={() => {
            router.push('/journal');
            setShowJournalOptions(false);
          }}
          title="🔥 깊게 쓰고 싶어"
        />
      </Modal>
    </>
  );
};

// screens/journal/mini.tsx

export const JournalMiniScreen = () => {
  const [moodScore, setMoodScore] = useState(5);  // DB 컬럼명과 일관
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    const entry = await addJournalEntry({
      mood_score: moodScore,  // 실제 DB 컬럼명
      is_mini_mode: true
      // direction, question_response, ai_response = null
    });

    setIsLoading(false);

    // 완료 메시지 보여주기 (반말 일관성)
    Alert.alert("오늘도 기록했어. 고마워.");

    // 옵션
    Alert.alert("", "더 쓰고 싶어?", [
      {
        text: "아니야, 이정도면 충분해",
        onPress: () => router.back()
      },
      {
        text: "응, 깊게 쓰고 싶어",
        onPress: () => {
          // entry 부분 복구하면서 일반 플로우로
          router.push('/journal/direction', {
            entryId: entry.id,
            moodScore
          });
        }
      }
    ]);
  };

  return (
    <ScreenWrapper>
      <Text style={styles.title}>
        지금 기분이 어때?
      </Text>
      <Slider
        value={moodScore}
        onValueChange={setMoodScore}
        minimumValue={1}
        maximumValue={10}
        step={1}
      />
      <Text>{moodScore}</Text>
      
      <Button 
        onPress={handleSave}
        disabled={isLoading}
        title={isLoading ? "저장 중..." : "저장"}
      />
    </ScreenWrapper>
  );
};
```

**구현 순서**
1. `is_mini_mode` 필드 추가 (마이그레이션 011)
2. `/journal/mini.tsx` 화면 생성
3. 홈 화면 "오늘 일기 쓰기" → 옵션 모달
4. `canGraduate` 로직 수정
5. 통계/차트에서 mini journal 표시 방식 결정 (따로? 함께?)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-1](6-1-emotion-layers.md) (mood_score, mood_label 활용)
