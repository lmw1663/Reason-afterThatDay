# 6-9. 졸업 의식의 양방향성 강화 🔴 P2

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P2 (의미 부여 능동성, 일회성 효과)
> **마이그레이션**: 012
> **출처**: `TODO(psychology).md` 라인 1892-2198

---

**심리학 근거**
- **의미 부여의 능동성**: 읽기만 하는 것 vs. 직접 쓰는 것
- **상징적 마무리 행위**: 편지 쓰기, 물리적 종결이 회복에 결정적

**현재 상태**

```
/graduation/report → /graduation/letter → /graduation/confirm
                        (AI 편지만 읽기)      (확인 문제)
```

**개선 방향**

`/graduation/letter`를 **능동적 입력 + AI 응답** 양방향 흐름으로 개편하되,
CLAUDE.md 절대 규칙 (채팅 UI 금지) 준수를 위해 **두 단계를 별도 라우트로 분리**.

```
/graduation/letter           — 사용자 작별 문장 입력 (한 줄)
   ↓ push
/graduation/letter/response  — AI 응답 화면 (사용자 메시지는 작은 캡션으로만 회상)
   ↓ push
/graduation/confirm
```

### 구현 방식

**화면 재구성 (채팅 UI 회피)**

기존:
```
/graduation/letter
├─ [성장 리포트 보기]
├─ [AI 졸업 편지] (읽기만)
└─ [다음] → /graduation/confirm
```

개편 (별도 라우트 + 화면 전환형 UX 유지):
```
[화면 1] /graduation/letter
├─ 제목: "너의 마지막 한 줄"
├─ 가이드: "상대에게, 또는 과거의 너 자신에게
              마지막으로 하고 싶은 말을 한 줄로 적어줘."
├─ 입력 필드:
│  [텍스트 입력, maxLength=80, 플레이스홀더:
│   "예: 고마워. 이제 나를 좋아해줄 사람을 찾을 거야."]
└─ [저장하기] → router.push('/graduation/letter/response')

[화면 2] /graduation/letter/response
├─ AI 응답 (화면 메인):
│  "그 마음으로 이별을 맺는 너의 모습이
│   가장 성숙한 마무리야..."
├─ (작은 캡션 — 사용자 메시지는 회상용으로만, 채팅 형태 X)
│  "너의 한 줄: '고마워. 이제...'"
└─ [졸업 확인하기] → router.push('/graduation/confirm')

→ 한 화면 안에 "사용자 입력 필드 + AI 응답 카드"가 동시 노출되지 않음
→ 채팅 UI 패턴 회피 (CLAUDE.md 절대 규칙 준수)
```

**데이터 저장**

별도 테이블 채택 (마이그레이션 012, 이력 보존 + 미래 확장성):
```sql
-- migrations/012_graduation_farewell.sql
CREATE TABLE public.graduation_farewell (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  graduation_request_id UUID NOT NULL REFERENCES public.graduation_requests(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL CHECK (char_length(user_message) <= 80),  -- "한 줄" 제약
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLAUDE.md 절대 규칙: RLS 필수
ALTER TABLE public.graduation_farewell ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_farewell" ON public.graduation_farewell
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_farewell" ON public.graduation_farewell
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 작별 문장은 한번 쓰면 수정/삭제 불가 (의식적 행위 보존)
-- → UPDATE/DELETE 정책 의도적으로 생성 안 함
```

**Edge Function: 졸업 작별 응답**

새 엔드포인트: `/functions/graduation-farewell-response`

```typescript
// POST /graduation-farewell-response
// { userId, graduationRequestId, farewellMessage }

const prompt = `
사용자가 이별을 맺으면서 쓴 마지막 한 줄:
"${farewellMessage}"

이 한 줄에 대해 응답해주세요.

★ 응답 톤 (필수):
- 한국어 친근한 반말로 응답
- "너", "너는", "너의" 사용 (절대 "당신" 사용 금지)
- 어미는 "~야", "~어", "~지" (절대 "~예요", "~어요" 금지)
- 그 사람의 용기와 성숙함을 인정
- 미래에 대한 긍정적 메시지 담기
- 1~2문장, 따뜻하고 구체적으로

예시:
입력: "고마워, 그리고 미안해"
출력: "고마워하고 미안해할 줄 아는 너가 정말 멋있어. 그런 마음으로 이별하는 사람이 가장 빠르게 회복돼."

[응답]
`;

// CLAUDE.md 절대 규칙: 기본 모델 gpt-4.1-mini + fallback 필수
const FAREWELL_FALLBACK = 
  "그 마음으로 이별을 맺는 너의 모습이 가장 성숙한 마무리야. " +
  "그렇게 정직한 마음으로 보내는 사람이 다시 행복해질 거야.";

let aiResponseText: string;
try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",  // CLAUDE.md 절대 규칙
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.8
  }, { signal: controller.signal });

  clearTimeout(timeoutId);
  aiResponseText = response.choices[0].message.content;
} catch (error) {
  console.warn("graduation-farewell-response GPT 실패, fallback 사용", error);
  aiResponseText = FAREWELL_FALLBACK;
}

await db.insert_graduation_farewell({
  graduation_request_id,
  user_message: farewellMessage,
  ai_response: aiResponseText
});

return aiResponseText;
```

**UI 구현 (별도 라우트 + DB 조회 — 채팅 UI 회피 + 보안)**

router params로 긴 AI 응답 직접 전달은 *URL 길이/노출 위험*. DB 조회 패턴으로 처리:

