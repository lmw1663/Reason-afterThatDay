# 6-8. 시점별 장단점 분리 누적 🔴 P2

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P2 (큰 비용, 기술 복잡도 높음)
> **마이그레이션**: 010
> **출처**: `TODO(psychology).md` 라인 1712-1891

---

**심리학 근거**
- **로시 회상(rosy retrospection)**: D+1~14에 장점만 떠오름
- **객관적 평가**: D+30 이후에야 양면을 객관화할 수 있음
- 현재 동시 입력 = 시간차 무시 = 분석 왜곡

**현재 상태**

```
/analysis/pros-cons
├─ [장점 탭] + [입력 리스트]
└─ [단점 탭] + [입력 리스트]

Day 1 사용자가 입력하면:
  장점: 10개
  단점: 2개 (떠올리기 힘듦)

→ 분석 결과: "재결합 60%" (왜곡)
```

**개선 방향**

장단점을 **시간별로 구분**해서 누적.

```
Day 1~14: "장점 필드" 중심
            (로시 회상이 자연스러움)

Day 15~30: 양쪽 모두 수집
           (객관성 높아짐)

Day 30+: "단점 재평가" 프롬프트
```

### 구현 방식

**DB 스키마 개편**

현재 `relationship_profile`:
```sql
pros: JSONB[]  -- ["장점1", "장점2", ...]
cons: JSONB[]  -- ["단점1", "단점2", ...]
```

개편 후:
```sql
-- 기존 필드 유지 (하위호환)
pros: JSONB[]
cons: JSONB[]

-- 신규 필드: 시간별 누적
pros_by_date: JSONB  -- { "D+5": ["장점1", ...], "D+15": [...] }
cons_by_date: JSONB  -- { "D+15": ["단점1", ...], "D+25": [...] }

-- 또는 별도 테이블
-- relationship_profile_timeline (user_id, day, type, items)
```

**입력 흐름**

Day 1~14 사용자:
```
/analysis/reasons
   → /analysis/pros-cons
      [장점 입력 강조, 단점은 선택사항]
   → /analysis/stay-leave
   → /analysis/result
```

Day 15~30 사용자:
```
/analysis/reasons
   → /analysis/pros-cons
      [장점 vs 단점 동등 표시]
   → ...
```

Day 30+ 사용자:
```
앞서 입력한 장점/단점 보여주고:
"이제 다른 관점에서 봐야 할 것 있을까?"
   [단점 추가 / 장점 재평가]
```

**UI 개편**

`/analysis/pros-cons` 화면:

```typescript
const ProConsScreen = () => {
  const daysSinceBreakup = getDaysSinceBreakup();

  return (
    <ScreenWrapper>
      {daysSinceBreakup < 15 ? (
        // 초기: 장점 중심
        <>
          <Text>
            "아직 초기라서 상대방의 좋은 점이
             많이 떠오를 거야. 그래도 괜찮아."
          </Text>
          <Tabs>
            <Tab label="장점 (지금 보이는 것)">
              <InputList items={pros} onAdd={...} />
            </Tab>
            <Tab label="단점 (있으면)">
              <InputList items={cons} onAdd={...} />
            </Tab>
          </Tabs>
        </>
      ) : (
        // 중기: 양면 균형
        <>
          <Text>
            "이제 양쪽을 더 객관적으로 볼 수 있을 거야."
          </Text>
          <Tabs>
            <Tab label="장점">
              <InputList items={pros} onAdd={...} />
            </Tab>
            <Tab label="단점">
              <InputList items={cons} onAdd={...} />
            </Tab>
          </Tabs>
        </>
      )}
    </ScreenWrapper>
  );
};
```

**메시지 톤** (반말 일관성)

Day 5:
> "아직 상대방의 좋은 점들이 많이 떠올라.
> 그래도 괜찮아. 그것도 너의 정직한 마음이니까."

Day 20:
> "이제 양쪽을 더 균형 있게 봐야 할 때야.
> 전에 못 봤던 단점들도 보이기 시작할 거야."

Day 35:
> "전에 입력했던 내용을 다시 봐볼까?
> 지금은 어떻게 보여?"

**분석 결과 수정**

가망 진단 계산 시:
```
// Before: pros, cons를 그냥 사용
reconnectPct = calculateReconnect(pros, cons);

// After: 시간 가중치 적용
const timeWeight = {
  reconnect: daysSinceBreakup < 15 ? 0.5 : 1.0,  // 초기는 로시 회상 가능성
  fixPct: daysSinceBreakup < 30 ? 0.7 : 1.0,
  heal: ...
};

reconnectPct = calculateReconnect(
  pros, cons, timeWeight
);

// 결과에도 추가 (반말 톤)
<Text>
  "이 수치는 지금의 온도를 반영하고 있어.
   나중에 분석하면 다를 수 있어."
</Text>
```

**구현 순서**
1. DB 마이그레이션: `pros_by_date`, `cons_by_date` 필드 추가 (마이그레이션 010)
2. `/analysis/pros-cons` UI Day 분기 로직 추가
3. 입력 로직: Day별로 다른 필드에 저장
4. 분석 계산: 시간 가중치 적용
5. 결과 화면: 시간성 명시 메시지 추가

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 결과 화면 톤: [6-7](6-7-result-timing.md) (시간성 명시)
