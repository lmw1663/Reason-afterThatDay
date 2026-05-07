---
title: 졸업 트랙 재설계 스펙 (Graduation → 매듭)
status: 결정 반영 (Q1~Q6 답변 2026-05-07)
created: 2026-05-07
updated: 2026-05-07
owner: leeminwoo
관련:
  - TODO.md Phase A-4 (졸업 트랙 일시 보류)
  - docs/psychology-logic/페르소나-화면-액션-매트릭스.md §C9 (셀 SSOT)
  - docs/psychology-logic/페르소나.md (P01~P20 정의)
  - docs/guide/03-journal-and-cooling-policy.md (기존 7일 유예 정책)
  - CLAUDE.md 절대 규칙: 졸업 즉시 확정 금지·유예 알림·방향 변화 비난 금지
---

# 0. 한 줄 요약

> "졸업"이라는 *단방향 종결 의식*을 폐기하고, **페르소나별 라벨·기간·재진입 가능성을 가진 가역적 "매듭(knot)"** 으로 재설계한다.

A-4 보류 해제 조건("임상 재검증 + 페르소나별 졸업 흐름 별도 설계")의 *별도 설계* 부분을 본 문서로 충족한다.

---

# 1. 보류 사유와 재설계 동기 (요약)

**보류 사유** (TODO.md Phase A-4):
1. 단일 7일 유예가 페르소나별 위험도(P02 트라우마 본딩, P11 두려움형, P19 ROCD 등)를 무시함
2. "졸업"이라는 학사적·단방향 어휘가 *방향 변화 비난 금지* 원칙과 충돌함
3. 매트릭스 적용 전 4탭 구조가 새 안전 위계와 안 맞음

**재설계가 필요한 이유**:
1. 종결 의식(closure ritual)은 회복 심리학에서 유의미한 마일스톤 — D+N 무한 누적은 "끝이 안 보이는" 피로 누적
2. C9 매트릭스 셀이 *fully spec'd* 상태로 남아 있음 (페르소나-화면-액션-매트릭스.md §C9) — 이걸 실행 가능한 명세로 변환만 하면 됨
3. P05·P06·P14·P19·P20 등은 *명시적 자기 종결 의식*이 회복에 핵심

---

# 2. 설계 원칙 (Hard Rules)

| # | 원칙 | 검증 방법 |
|---|------|-----------|
| H1 | **가역성** — 매듭 후 언제든 재일기·재진입 가능, 기존 데이터 보존 | DB: 매듭 row가 사용자 데이터를 잠그지 않음 / UI: 매듭 후에도 일기 탭 진입 가능 |
| H2 | **비낙인** — "재발/실패" 어휘 금지, "사이클의 일부" 프레임 | `lint:persona` 룰 확장 (재발·실패·복귀 어휘 금지) |
| H3 | **비단정** — "정답이 아니야" 문구 의무 (CLAUDE.md 절대 규칙 준수) | 매듭 결과 화면 스냅샷 테스트 |
| H4 | **페르소나별 라벨·기간** — 단일 "졸업"·"7일" 강제 금지 | `cooling_period_days`·`graduation_label` 컬럼화 |
| H5 | **승낙 기반 노출** — 평소 매듭 트랙은 UI에서 완전히 숨김. 시간·안전·페르소나 6조건 모두 충족 시 권유 모달 1회 발화 → 승낙 시에만 하단 탭 추가 | §4-3 트리거 검증 |
| H6 | **비활성 페르소나 존중** — P13 사별·P19 ROCD·P11 두려움형은 *진입 가능* 하되 *권유 금지* / P02·P20은 *별도 트랙* | 매트릭스 §C9 분기 충실 |
| H7 | **유예 중 알림 정책 유지** — CLAUDE.md "유예 알림" 규칙 그대로 (Day 1~6 무알림, Day 7 1회만, B-1 안부 재확인 예외) | 기존 푸시 스케줄러 변경 없이 운영 |

---

# 3. 어휘·라벨 정책

## 3-1. 핵심 어휘 변경

