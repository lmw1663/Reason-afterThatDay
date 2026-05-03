# TODO(psychology).md — 심리학 기반 이별 회복 로드맵 (인덱스)

> 심리학자 관점 분석(`docs/psychology-analysis.md`)을 기반으로 한 상세 구현 계획.
> **본 파일은 인덱스**입니다. 각 항목의 상세 내용은 [`docs/psychology-tasks/`](docs/psychology-tasks/) 폴더에 항목별로 분리되어 있습니다.
>
> **분리 이유**: 원본 3,700+ 줄 → 한 번에 읽기에 너무 김 → 작업 단위로 적절한 크기 (각 100-450줄)
> **마지막 검증**: 2026-05-02 (Opus V4 검증 완료, 94% 동기화)

---

## 🚀 작업 시작 흐름 (필수)

### 모든 작업 공통 (Step 1~3)

1. 📋 **[00-overview.md](docs/psychology-tasks/00-overview.md)** — 톤 정책 + 마이그레이션 일람 확인 (필독)
2. 🎯 **[PRIORITY.md](docs/psychology-tasks/PRIORITY.md)** — 작업할 항목 선택
3. 📄 **해당 항목 파일** 읽기 (예: `6-1-emotion-layers.md`)

### 조건부 추가 참조 (Step 4~5)

4. 🔗 **공유 컴포넌트가 등장하면 → [_shared-components.md](docs/psychology-tasks/_shared-components.md)**
   - `BreathingGuide`, `CoolingOffWarningModal`, `EMOTION_LABELS` 등의 *유일한 사양* 확인
   - 항목 파일과 사양 불일치 시 → `_shared-components.md`가 권위

5. 🗺️ **의존성 있는 작업이면 → [README.md](docs/psychology-tasks/README.md) 의존성 그래프**
   - 의존하는 다른 항목 파일도 함께 읽기

### 작업 진행 (Step 6)

6. 코드 작성 / 문서 변경

### 작업 후 (Step 7)

7. ✅ **[VALIDATION-CHECKLIST.md](docs/psychology-tasks/VALIDATION-CHECKLIST.md)** — 동기화 체크 + 회귀 검증

---

## 개요

### 현황
- ✅ Phase 0-5: 기술 완성도 100% (모든 기능 구현)
- ⚠️ 심리학적 깊이: "결정 보조"에 특화, **"애도 회복(grief work)" 트랙 비어있음**

### 목표
**Kübler-Ross 5단계 애도 모델** + **Worden 4과제** + **DBT 개입**을 통합하여
사용자가 상실의 슬픔을 안전하게 통과하고 의미 있게 졸업할 수 있게 함.

### 기대 효과
- **회복 경험 품질 ↑** — "내 감정이 정상이구나"하는 안정감
- **재방문 의지 ↑** — 매일 강요가 아니라 필요 시점의 맞춤형 경험
- **위기 신호 감지율 ↑** — 3일 연속 최저 감정 → 자동 안녕 확인

---

## 📚 메타 문서 (먼저 읽기)

| 파일 | 내용 | 언제 읽나 |
|------|------|---------|
| 📋 [00-overview.md](docs/psychology-tasks/00-overview.md) | 개요 + 톤 정책 + 마이그레이션 일람 | 모든 작업 전 (필독) |
| 🎯 [PRIORITY.md](docs/psychology-tasks/PRIORITY.md) | P0/P1-A/P1-B/P2/P3 우선순위 정렬 | 작업 선택 시 |
| 🔗 [_shared-components.md](docs/psychology-tasks/_shared-components.md) | 공유 컴포넌트 단일 명세 (BreathingGuide, CoolingOffWarningModal 등) | 공유 사양 다룰 때 |
| ✅ [VALIDATION-CHECKLIST.md](docs/psychology-tasks/VALIDATION-CHECKLIST.md) | 최종 검증 + 변경 시 동기화 체크 | 작업 완료 후 |
| 📁 [README.md](docs/psychology-tasks/README.md) | 항목별 인덱스 + 의존성 그래프 | 의존성 확인 시 |

---

## 🌱 Phase 6 — 감정 회복 강화

