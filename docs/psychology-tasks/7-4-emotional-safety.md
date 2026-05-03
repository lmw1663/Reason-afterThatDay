# 7-4. 감정 안전장치 (위기 신호 감지) 🔴 P0 (생명 안전 — 절대 규칙급)

> **Phase**: 7 — 기술 안정성 + 감정 안전장치
> **우선순위**: P0 (생명 안전 — 코드 작성 전 필수)
> **마이그레이션**: 없음 (기존 mood_score 활용)
> **선행 작업**: CLAUDE.md 절대 규칙 추가, 핫라인 정보 사실 검증
> **출처**: `TODO(psychology).md` 라인 3282-3548

---

**심리학 근거**
- 이별 후 **3일 연속 극저온(1~2점)** = 임상적 위험 신호
- **새벽 시간대(00:00~04:00) 진입** = 자살 위험 지표
- "혼자가 아니라는 신호" = 보호 인자

**현재 상태**

위기 신호 감지 기능 없음 (0%)

**개선 방향**

```
알고리즘:
1. 3일 연속 온도 1~2점 감지
   → "안녕 확인" 메시지 + 자원 안내

2. 새벽 시간대(00:00~04:00) 진입 감지
   → 부드러운 권고 ("너무 늦었어. 휴식할까?")

3. 익명 통계 표시 (반말 톤 + 50명 이상일 때만)
   → "이 시점에 비슷한 마음을 적은 사람이 47명 있어"

4. 위기 핫라인 옵트인 (정보 안내 화면은 존댓말 예외)
   → "필요하면 전문 상담을 받을 수 있습니다"
```

### 구현 방식

**1. 3일 연속 저온 감지 + 반복 트리거 방지**

같은 위험 신호가 매 진입마다 반복 노출되면 사용자는 무뎌짐.
한 번 트리거 후 *3일 침묵* 로직 추가:

```typescript
// hooks/useEmotionalSafety.ts

const SILENCE_KEY = "emotional_safety_last_trigger";
const SILENCE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;  // 3일

export const useEmotionalSafety = () => {
  // 마지막 트리거 후 3일 이내면 침묵
  const isInSilenceWindow = async (): Promise<boolean> => {
    const lastTriggeredAt = await AsyncStorage.getItem(SILENCE_KEY);
    if (!lastTriggeredAt) return false;
    return Date.now() - Number(lastTriggeredAt) < SILENCE_DURATION_MS;
  };

  const recordTrigger = async () => {
    await AsyncStorage.setItem(SILENCE_KEY, String(Date.now()));
  };

  const checkConsecutiveLowTemperature = async (userId: string) => {
    // 침묵 기간이면 트리거 X
    if (await isInSilenceWindow()) {
      return { triggered: false };
    }

    // 최근 3일 일기 조회
    const last3Days = await fetchJournalEntries({
      userId,
      limit: 3,
      orderBy: "date DESC"
    });

    // 모두 1~2점이면 위험 (DB 컬럼명: mood_score)
    const allCritical = last3Days.every(entry =>
      entry.mood_score <= 2
    );

    if (allCritical && last3Days.length === 3) {
      await recordTrigger();  // 트리거 기록 → 3일간 침묵
      return {
        triggered: true,
        type: "consecutive_low_mood_score"
      };
    }

    return { triggered: false };
  };

  const checkLateNightAccess = async () => {
    // 침묵 기간이면 트리거 X
    if (await isInSilenceWindow()) {
      return { triggered: false };
    }

    const hour = new Date().getHours();  // getHours() 반환값은 0~23
    if (hour < 4) {  // 00:00 ~ 03:59 (이별 후 새벽 진입은 임상적 위험 신호)
      await recordTrigger();
      return {
        triggered: true,
        type: "late_night_access"
      };
    }
    return { triggered: false };
  };

  return { checkConsecutiveLowTemperature, checkLateNightAccess };
};
```

**침묵 정책**:
- 3일 연속 저온 감지 → 모달 표시 → 그 후 3일간은 같은 신호 무시
- 새벽 진입 감지 → 모달 표시 → 그 후 3일간은 무시
- 둘 다 같은 SILENCE_KEY 공유 (위기 신호는 통합 침묵)
- 사용자가 "전문 상담 알아보기" 클릭하면 그 자체가 도움 요청 → 별도 처리

**2. 안녕 확인 모달**