| 기존 | 신규 | 이유 |
|------|------|------|
| 졸업 (graduation) | **매듭 (knot)** — 기본 라벨 | 학사적 단방향 어휘 제거. 매듭은 *짓고 풀 수 있는* 가역 어휘 |
| 졸업 신청 | 매듭 짓기 | 동일 |
| 졸업 취소 | 매듭 풀기 | "취소"의 부정적 함의 제거 |
| 졸업 확정 | 매듭 완료 / *페르소나별 변형* | — |
| 7일 유예 | 매듭 준비 (cooling) | 변경 없음 (내부 컬럼·테이블 명만 유지) |

**코드·DB 호환**: 기존 `graduation_cooling`·`graduation_farewell` 테이블명은 *유지* (마이그레이션 비용·RLS 복잡도). 사용자 노출 어휘만 교체. **사용자 노출 코드에서는 "졸업" 어휘 사용 금지** — `lint:persona` 룰에 추가.

## 3-2. 페르소나별 라벨 매트릭스

매트릭스 §C9 SSOT를 기반으로, 사용자에게 보이는 라벨을 페르소나별로 분기:

| 페르소나 | 매듭 라벨 | 매듭 본문 톤 | 진입 권유 |
|----------|-----------|--------------|-----------|
| P01 자기 판단 손상 | 매듭 | "너의 판단은 정당했어" verdict 강화 | 표준 |
| P02 회피형 | 매듭 (ritual 짧은 버전) | 감정 대신 *행동 기록*에 초점 | 표준 |
| P03 불안형 | 매듭 | "이제 보내자" 류 모두 금지 | **비허용** (트리거·자발 모두 차단) |
| P04 갑작스러운 통보 | 매듭 (+심리교육) | "종결은 본인이 만드는 것" 카드 의무 | 표준 |
| P05 본인이 끝낸 죄책감 | 매듭 (+회상 의식) | D+30/D+60 *재방문 회상 의식* 자동 발화 | 표준 |
| P06 반복 재회 사이클 | 매듭 (+사이클 회고) | 14일 cooling, 재진입 시 "지난번엔 어땠어?" 강제 | 표준 |
| P07 첫 이별 충격 | 매듭 | "성숙한 결정"·"어른스럽게" 어휘 금지 | 표준 |
| P08 권태로 끝난 장기 | 매듭 | "빠른 새출발" 어휘 금지 | 표준 |
| P09 헌신 소진 | 매듭 | 표준 | 표준 |
| P10 분노 지배 | 매듭 | "용서" 어휘 모두 금지 | 표준 |
| P11 두려움형 | 매듭 | "마음을 정해" 류 결정 강요 모두 금지 | **비허용** (트리거·자발 모두 차단) |
| P12 안정형 (baseline) | 매듭 | 기본 톤 | 표준 |
| P13 사별 | — | **트랙 비활성** (이별 앱 범위 밖) | — |
| P14 외도 가해 후회 | 매듭 | "자기 용서" D+60까지 잠금 | 표준 |
| P15 동거 정리 | 매듭 (+행정 분기) | 행정 미완료 시 "행정 정리부터" 분기 | 표준 |
| P16 결혼·이혼 | **마무리** (매듭 변형) | "마무리는 법적 절차 후" 안내 / D+30 권유 금지 | **비허용** (페르소나 재추정 후 이행 시에만) |
| P17 강제 이별 | **마무리** | "결정" → "수용" 어휘 치환 | 표준 |
| P18 사회적 얽힘 | 매듭 | 표준 | 표준 |
| P19 ROCD | 매듭 | 3회 번복 시 *전문가 의뢰 카드* | **비허용** (트리거·자발 모두 차단) |
| P20 트라우마 본딩 | **단절 30일 달성** | "이별" 어휘 대신 "단절" / 신체적 안전 우선 | **별도 트랙** (D+30 단절 유지가 트리거) |

---

# 4. UX 흐름

## 4-1. 진입 경로 (사용자 결정 2026-05-07)

**원칙**: 평소엔 매듭 트랙이 *완전히 보이지 않음*. 일정 시간 + 안전 조건 만족 시 시스템이 *권유 모달*을 1회 발화. 사용자가 승낙해야만 하단 탭 *제일 오른쪽*에 매듭 탭이 동적으로 노출된다.