| 우선순위 | 항목 | 마이그레이션 |
|---------|------|-------------|
| 🟡 P1-B | [6-0. 온보딩 확장: 연애 기간](docs/psychology-tasks/6-0-onboarding-duration.md) | 015 |
| 🟢 P1-A | [6-1. 일기 감정 입력 다층화](docs/psychology-tasks/6-1-emotion-layers.md) | 006 |
| 🟡 P1-B | [6-2. 원망↔애정 수평축](docs/psychology-tasks/6-2-affection-axis.md) | 007 |
| 🟡 P1-B | [6-3. Day별 유예 콘텐츠](docs/psychology-tasks/6-3-cooling-day-content.md) | 008 |
| 🟡 P1-B | [6-4. 체크인 GPT 응답](docs/psychology-tasks/6-4-checkin-gpt.md) | 없음 |
| 🟢 P1-A | [6-5. 떠오름 빠른 진입점](docs/psychology-tasks/6-5-intrusive-memory.md) | 009 |
| 🟢 P1-A | [6-6. 분석 D+7 게이트](docs/psychology-tasks/6-6-time-gate.md) | 없음 |
| 🟢 P1-A | [6-7. 진단 결과 시간성 명시](docs/psychology-tasks/6-7-result-timing.md) | 없음 |
| 🔴 P2 | [6-8. 시점별 장단점 분리](docs/psychology-tasks/6-8-temporal-pros-cons.md) | 010 |
| 🔴 P2 | [6-9. 졸업 양방향성](docs/psychology-tasks/6-9-graduation-farewell.md) | 012 |
| 🔵 P3 | [6-10. 추억 능동 정리](docs/psychology-tasks/6-10-memory-organization.md) | 013 |
| 🟡 P1-B | [6-11. 자기 성찰 트랙](docs/psychology-tasks/6-11-self-reflection.md) | 014 |

---

## 🛡️ Phase 7 — 기술 안정성 + 감정 안전장치

| 우선순위 | 항목 | 마이그레이션 |
|---------|------|-------------|
| 🟢 P1-A | [7-1. 일기 임시 저장 (draft)](docs/psychology-tasks/7-1-journal-draft.md) | 없음 |
| 🔴 P2 | [7-2. 일기 미니 모드](docs/psychology-tasks/7-2-mini-mode.md) | 011 |
| 🟢 P1-A | [7-3. 저장 실패 재시도 UI](docs/psychology-tasks/7-3-error-retry.md) | 없음 |
| 🔴 P0 | [7-4. 감정 안전장치 (위기 신호)](docs/psychology-tasks/7-4-emotional-safety.md) | 없음 |

---

## 📌 작업 흐름 권장 순서

### Step 1: P0 선행 (코드 작성 전)
1. CLAUDE.md 절대 규칙 추가 (위기 신호 감지)
2. 위기 핫라인 정보 사실 검증 → `resources/crisis-hotlines.json`

### Step 2: P1-A 6개 (의존성 없음, 빠르게 진행 가능)
- 6-1, 6-5, 6-6, 6-7, 7-1, 7-3
- 동시 작업 가능 (서로 영향 없음)

### Step 3: P1-B 5개 (의존성 있음)
- 6-0 → 6-11 (연애 기간 데이터 활용)
- 6-2 (6-1 의존)
- 6-3 → 6-4 (Day 7 분기 일관성)

### Step 4: P0 본격 구현
- 7-4 (6-1 데이터 누적 후 가능)

### Step 5: P2 + P3 (출시 후 점진적)
- 6-8, 6-9, 7-2, 6-10

---

## 🔗 외부 참조

- [psychology-analysis.md](docs/psychology-analysis.md) — 심리학 분석 원본
- [user-flow.md](docs/user-flow.md) — 현재 앱 흐름
- [reason_project_v2.md](docs/reason_project_v2.md) — 전체 기획 원문
- [CLAUDE.md](CLAUDE.md) — 절대 규칙 + 컨벤션
- [VALIDATION-OPUS-V4(psychology).md](VALIDATION-OPUS-V4(psychology).md) — 최종 검증 보고서

---

*인덱스 작성: 2026-05-02 | 분리 기준: 한 작업당 하나의 파일 (100-450줄)*
*Opus 1차 + 2차 + 3차 + 4차 검증 모두 반영 (94% 동기화)*
