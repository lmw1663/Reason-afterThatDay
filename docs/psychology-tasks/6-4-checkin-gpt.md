# 6-4. 체크인 GPT 응답 추가 🟡 P1-B

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P1-B (의존성: 6-3 Day 7 분기와 일관성)
> **마이그레이션**: 없음 (기존 테이블 활용 — checkin_responses 신규 ai_response 컬럼 검토)
> **출처**: `TODO(psychology).md` 라인 1027-1270

---

**심리학 근거**
- 유예 기간이 "감정이 가장 출렁이는 구간"
- 일기 작성(`/journal/response`)은 GPT 응답을 주는데, 가장 취약한 시점인 체크인은 응답 없음 = 비대칭

**현재 상태**
```
/cooling/checkin
├─ [텍스트 입력] "지금 마음"
└─ [저장] → router.back()

응답 없음. 일방향 입력 끝.
```

**개선 방향**

체크인 입력 후, Day별 톤을 달리하는 **GPT 공감 응답** 추가.

```
입력 → 저장 → GPT 호출 → 응답 표시 → [다시 입력] / [홈으로]
```

**Day별 응답 톤** (반말 — 기존 앱 톤 일관성)

| Day | GPT 프롬프트 톤 | 예시 |
|-----|----------------|------|
| 1 | "첫 충격 치유" | "첫 하루 견뎠어. 그것만으로 충분해." |
| 2 | "후회 정상화" | "지금 흔들리는 게 당연해. 너는 이미 충분히 생각했던 사람이야." |
| 3 | "분노 수용" | "미움과 분노가 떠오르는 것도 정상적인 감정이야." |
| 4 | "슬픔 지지" | "슬픔이 깊어지는 건 너가 약해서가 아니라, 그 관계가 소중했다는 뜻이야." |
| 5 | "의미 탐색" | "너가 이미 배움을 찾기 시작했어. 그게 회복의 신호야." |
| 6 | "미래 응원" | "미래를 그리기 시작했다면, 너는 충분히 회복하고 있어." |
| 7 | "최종 결정 지지 (양방향)" | 아래 별도 처리 — 사용자 입력 방향에 따라 다른 응답 |

**Day 7 역방향 입력 가이드 (Opus 검증 누락 8 수정)**

CLAUDE.md 절대 규칙 "방향 변화 비난 금지"를 지키려면, Day 7에 사용자가 *졸업 취소* 의향을 표현하는 경우에도 비난 없이 응답해야 함.

GPT 프롬프트에 분기 로직 추가:
```
[Day 7 — 사용자 입력 분류]

A. 졸업 의지 강화 ("이제 보낼 수 있을 것 같아", "고마워" 등)
   → 톤: "7일을 견뎌낸 너의 마음이 가장 정확한 답이야."

B. 졸업 취소 의향 ("아직 못 보내겠어", "더 기다리고 싶어" 등)
   → 톤: "지금 그 마음도 정상이야. 다시 흔들리는 것도 너의 정직한 마음이야.
          7일 더 기다려도 괜찮고, 졸업하지 않아도 괜찮아.
          너의 선택이 답이야."

C. 양가감정 ("졸업하고 싶지만 무서워", "맞는지 모르겠어" 등)
   → 톤: "확신이 없어도 괜찮아. 7일을 견뎌낸 너는 어떤 선택을 해도
          충분히 고민한 사람이야. 어느 쪽으로 가도 비난받지 않아."

분류 기준은 GPT가 자체 판단 (max_tokens=120, temperature=0.6)
```

**fallback 시 Day 7만 다른 처리**:
```typescript
// Day 7 fallback은 중립적 톤
FALLBACK_BY_DAY[7] = "7일을 견뎌낸 너의 마음을 존중해. 어느 쪽을 선택해도 너는 충분히 잘했어.";
```

**프롬프트 템플릿**

```
시스템 프롬프트 (GPT가 반말로 응답하도록 명시):

당신은 이별을 경험한 사용자의 유예 체크인 응답자입니다.
사용자가 유예 기간 중 쓴 감정을 받아서, 다음을 항상 유지하세요:

★ 응답 톤 (필수):
   - 한국어 친근한 반말로 응답할 것
   - "너", "너는", "너의"를 사용 (절대 "당신" 사용 금지)
   - 어미는 "~야", "~어", "~지" (절대 "~예요", "~어요" 금지)
   - 예시: "지금 그 마음, 정상이야. 너는 충분히 고민했어."

1. 결정을 흔들지 않으면서도 지지하기
   - "졸업이 잘못되었다"는 암시 금지
   - "그만 생각하고 잊어버려"라는 회피 조장 금지
   - 대신: "그 마음이 정상이고, 너는 충분히 고민했어"

2. Day별 심리 단계 맞추기
   - Day 1: 호흡과 안정
   - Day 2~3: 감정 정상화
   - Day 4: 슬픔의 깊이 인정
   - Day 5: 의미 찾기
   - Day 6~7: 미래와 통합

3. 말투 원칙 (CLAUDE.md)
   - 단정 금지
   - 가능성 제시
   - 비난 금지

사용자 입력: [Day + 체크인 텍스트]
응답: 1~2문장, 따뜻하고 구체적인 반말 메시지
```

