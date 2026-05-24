# 연락 충동 보고 칩 — 페르소나별 노출 정책

> `components/ContactUrgeChip.tsx`가 홈에 매일 노출될지를 결정하는 임상 안전 정책.
> SSOT: `constants/personaBranches.ts` Ref-6 (`isContactUrgeChipBlocked`).
> 작성 기준일: 2026-05-08 / Branch: `main`

---

## 배경

`ContactUrgeChip`은 사용자가 "오늘 연락하고 싶었어?"를 1탭으로 보고하고 7일 추세를 시각화하는 보조 카드다. 본래 목적은 **충동 자가 인식**과 **패턴 학습**.

그러나 *모든 페르소나에 동일하게 매일 노출*하는 기존 정책은 일부 페르소나에서 임상적으로 역효과를 낸다. 이 문서는 각 페르소나별 노출 가부 결정 근거를 정리한다.

---

## 정책 표

### ✅ 노출 (15)

| 페르소나 | 분류 | 노출 근거 |
|---|---|---|
| P03 불안형 | C 조절 | **핵심 타겟** — 매달림·반복 연락 충동 자가 인식 1차 도구 |
| P06 반복 사이클 | C 조절 | **핵심 타겟** — 패턴 인식·행동 차단 |
| P10 분노 지배 | C 조절 | **핵심 타겟** — 충동적 lash-out 모니터링 |
| P11 두려움형 | C 조절 | 양가감정 자기 인식 |
| P09 헌신 소진 | D 의미 | 돌봄 충동 자각 |
| P05 죄책감 | D 의미 | 사과 충동 모니터링 |
| P04 갑작스러운 통보 | D 의미 | 종결 추구 충동 자각 |
| P07 첫 이별 | D 의미 | 충동 정상화 (첫 경험) |
| P01 자기 판단 손상 | C 조절 | 현실 검증 보조 |
| P02 회피형 | B 접촉 | 충동 인식 강제 (회피 깨기) |
| P08 장기 권태 | B 접촉 | default |
| P12 안정형 | D 의미 | default — baseline |
| P15 동거 정리 | D 의미 | 일상 트리거 모니터링 |
| P18 사회적 얽힘 | D 의미 | 마주침 맥락 인식 |
| (분류 미정 / null) | — | default 노출 — 온보딩 미완 또는 baseline |

### ❌ 차단 (5)

| 페르소나 | 분류 | 차단 근거 |
|---|---|---|
| **P14** 외도 가해 | A 안전 | 가해자→피해자 연락 충동 +1 카운트는 *행동 권장* 톤이 됨. 피해자 보호 우선 |
| **P16** 결혼·이혼 | D 의미 | 자녀 양육·법적 사유로 *필수 연락*이 존재 → 충동 vs 의무 구분 모호해 카드 의미가 깨짐 |
| **P17** 강제 이별 | D 의미 | 사별·접근금지·실종·강제 이별 — 연락 자체가 불가능해 노출이 잔인. CLAUDE.md 매듭 권유 비허용 페르소나와도 정합 |
| **P19** ROCD | C 조절 | 매일 "오늘 연락하고 싶었어?"라는 질문 자체가 강박 도구화 자극 |
| **P20** 트라우마 본딩 | A 안전 | 연락 = 재희생 위험. +1 누적 표시가 충동 정상화로 흐를 위험. 안전 우선 페르소나 |

---

## 다중 페르소나 처리

`appliesGuard` 패턴(R5 "부의 금기만 추가")으로 검사 — `effective` 또는 `guardOverlay` 한 쪽이라도 차단 페르소나면 숨김.

**예:**
- 주 P03 + 부 P14 → P14 보호 우선으로 칩 숨김
- 주 P10 + 부 P19 → P19 강박 우려로 칩 숨김
- 주 P12 + 부 P03 → 둘 다 비차단 → 노출

---

## 구현 위치

| 위치 | 역할 |
|---|---|
| `constants/personaBranches.ts` Ref-6 | `isContactUrgeChipBlocked(p)` predicate 정의 |
| `app/(tabs)/index.tsx` | `appliesGuard(resolved, isContactUrgeChipBlocked)`로 조건부 렌더 |
| `constants/__tests__/personaBranches.test.ts` | 차단 5종 + 비차단 14종 + null 케이스 단위 테스트 |

---

## 참조

- 페르소나 4유형 분류: [`constants/personaTypology.ts`](../constants/personaTypology.ts)
- 다중 페르소나 충돌 해소: [`utils/personaResolver.ts`](../utils/personaResolver.ts)
- 화면 분기 SSOT: [`constants/personaBranches.ts`](../constants/personaBranches.ts)
- 매듭 권유 비허용 페르소나(P03·P11·P16·P19): [`CLAUDE.md`](../CLAUDE.md) 절대 규칙
- 새벽 푸시 차단(P03): `personaBranches.ts` Ref-3 — 본 정책과 직접 관련 없으나 *충동 시간대 보호*라는 같은 원칙 적용
