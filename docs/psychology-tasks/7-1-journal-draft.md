# 7-1. 일기 작성 임시 저장 (draft) 🟢 P1-A

> **Phase**: 7 — 기술 안정성 + 감정 안전장치
> **우선순위**: P1-A (의존성: 6-1 mood_label, physical_signals 필드)
> **마이그레이션**: 없음 (AsyncStorage)
> **출처**: `TODO(psychology).md` 라인 2716-2956

---

**심리학 근거**
- **재방문 의지 보호**: 입력 손실 = 의지 꺾음
- 회복 도구에서 가장 비싼 자산: 사용자의 **"다시 시도할 용기"**

**현재 상태**

일기 작성 중 탭 이동 시 **입력 전부 손실**.

```
/journal/index → [감정 온도 5점, 감정 라벨 2개 입력] 
              → [탭 이동 / 뒤로가기]
              → [모든 입력 손실]
```

**개선 방향**

매 입력 후 **AsyncStorage에 자동 저장**.
돌아올 때 **draft 복구** 옵션 제시.

**Phase 5 오프라인 큐와의 관계 (Opus 검증 누락 7 결정)**

- **Phase 5-1 (기존 오프라인 큐)**: *완료된* 일기를 서버 저장 실패 시 큐잉 → 온라인 복귀 시 flush
- **7-1 (이번 draft)**: *작성 중인* 일기의 입력 보존 → 사용자가 화면 이탈 시 복구

두 시스템은 **서로 다른 단계**를 다루므로 **별도 시스템**:

```
[작성 중] ──draft (AsyncStorage key: "journal_draft")──→ [완성]
                                                          ↓
                                          [Supabase 저장 시도]
                                                ├ 성공 → draft 삭제
                                                └ 실패 → Phase 5 큐 (key: "offline_queue")
                                                          ↓
                                                      온라인 복귀 시 flush
```

키 이름 충돌 방지:
- 7-1: `journal_draft` (작성 중)
- Phase 5: `offline_queue` (완성됨, 동기화 대기)

복구 시 우선순위:
1. 진입 시 두 키 모두 확인
2. `journal_draft`가 있으면 → "이어서 쓰기" 모달
3. `offline_queue`에 entries 있으면 → 백그라운드 자동 sync (사용자에게 보이지 않음)

### 구현 방식

**Draft 데이터 구조** (실제 DB 컬럼명 사용)

```typescript
interface JournalDraft {
  step: 1 | 2 | 3;  // 1: mood, 2: direction, 3: question
  mood: {
    moodScore: number;          // DB: mood_score
    moodLabel: string[];         // DB: mood_label TEXT[]
    physicalSignals: string[];   // DB: physical_signals TEXT[]
    freeText: string;            // DB: free_text
  };
  direction: {
    direction: "catch" | "let_go" | "undecided";
    affectionLevel: number;      // DB: affection_level
  };
  question: {
    questionId?: string;
    answerText: string;
  };
  savedAt: number;  // timestamp
}
```

**저장 로직**

```typescript
// hooks/useJournalDraft.ts

export const useJournalDraft = () => {
  const saveDraft = async (draftData: JournalDraft) => {
    try {
      await AsyncStorage.setItem(
        "journal_draft",
        JSON.stringify(draftData)
      );
    } catch (e) {
      console.error("Draft save failed", e);
    }
  };

  const loadDraft = async (): Promise<JournalDraft | null> => {
    try {
      const data = await AsyncStorage.getItem("journal_draft");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Draft load failed", e);
      return null;
    }
  };

  const clearDraft = async () => {
    await AsyncStorage.removeItem("journal_draft");
  };

  return { saveDraft, loadDraft, clearDraft };
};
```

**저장 타이밍**

```typescript
// screens/journal/index.tsx (mood 화면)

const JournalMoodScreen = () => {
  const [moodScore, setMoodScore] = useState(5);   // DB 컬럼명과 일관
  const [moodLabel, setMoodLabel] = useState<string[]>([]);
  const [physicalSignals, setPhysicalSignals] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const { saveDraft } = useJournalDraft();

  const handleMoodScoreChange = async (value: number) => {
    setMoodScore(value);

    // 매 변경 후 draft 저장 (자동)
    await saveDraft({
      step: 1,
      mood: { moodScore: value, moodLabel, physicalSignals, freeText },
      direction: { direction: null, affectionLevel: 5 },
      question: { answerText: "" },
      savedAt: Date.now()
    });
  };

  const handleNext = async () => {
    // "다음" 버튼 클릭 시 draft 업데이트 후 진행
    await saveDraft({ step: 1, mood: { moodScore, moodLabel, physicalSignals, freeText }, ... });
    router.push("/journal/direction");
  };

  return (
    <ScreenWrapper>
      <MoodSlider value={moodScore} onChange={handleMoodScoreChange} />
      ...
    </ScreenWrapper>
  );
};
```

**복구 UX**

```typescript
// screens/journal/index.tsx

const JournalMoodScreen = () => {
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const { loadDraft, clearDraft } = useJournalDraft();

  useEffect(() => {
    (async () => {
      const existingDraft = await loadDraft();
      if (existingDraft) {
        setDraft(existingDraft);
        setShowDraftRestore(true);
      }
    })();
  }, []);

  const handleRestoreDraft = async () => {
    // Draft의 step에 맞춰서 해당 화면으로 이동
    if (draft?.step === 1) {
      setMoodScore(draft.mood.moodScore);
      setMoodLabel(draft.mood.moodLabel);
      setPhysicalSignals(draft.mood.physicalSignals);
      setFreeText(draft.mood.freeText);
      setShowDraftRestore(false);
    } else if (draft?.step === 2) {
      // direction 화면으로 자동 진행
      router.push("/journal/direction", { draft });
    }
  };

  return (
    <>
      {showDraftRestore && (
        <Modal visible transparent>
          <Text>
            이전에 쓰던 일기가 있어.
            {draft && (
              <Text>
                {new Date(draft.savedAt).toLocaleString()} 에 저장됨
              </Text>
            )}
          </Text>
          <Button onPress={handleRestoreDraft}>
            이어서 쓰기
          </Button>
          <Button
            onPress={async () => {
              await clearDraft();
              setShowDraftRestore(false);
            }}
          >
            새로 쓰기
          </Button>
        </Modal>
      )}
      
      {/* 기존 화면 */}
      ...
    </>
  );
};
```

**Draft 자동 정리**

```typescript
// 일기 저장 완료 후
const handleJournalSave = async () => {
  // DB 저장 성공 후
  if (success) {
    await clearDraft();  // draft 삭제
  }
};

// 옵션: 7일 이상 오래된 draft 자동 삭제
const cleanupOldDrafts = async () => {
  const draft = await loadDraft();
  if (draft && Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
    await clearDraft();
  }
};
```

**구현 순서**
1. `useJournalDraft` Hook 작성
2. 각 step (`/journal/index`, `/journal/direction`, `/journal/question`)에 `saveDraft` 통합
3. 진입 시 draft 로드 & 복구 모달 UI
4. 저장 완료 후 draft 삭제 로직

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-1](6-1-emotion-layers.md) (mood_label, physical_signals 필드)
- 🔗 의존성: [6-2](6-2-affection-axis.md) (affection_level 필드)