```
[홈 = 오늘 탭]
  └─ 트리거 발화 (§4-3 조건 모두 충족 시 1회만)
       ↓
[매듭 짓기 시작할까? 권유 모달 — 풀스크린]
  ├─ "지금은 아니야" → 모달 닫고 다음 트리거 시점까지 재발화 안 함
  └─ "응, 매듭을 지을래" → useKnotStore.setKnotTabVisible(true)
       ↓
[하단 탭 제일 오른쪽에 *매듭* 탭 동적 추가]
  └─ 매듭 탭 진입
       ├─ 1. 자격·상태 보고  (현 report.tsx 재사용)
       ├─ 2. AI 편지         (현 letter.tsx — 라벨·톤 페르소나 분기)
       ├─ 3. 마지막 한 줄    (현 farewell.tsx — 80자 제한 유지)
       ├─ 4. 의식 선택       (현 ritual.tsx — 4 옵션 + 페르소나별 추가 옵션)
       └─ 5. cooling 시작    (현 request.tsx — 페르소나별 일수 분기)
            ↓
[Cooling N일]
  └─ Day N: 최종 확인 푸시 1회 (CLAUDE.md 절대 규칙 준수)
       ↓
[매듭 완료] → 매듭 탭 자동 제거, archive로 일기·기록 보존
              ↓
              가역 진입점: 일기 작성 시 "이 사이클을 다시 시작할래?" 1회 prompt
                          (탭 추가는 *자발 진입* 아닌 다음 트리거 발화부터)
```

**동적 탭 토글 구현**:

```tsx
// app/(tabs)/_layout.tsx — 추가
const knotTabVisible = useKnotStore((s) => s.knotTabVisible);
<Tabs.Screen
  name="knot"
  options={{
    href: knotTabVisible ? '/knot' : null,
    title: '매듭',
    tabBarIcon: ({ color }) => <TabIcon name="link" color={color} />,
  }}
/>
```

기존 `app/graduation/*.tsx` 파일은 새 `app/(tabs)/knot.tsx` 진입점에서 라우팅하거나, `/graduation/*` URL을 `/knot/*` alias로 추가 (사용자 결정 Q2).

## 4-2. 가역성 구현 (H1)

기존: `graduation_cooling.status = 'completed'` → 사용자 데이터 잠금 (가정)
신규:
- `status = 'completed'`도 *상태 라벨일 뿐* — 데이터 잠금 없음
- 일기 작성 시 *기존 cycle 이어쓰기 vs 새 cycle 시작* 선택지 제공 (1회 prompt)
- 새 cycle 시작 시 이전 cycle은 archive로, `relationship_profile.cycle_count++`
- 매듭 탭은 *완료 시 사라짐* — 다음 매듭은 다음 트리거 발화부터

## 4-3. 트리거 조건 (사용자 결정 — "일정 시간 + 조건")

**모든 조건 AND 충족 시에만 권유 모달 1회 발화**:

| 조건 | 기준 | 검증 위치 |
|------|------|-----------|
| **시간 조건** | 페르소나별 D+N 도달 (§4-3-1 표) | `useUserStore.daysElapsed` |
| **회복 안정성** | 최근 7일 평균 mood_score ≥ 4 | `useJournalStore.stats` |
| **위기 신호 없음** | 최근 3일 연속 mood 1~2점 없음 + 새벽 진입(0~4시) 없음 | `useUserStore.crisisFlag` |
| **C-SSRS 잠금 해제** | 결정 트랙 잠금 상태 아님 | `useSafetyStore.locked === false` |
| **페르소나 권유 가능** | §3-2의 권유 가능 페르소나만 | `useKnotPolicy()` |
| **재발화 방지** | 같은 D+N 트리거 1회만 / "지금은 아니야" 거절 후 다음 트리거까지 침묵 | `useKnotStore.lastPromptAt` |

### 4-3-1. 페르소나별 트리거 시점

