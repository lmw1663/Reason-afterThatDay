# Phase 2 — 공유 질문 풀 / 관계 분석 / 나침반 (원문 이관본)

## 2-1. 공유 질문 풀 시스템

**파일**
- `api/questions.ts`
- `store/useQuestionStore.ts`
- `supabase/migrations/003_question_pool_seed.sql`
- `constants/questionPool.ts` — 오프라인 폴백용 초기 데이터

**질문 상태머신 저장 모델**

상태는 `question_responses` 테이블 확장으로 관리한다 (별도 테이블 불필요).

```sql
-- migration 001에 포함
alter table public.question_responses
  add column question_status text default 'answered'
    check (question_status in ('shown', 'answered', 'stale', 're_ask'));
-- unseen = 해당 user_id로 row 없음
-- shown  = row 생성됐지만 응답 전 (질문이 화면에 노출된 시점에 row 삽입)
-- answered = response_value 채워짐
-- stale  = answered이나 방향 급변 또는 72시간 경과 시 서버/앱이 업데이트
-- re_ask = stale + 쿨다운(72h) 경과 → 재노출 대상
```

```
unseen → shown → answered → stale → re_ask
                                  ↑ 72시간 쿨다운 후 (updated_at 기준)
```

**useQuestionStore 스니펫**
```ts
// 맥락별 질문 필터링 + 점수화
function selectQuestion(
  pool: Question[],
  context: QuestionContext,
  answered: AnsweredMap,
  recentDirection: Direction
): Question {
  return pool
    .filter(q => q.context.includes(context) && q.is_active)
    .filter(q => !isInCooldown(answered[q.id]))  // 72시간 쿨다운
    .sort((a, b) => scoreQuestion(b, answered, recentDirection)
                   - scoreQuestion(a, answered, recentDirection))[0];
}
// score = relevance + novelty + stability + emotional_safety
```

**트레이드오프**
- 질문 풀 서버 단독 vs 앱 번들 포함: 서버 우선(동적 추가 가능) + `constants/questionPool.ts`에 초기 데이터 번들 포함해 오프라인/초기 로드 대비.

--이것도 너가 선택해줘

---

## 2-2. 관계 분석 트랙

**파일**
- `app/analysis/index.tsx` — 헤어진 이유 (reason 카테고리)
- `app/analysis/pros-cons.tsx` — 장단점 탭 전환
- `app/analysis/stay-leave.tsx` — 잡아야/보내야 양쪽 동시
- `app/analysis/role-partner.tsx` — 내역할 + 상대마음 통합
- `app/analysis/result.tsx` — 가망 진단 (미터 3개)
- `store/useRelationshipStore.ts`
- `api/relationship.ts`

**가망 진단 점수 산식**
```ts
// utils/diagnosis.ts
// reconnect%: 극복가능성(fix) 가중치 0.5 + 상대마음(other) 0.3 + 내역할(role) 0.2
// fixPct%: fix값 직접 반영 + 장점/단점 비율 보정
// heal%: 일기 7일 평균 mood_score 정규화 (1~10 → 0~100%)
export function calcDiagnosis(profile: RelationshipProfile, moodAvg: number) {
  const reconnect = profile.fix * 0.5 + profile.other * 0.3 + profile.role * 0.2;
  const fix = profile.fix * 0.7 + (profile.pros.length / (profile.pros.length + profile.cons.length + 0.01)) * 0.3;
  const heal = (moodAvg - 1) / 9;
  return { reconnect, fix, heal };
}
```

**트레이드오프**
- 가망 진단 점수 노출 방식: 숫자 % vs 미터바. % 숫자는 사용자가 집착할 수 있어 미터바(3단계 표시) 선택. 결과 화면에 "정답이 아니야" 문구 필수.

--미터바로 하는게 나을 거 같아.

---

## 2-3. 결정 나침반 트랙

**파일**
- `app/compass/index.tsx` — Step 0: 데이터 요약 카드
- `app/compass/want.tsx` — Step 1: 솔직한 마음 + 변화 추적
- `app/compass/check.tsx` — Step 2: 공유 질문 기반 이성 체크
- `app/compass/scenario.tsx` — Step 3
- `app/compass/needle.tsx` — Step 4: 나침반 결과
- `app/compass/action.tsx` — Step 5: 행동 제안
- `store/useDecisionStore.ts`

**나침반 경계값 판정**
```ts
// utils/diagnosis.ts
// diff = (잡아야점수 합산) - (보내야점수 합산)  범위 -10 ~ +10
export function compassVerdict(diff: number): CompassVerdict {
  if (diff >= 3)  return 'strong_catch';
  if (diff >= 1)  return 'lean_catch';
  if (diff > -1)  return 'undecided';
  if (diff > -3)  return 'lean_let_go';
  return 'strong_let_go';
}
```

**트레이드오프**
- 나침반 결과를 확정적 문구로 표시 vs 가능성 제시: CLAUDE.md 규칙에 따라 단정 금지. "~인 것 같아", "~해 보여" 말투 + "정답이 아니야" 문구 필수.

-- 가능성 제시로 하자.