```typescript
// screens/graduation/letter.tsx (입력 화면)

export const GraduationLetterScreen = () => {
  const [farewellMessage, setFarewellMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!farewellMessage.trim()) return;
    setIsLoading(true);

    try {
      // 서버에서 AI 응답 생성 + graduation_farewell 테이블에 저장
      // (반환값은 응답 텍스트지만, 화면에선 다시 조회로 사용 — 보안)
      await fetchGraduationFarewellResponse({
        userId: user.id,
        graduationRequestId: graduation.id,
        farewellMessage
      });

      // ID만 push — params에 긴 응답 텍스트 노출 회피
      router.push({
        pathname: '/graduation/letter/response',
        params: { graduationRequestId: graduation.id }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Text style={styles.title}>너의 마지막 한 줄</Text>
      <Text style={styles.guide}>
        상대에게, 또는 과거의 너 자신에게
        마지막으로 하고 싶은 말을 한 줄로 적어줘.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="예: 고마워. 이제 나를 좋아해줄 사람을 찾을 거야."
        maxLength={80}  // "한 줄" 제약 (압축의 임상적 의미)
        value={farewellMessage}
        onChangeText={setFarewellMessage}
      />
      <Button
        onPress={handleSubmit}
        disabled={!farewellMessage.trim() || isLoading}
      >
        {isLoading ? "잠깐만..." : "저장하기"}
      </Button>
    </ScreenWrapper>
  );
};

// screens/graduation/letter/response.tsx (응답 화면 — 별도 라우트, DB 조회)

export const GraduationLetterResponseScreen = () => {
  const { graduationRequestId } = useLocalSearchParams<{
    graduationRequestId: string;
  }>();
  const [farewell, setFarewell] = useState<{
    user_message: string;
    ai_response: string;
  } | null>(null);

  // params로 ID만 받고, 실제 데이터는 RLS로 보호된 DB에서 조회
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('graduation_farewell')
        .select('user_message, ai_response')
        .eq('graduation_request_id', graduationRequestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setFarewell(data);
    })();
  }, [graduationRequestId]);

  if (!farewell) return <LoadingOverlay />;

  return (
    <ScreenWrapper>
      {/* AI 응답을 메인으로 — 화면 전환형 UX */}
      <Text style={styles.aiMessage}>{farewell.ai_response}</Text>

      {/* 사용자 메시지는 작은 캡션으로 회상 (채팅 패턴 X) */}
      <Text style={styles.userMessageCaption}>
        너의 한 줄: "{farewell.user_message}"
      </Text>

      <Button onPress={() => router.push('/graduation/confirm')}>
        졸업 확인하기
      </Button>
    </ScreenWrapper>
  );
};
```

**보안 이점**:
- AI 응답 (최대 150 토큰)이 URL에 노출되지 않음
- RLS로 보호된 graduation_farewell 테이블에서만 데이터 접근
- 응답 화면 새로고침 시에도 DB에서 동일 데이터 조회 가능

**채팅 UI 회피 원칙**:
- 입력 필드와 AI 응답 카드가 **동일 화면에 동시 노출되지 않음**
- 사용자 메시지는 응답 화면에서 작은 캡션(회상용)으로만 표시
- 화면 전환 시 fadeUp 애니메이션 (CLAUDE.md UX 원칙)

**메시지 톤 가이드** (반말 일관성)

사용자 메시지 예시별 AI 응답:

```
사용자: "고마워, 그리고 미안해"
AI: "고마워하고 미안해할 줄 아는 너가
    정말 멋있어. 그런 마음으로 이별하는
    사람이 가장 빠르게 회복돼."

사용자: "이제 나를 찾을 거야"
AI: "그 결심이 맞아. 너는 충분히 잘했어.
    이제 너를 위한 시간을 가져봐."

사용자: "왜 더 잘하지 못했을까"
AI: "너는 최선을 다했어.
    누구도 완벽한 사람은 없으니까.
    이제 너를 용서해줘."
```

**hook → 6-11 자기 성찰 연계**

`/graduation/letter/response` 화면 하단에 **다음 단계 안내**:

```
[졸업 확인하기 →]    (메인 CTA, 기존)

┌─────────────────────────────────┐
│ 졸업 후에도 너에 대해           │
│ 더 알아갈 수 있어.              │
│                                 │
│ [나에 대해 알아가기]            │
└─────────────────────────────────┘
```

졸업 후에도 6-11이 영구 트랙으로 남아있음을 안내. 사용자가 작별 한 줄에 *"이제 나를 찾을 거야"* 같은 자기 인식 메시지를 적었으면 더 자연스러운 흐름.

**구현 순서**
1. `graduation_farewell` 테이블 + RLS 추가 (마이그레이션 012)
2. Edge Function `/functions/graduation-farewell-response` 작성 (gpt-4.1-mini + fallback + 5초 타임아웃)
3. `/graduation/letter.tsx` 입력 화면 + `/graduation/letter/response.tsx` 응답 화면 (별도 라우트)
4. 메시지 톤 QA (다양한 사용자 입력에 대한 AI 응답 검증)
5. 졸업 후 6-11 안내 카드 추가

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 hook 연계: [6-11](6-11-self-reflection.md) (졸업 후 자기 성찰 안내)
- 🔗 패턴 공유: [6-4](6-4-checkin-gpt.md) (별도 라우트 + DB 조회)
- 🔗 톤 분기: [6-0](6-0-onboarding-duration.md) (장기 연애 시 다른 톤)