| 페르소나 | 트리거 시점 | 비고 |
|----------|-------------|------|
| P12 안정형 (baseline) | D+30 | 표준 |
| P01·P02·P04·P05·P07·P08·P09·P10·P14·P15·P17·P18 | D+30 | 표준 |
| P06 반복 재회 사이클 | D+30 + 사이클 인식 카드 통과 | 가역적 — *자기 사이클*임을 인지한 후만 |
| P13 사별 | **트리거 발화 안 함** (영구) | 트랙 비활성 |
| **P03 불안형 / P11 두려움형 / P16 결혼·이혼 / P19 ROCD** | **트리거 발화 안 함** | 사용자 결정 Q5 = "비허용" — 자발 진입도 차단 |
| P20 트라우마 본딩 | 단절 유지 30일 달성 시 (최초 1회만) | 사용자 결정 Q4 = "최초만" |

**페르소나 재추정 시 동작**: 페르소나는 D+30/D+60에 재추정됨 (페르소나.md §전이). P03 → P12 같은 이행이 일어나면 그때부터 트리거 발화 가능. 즉 *영구 비허용*이 아니라 *현재 페르소나가 비허용일 때만 침묵*.

---

# 5. 데이터 모델 변경

## 5-1. 신규 마이그레이션

다음 마이그레이션 번호: **032 ~ 034** (현재 031까지)

### `032_cooling_persona.sql`

```sql
-- graduation_cooling에 페르소나별 일수·라벨 컬럼 추가
ALTER TABLE public.graduation_cooling
  ADD COLUMN cooling_period_days INT NOT NULL DEFAULT 7
    CHECK (cooling_period_days IN (3, 7, 14, 30)),
  ADD COLUMN knot_label TEXT NOT NULL DEFAULT '매듭'
    CHECK (knot_label IN ('매듭', '마무리', '단절 30일 달성')),
  ADD COLUMN persona_codes TEXT[] DEFAULT '{}',
  ADD COLUMN cycle_index INT NOT NULL DEFAULT 1;
-- cooling_ends_at은 이제 requested_at + cooling_period_days로 계산

CREATE INDEX gc_user_cycle_idx
  ON public.graduation_cooling(user_id, cycle_index DESC);
```

### `033_relationship_cycle.sql`

```sql
-- 같은 관계에 대한 매듭 사이클 누적
ALTER TABLE public.relationship_profile
  ADD COLUMN cycle_count INT NOT NULL DEFAULT 1,
  ADD COLUMN last_knot_at TIMESTAMPTZ,
  ADD COLUMN last_knot_label TEXT;

-- archive: 이전 cycle의 일기·질문 응답을 보존하되 view에서만 노출
CREATE TABLE public.knot_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  cycle_index INT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  knot_label TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb -- 일기 수, 평균 mood, 페르소나 등 스냅샷
);

ALTER TABLE public.knot_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_archive" ON public.knot_archive
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_archive" ON public.knot_archive
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### `034_revisit_rituals.sql` (P05 D+30/60 회상 의식)

```sql
-- 매듭 후 자동 회상 푸시 스케줄
CREATE TABLE public.knot_revisit_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  ritual_type TEXT NOT NULL CHECK (ritual_type IN ('d30_revisit', 'd60_revisit', 'd30_cycle_review')),
  triggered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.knot_revisit_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_own_revisit" ON public.knot_revisit_schedule
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## 5-2. 기존 테이블 변경 없음 (호환성)

- `graduation_cooling` — 컬럼 추가만 (이름 유지)
- `graduation_farewell` — 변경 없음 (한 번 쓴 작별은 수정·삭제 불가 정책 유지)
- `cooling_reflections` — 변경 없음 (Day 5/6 학습·미래 계획)

---

# 6. 알림 정책 (CLAUDE.md 절대 규칙 + 본 스펙)

| 시점 | 알림 | 페르소나 변형 |
|------|------|---------------|
| 매듭 짓기 신청 직후 | 즉시 안내 1회 (cooling 시작) | — |
| Cooling Day 1~(N-1) | **무알림** (CLAUDE.md 절대 규칙) | C-SSRS 양성: B-1 안부 재확인 24h만 예외 |
| Cooling 마지막 날 | 최종 확인 1회 | — |
| 매듭 완료 시 | 즉시 안내 1회 (archive 보존 안내) | — |
| 매듭 후 D+30 | P05·P14: 회상 의식 푸시 / 그 외: 무알림 | `knot_revisit_schedule.d30_revisit` |
| 매듭 후 D+60 | P05·P14: 회상 의식 푸시 / 그 외: 무알림 | `knot_revisit_schedule.d60_revisit` |
| 매듭 후 D+7 | P06: 재가입 회고 트리거 (사이클 분석) | `knot_revisit_schedule.d30_cycle_review` |