**Edge Function 구현**

새로운 Edge Function: `/functions/cooling-checkin-response`

```typescript
// POST /cooling-checkin-response
// { userId, coolingPeriodId, day, checkinText }

const prompt = `
[Day ${day}] 유예 기간 중 체크인
사용자의 말: "${checkinText}"

위의 프롬프트를 고려해서, 
이 사용자의 Day ${day} 감정에 맞춰 
따뜻하고 구체적인 1~2문장 응답을 만들어줘.
`;

// gpt-4.1-mini 호출 (CLAUDE.md 절대 규칙: 기본 모델)
// 5초 타임아웃 + fallback 필수
const FALLBACK_BY_DAY: Record<number, string> = {
  1: "첫 하루를 견뎌낸 것만으로 충분해. 천천히 호흡해보자.",
  2: "지금 흔들리는 것도 정상이야. 너는 충분히 고민했던 사람이야.",
  3: "미움이나 분노가 떠올라도 괜찮아. 그것도 너의 정직한 마음이야.",
  4: "슬픔이 깊어지는 것은 그 관계가 너에게 소중했다는 뜻이야.",
  5: "배움을 찾기 시작했다는 것 자체가 회복의 신호야.",
  6: "미래를 그리고 있다면 충분히 회복하고 있는 거야.",
  7: "7일을 견뎌낸 너의 마음이 가장 정확한 답이야."
};

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",  // CLAUDE.md 절대 규칙
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
    temperature: 0.7
  }, { signal: controller.signal });

  clearTimeout(timeoutId);
  return response.choices[0].message.content;
} catch (error) {
  // CLAUDE.md 절대 규칙: GPT 실패 시 fallback 필수
  console.warn("cooling-checkin-response GPT 실패, fallback 사용", error);
  return FALLBACK_BY_DAY[day] ?? FALLBACK_BY_DAY[1];
}
```

**UI 구현**

6-9와 같이 *별도 라우트 분리* (채팅 UI 회피 + 일관성):
- `/cooling/checkin` (입력 화면)
- `/cooling/checkin/response` (응답 화면)

```typescript
// screens/cooling/checkin.tsx (입력 화면)
const CheckinScreen = () => {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setIsLoading(true);

    try {
      // 체크인 저장
      const checkin = await addCheckinResponse(cooling.id, response);

      // GPT 응답 호출 (서버에서 fallback 처리)
      await fetchCoolingCheckinResponse({
        userId: user.id,
        coolingPeriodId: cooling.id,
        checkinId: checkin.id,
        day: getDayNumber(),
        checkinText: response
      });

      // 응답 화면으로 이동 (DB에서 조회)
      router.push({
        pathname: '/cooling/checkin/response',
        params: { checkinId: checkin.id }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TextInput
          value={response}
          onChangeText={setResponse}
          placeholder="지금 마음을 적어줘"
        />
        <Button onPress={handleSubmit} disabled={isLoading || !response.trim()}>
          {isLoading ? "잠깐만..." : "저장"}
        </Button>
      </View>
    </ScreenWrapper>
  );
};

// screens/cooling/checkin/response.tsx (응답 화면 — 별도 라우트)
const CheckinResponseScreen = () => {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>();
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // DB에서 AI 응답 조회 (params로 직접 받지 않음 — 보안)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('checkin_responses')
        .select('ai_response')
        .eq('id', checkinId)
        .single();
      setAiResponse(data?.ai_response ?? null);
    })();
  }, [checkinId]);

  if (!aiResponse) return <LoadingOverlay />;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.aiMessage}>{aiResponse}</Text>
        <Button onPress={() => router.back()}>다시 입력</Button>
        <Button onPress={() => router.replace('/cooling')}>홈으로</Button>
      </View>
    </ScreenWrapper>
  );
};
```

**6-9와 동일 패턴**: 별도 라우트 + DB 조회 (params로 응답 직접 전달 X).

**구현 순서**
1. Edge Function `/functions/cooling-checkin-response` 작성
2. `api/ai.ts`에 `fetchCoolingCheckinResponse` 함수 추가
3. `/cooling/checkin.tsx` UI 개편
4. 테스트 (Day별 응답 톤 일관성 확인)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-3](6-3-cooling-day-content.md) (Day 7 분기 일관성)
- 🔗 패턴 공유: [6-9](6-9-graduation-farewell.md) (별도 라우트 + DB 조회)