```typescript
// components/EmotionalCheckModal.tsx

interface EmotionalCheckModalProps {
  type: "consecutive_low" | "late_night";
  onClose: () => void;
}

export const EmotionalCheckModal = ({
  type,
  onClose
}: EmotionalCheckModalProps) => {
  // 톤 정책: 안녕 확인 단계는 반말 (정보 전달이 아닌 정서적 접촉)
  // /resources/hotline 화면만 존댓말 예외 (정보 전달)
  const messages = {
    consecutive_low: {
      title: "요즘 정말 힘들어 보여",
      body: "3일 연속 마음이 1~2점 정도였어.\n정말 괜찮아?\n혼자가 아니야. 함께할 수 있어.",
      cta: "전문 상담 알아보기"
    },
    late_night: {
      title: "너무 늦었어",
      body: "새벽엔 이런 마음들이 커지곤 해.\n잠시 휴식을 취해볼까?\n내일 아침이 훨씬 다를 거야.",
      cta: "호흡하기"
    }
  };

  const config = messages[type];

  return (
    <Modal visible transparent>
      <ScreenWrapper>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.body}>{config.body}</Text>

        <Button onPress={() => router.push('/resources/hotline')}>
          {config.cta}
        </Button>

        <Button onPress={onClose} style={styles.secondaryButton}>
          지금은 괜찮아, 닫기
        </Button>
      </ScreenWrapper>
    </Modal>
  );
};
```

**3. 익명 통계**

DB에 저장된 모든 감정 온도를 D+N별로 집계 (실제 DB 컬럼명):

```sql
SELECT
  u.breakup_date,
  DATE(je.created_at AT TIME ZONE 'Asia/Seoul') - u.breakup_date AS days_since_breakup,
  je.mood_score,
  COUNT(*) AS count
FROM public.journal_entries je
JOIN public.users u ON je.user_id = u.id
WHERE je.mood_score <= 2
GROUP BY
  u.breakup_date,
  days_since_breakup,
  je.mood_score
ORDER BY days_since_breakup ASC;
```

클라이언트에서 (반말 톤 + 50명 미만 가드):
```typescript
// 50명 미만이면 통계 노출 X (출시 직후 "혼자다" 인상 방지)
if (count < 50) return null;

const message = `
이 시점에 비슷한 마음을 적은 사람이
${count}명 있어.

너만 힘든 게 아니야.
그리고 대부분은 이 시간을 견뎌냈어.
`;
```

**4. 위기 핫라인 옵트인**

⚠️ **사실 검증 필수**: 핫라인 정보는 출시 직전 보건복지부 공식 자료(국가정신건강정보포털)로 재확인해야 함.
잘못된 번호 표시는 생명에 직결되는 위험이므로, 임의 입력 금지.

새 화면: `/resources/hotline`

```
어려울 때 도움을 받을 수 있는 곳

📞 24시간 위기 상담 (무료, 비밀 보장)
  • 자살예방 상담전화: 1393
  • 정신건강 위기상담전화: 1577-0199
  • 청소년 전화: 1388
  • 여성 긴급전화: 1366

💬 온라인 / 채팅 상담
  • 보건복지상담센터: 129
  • 한국생명의전화 사이버상담:
    https://www.lifeline.or.kr

📱 앱 안에서 호흡하기
  → 떠오름 진입점(🫧)으로 이동

알려두기:
  • 모든 상담은 비밀이 보장돼.
  • 너의 선택을 존중해.
  • 위 번호로 연락하지 않아도 괜찮아.
```

**자료 출처 (검증 필수)**:
- 자살예방 상담전화 1393: 보건복지부 운영, 24시간
- 정신건강 위기상담전화 1577-0199: 정신건강복지센터 운영
- 청소년 전화 1388: 여성가족부 운영
- 여성 긴급전화 1366: 여성가족부 운영

코드에 하드코딩 금지 — `resources/crisis-hotlines.json` 별도 파일로 관리하여
출시 전 한 번 더 사실 확인할 수 있게 함:

```typescript
// resources/crisis-hotlines.json
{
  "verified_at": "2026-05-02",
  "verified_by": "<운영자명>",
  "source_url": "https://www.mohw.go.kr/...",
  "hotlines": [
    {
      "name": "자살예방 상담전화",
      "number": "1393",
      "available": "24시간",
      "operator": "보건복지부"
    },
    // ...
  ]
}
```

### 구현 순서

**우선순위 P1 (반드시 구현)**
1. 3일 연속 저온 감지 로직 (`useEmotionalSafety` Hook)
2. 안녕 확인 모달 UI
3. 홈 화면/일기 화면에서 체크 로직 추가

**우선순위 P2 (있으면 좋음)**
4. 익명 통계 쿼리 + 메시지 표시
5. `/resources/hotline` 화면 생성
6. 위기 핫라인 정보 수집 (기관별)

**우선순위 P3 (추후)**
7. 데이터 분석: 감정 저온 사용자 → 설문 → 피드백 수집

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 의존성: [6-1](6-1-emotion-layers.md) (mood_score 데이터 누적 필요)
- 🔗 보완: [6-5](6-5-intrusive-memory.md) (호흡 가이드 — late_night CTA)