**홈 권유 모달** (Q3 결정 후속):
- 평소엔 매듭 관련 UI *완전 비노출* (탭·카드·홈 슬롯 모두 없음)
- §4-3 6조건 AND 충족 시 홈 진입 직후 풀스크린 권유 모달 1회
- 거절 시 7일 쿨다운, 그 후 다음 트리거 발화까지 침묵
- 비허용 페르소나(P03·P11·P16·P19·P13)는 트리거 자체 미발화

---

# 7. 페르소나별 분기 — 실행 명세

매트릭스 §C9를 *코드 분기 단위*로 정규화. `utils/personaResolver.ts`의 충돌 해결 정책을 따름 (R1~R5 유지).

| 페르소나 | cooling_days | knot_label | 진입 권유 | 추가 동작 |
|----------|--------------|------------|-----------|-----------|
**범례**: 🟢 트리거 발화 가능 / 🔴 비허용 (트리거·자발 모두 차단) / ⚪ 트랙 비활성

| 페르소나 | cooling_days | knot_label | 트리거 | 추가 동작 |
|----------|--------------|------------|--------|-----------|
| P01 | 7 (3 옵션) | 매듭 | 🟢 D+30 | verdict "정당했어" 강화 |
| P02 | 7 | 매듭 | 🟢 D+30 | ritual 짧은 버전 |
| P03 | 14 (강제) | 매듭 | 🔴 | 페르소나 재추정 후 이행 시 가능 |
| P04 | 7 | 매듭 | 🟢 D+30 | 심리교육 카드 의무 |
| P05 | 7 | 매듭 | 🟢 D+30 | D+30/60 회상 의식 자동 |
| P06 | 14 | 매듭 | 🟢 D+30 | 사이클 인식 카드 통과 후 + D+7 사이클 회고 + 30일 데이터 보존 |
| P07 | 7 | 매듭 | 🟢 D+30 | "성숙한 결정" 어휘 차단 |
| P08 | 7 | 매듭 | 🟢 D+30 | "빠른 새출발" 차단 |
| P09 | 7 | 매듭 | 🟢 D+30 | — |
| P10 | 7 | 매듭 | 🟢 D+30 | "용서" 차단 |
| P11 | 14 | 매듭 | 🔴 | 페르소나 재추정 후 이행 시 가능 |
| P12 | 7 | 매듭 | 🟢 D+30 | baseline |
| P13 | — | — | ⚪ | **트랙 비활성** |
| P14 | 7 | 매듭 | 🟢 D+30 | 자기 용서 D+60 잠금 |
| P15 | 7 | 매듭 | 🟢 D+30 | 행정 체크리스트 분기 |
| P16 | opt-out | 마무리 | 🔴 | 페르소나 재추정 후 이행 시 가능 |
| P17 | 7 | 마무리 | 🟢 D+30 | "결정" → "수용" 치환 |
| P18 | 7 | 매듭 | 🟢 D+30 | — |
| P19 | 7 | 매듭 | 🔴 | 페르소나 재추정 후 이행 시 가능 |
| P20 | 30 | 단절 30일 달성 | 🟢 단절 30일 (최초 1회만) | 별도 트랙 — 신체적 안전 우선 |

**충돌 해결**: 다중 페르소나 시 매트릭스 §4-1 우선순위 적용 (안전 > 라벨 변경 > 일수 차등 > baseline).

---

# 8. 코드 변경 범위

## 8-1. 새 파일 / 변경 파일

| 경로 | 변경 | 비고 |
|------|------|------|
| `app/graduation/*.tsx` | **유지하되 사용자 노출 어휘 교체** | URL은 `/graduation/*` 보존 (deep link 호환) + `/knot/*` alias 추가 |
| `app/(tabs)/_layout.tsx` | `<Tabs.Screen name="knot" href={knotTabVisible ? '/knot' : null}>` 동적 추가 — 제일 오른쪽 | F-4 |
| `app/(tabs)/knot.tsx` | **신규** — 매듭 탭 진입점 (graduation 흐름으로 라우팅) | F-7 |
| `app/(tabs)/index.tsx` | 홈 진입 시 트리거 평가 → `KnotPromptModal` 발화 | F-6 |
| `app/knot/prompt.tsx` | **신규** — 풀스크린 권유 모달 ("매듭 짓기 시작할까?") | F-5 |
| `store/useKnotStore.ts` | **신규** — `knotTabVisible`·`lastPromptAt`·`lastTriggerCycle` | F-3 |
| `utils/knotPolicy.ts` | **신규** — 페르소나 → cooling_days·label·트리거 가능 여부 매핑 | `personaResolver.ts` 결과 입력 |
| `utils/personaResolver.ts` | knot 관련 R5 보강 (비허용 페르소나가 충돌 시 *전체 비허용*) | 영향도 낮음 |
| `api/graduation.ts` | persona 컨텍스트 입력 → cooling_period_days 동적 계산 | 신규 컬럼 사용 |
| `lint:persona` 룰 | "재발/실패/졸업/복귀" 어휘 금지 추가 | 예외: `app/resources/`, `app/legal/` |
| `supabase/migrations/032~034` | **신규** | §5-1 |

## 8-2. archive 처리 (TODO.md A-4 line 134 — "기존 [6-9] 졸업 작별 문장 → archive로 이동")

- 기존 `graduation_farewell` row는 **그대로 보존** (수정·삭제 불가 정책 유지)
- 사용자 [기록] 탭에서 *매듭 archive*로 노출
- 새 사이클 시작 시 새 row 추가, 기존 row는 cycle_index로 구분

---

# 9. 임상 재검증 체크리스트 (A-4 해제 조건 ①)

본 스펙이 실행 가능하려면 다음 임상 검증이 필요. 외부 의존이라 본 문서로 *충족 불가* — 별도 외부 작업.

- [ ] P02·P11·P19·P16 *권유 금지* 정책의 임상적 타당성 (전문가 자문)
- [ ] P20 *단절 30일* 트리거가 트라우마 본딩 사용자에게 안전한지 (자해·재접촉 위험 평가)
- [ ] P05 D+30/D+60 회상 의식의 *재트라우마화* 위험 평가
- [ ] "매듭" 어휘가 한국어 사용자에게 *학사적 졸업*보다 안전한지 사용자 테스트 (n≥10)
- [ ] C-SSRS 양성 사용자에 대한 매듭 트랙 *완전 잠금* 정책 (현 결정 트랙 잠금 정책 확장)

---

# 10. 결정사항 (2026-05-07 사용자 답변)

| # | 항목 | 결정 |
|---|------|------|
| Q1 | 어휘 | **"매듭" 확정** |
| Q2 | URL 경로 | `/knot/*` **alias 추가** + `/graduation/*` 유지 (점진 전환) |
| Q3 | 매듭 풀기(재진입) UI | **일정 시간 + 안전 조건 충족 시 권유 모달** → 승낙 시 *하단 탭 제일 오른쪽*에 매듭 탭 동적 추가 (§4-1·§4-3) |
| Q4 | P20 단절 30일 트리거 | **최초 1회만** (재트리거 위험) |
| Q5 | 권유 금지 페르소나의 자발 진입 | **비허용** — 트리거·자발 모두 차단. 페르소나 재추정으로 이행 시에만 가능 |
| Q6 | TODO.md Phase 분류 | **Phase F 신설** ("매듭 트랙 부활") |

**Q3 후속 결정사항** (구현 디테일):
- 권유 모달: 풀스크린 화면 (`app/knot/prompt.tsx` 신규)
- 거절 시: 다음 트리거 발화까지 침묵 (재발화 방지 — `lastPromptAt` + 7일 쿨다운 권장)
- 매듭 완료 시: 탭 자동 제거. 가역 진입은 일기 작성 시 1회 prompt로만, 탭 *직접 재추가* 없음 (다음 트리거를 기다림)
- 거절 후 일기 trigger 재실행: 거절자도 페르소나 재추정 후 트리거 재발화 가능

---

# 11. 작업 순서 (제안)

A-4가 *해제* 되었을 때 가정. 임상 재검증(§9) 완료 후 진행.

| 단계 | 작업 | 의존 |
|------|------|------|
| F-1 | 마이그레이션 032~034 작성·적용 (`cooling_period_days`·`knot_label`·`cycle_index`·`knot_archive`·`knot_revisit_schedule`) | — |
| F-2 | `utils/knotPolicy.ts` 신규 (페르소나 → cooling_days·label·트리거 가능 여부) + `personaResolver.ts` 보강 | F-1 |
| F-3 | `useKnotStore` 신규 (`knotTabVisible`·`lastPromptAt`·`lastTriggerCycle`) | F-2 |
| F-4 | `app/(tabs)/_layout.tsx`에 `<Tabs.Screen name="knot" href={knotTabVisible ? '/knot' : null}>` 추가 — 제일 오른쪽 | F-3 |
| F-5 | `app/knot/prompt.tsx` 신규 — 풀스크린 권유 모달 | F-3 |
| F-6 | 트리거 평가 로직 — 홈 진입 시 §4-3 6조건 AND 평가 → 발화 | F-2·F-3 |
| F-7 | `app/(tabs)/knot.tsx` 진입점 + 기존 `app/graduation/*` 어휘 교체 + `/knot/*` alias | F-2 |
| F-8 | 가역성 — 일기 작성 시 사이클 시작 prompt + `cycle_index` 증가 로직 | F-1 |
| F-9 | 회상 의식 스케줄러 (P05·P14·P06 D+30/60/사이클 회고) | F-1·푸시 인프라 |
| F-10 | archive view (knot_archive → [기록] 탭에 노출) | F-1 |
| F-11 | `lint:persona` 어휘 룰 확장 (재발/실패/복귀/졸업 차단) | — |
| F-12 | 통합 테스트 + opus agent 임상 검증 | F-1~F-11 |
| F-13 | A-4 해제 + TODO.md 갱신 + CLAUDE.md 절대 규칙 표 보강 | F-12 |

---

# 12. 영향도·리스크

| 영역 | 영향 | 완화책 |
|------|------|--------|
| 기존 사용자 | 최소 — 기존 cooling은 cycle_index=1로 자동 마이그레이션 | DEFAULT 값으로 비파괴 변경 |
| URL 호환 | `/graduation/*` 유지하면 영향 없음 | Q2 결정에 따라 |
| 푸시 인프라 | 신규 스케줄러 필요 (D+30/60 회상) | Phase 4 푸시 인프라 재활용 |
| GPT 프롬프트 | 페르소나·knot_label 컨텍스트 주입 필요 | `gpt-response/` Edge Function 입력 확장 |
| 임상 안전 | P20·P19·P03·P11 분기 누락 시 위험 | §9 체크리스트 통과 전 배포 금지 |

---

# 13. 결론

본 스펙은 *졸업 트랙의 영구 폐기*가 아니라, **단방향 종결 의식 → 페르소나별 가역 매듭**으로의 재설계 명세이다.

C9 매트릭스 SSOT가 fully spec'd 상태였기 때문에 *새 설계*가 아닌 *명세 변환*에 가깝다. 가장 큰 변화는 (1) 어휘 교체, (2) 가역성 도입, (3) 페르소나별 cooling_days·label 컬럼화, (4) 권유 금지 페르소나의 자발 진입 보장.

**Q1~Q6 결정 완료** (2026-05-07): §10 참조. 핵심 변경:
- "매듭" 어휘 확정
- `/knot/*` alias 추가
- **승낙 기반 동적 탭** — 평소엔 UI에서 완전 비노출, 권유 모달 승낙 시에만 하단 탭 제일 오른쪽에 추가
- P20 단절 30일은 최초 1회만
- 비허용 페르소나는 *자발 진입도 차단*
- TODO.md Phase F 신설

**남은 외부 의존**: §9 임상 재검증 — 외부 작업으로 분리. 임상 재검증과 무관하게 Phase F 작업 순서(§11)는 진행 가능 (코드 분기는 페르소나 정책에 따라 매트릭스 SSOT 충실히 따르므로).
