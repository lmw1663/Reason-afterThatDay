# 📁 psychology-tasks/ — Phase 6-7 항목별 인덱스

> 심리학 기반 이별 회복 로드맵 (Phase 6-7).
> 메인 문서 [TODO(psychology).md](../../TODO(psychology).md)의 본문을 항목별로 분리해
> 한 작업당 하나의 파일만 읽으면 되도록 구성.
>
> **원본**: `TODO(psychology).md` (3,700+ 줄) — 한 번에 읽기에는 너무 김
> **분리 후**: 19개 파일, 각 100-450줄 — 작업 단위로 적절한 크기

---

## 🚀 작업 시작 흐름 (필수)

### 모든 작업 공통 (Step 1~3)

1. 📋 **[00-overview.md](00-overview.md)** — 톤 정책 + 마이그레이션 일람 확인 (필독)
2. 🎯 **[PRIORITY.md](PRIORITY.md)** — 우선순위 정렬에서 어떤 항목 작업할지 선택
3. 📄 **해당 항목 파일** 읽기 (예: `6-1-emotion-layers.md`)

### 조건부 추가 참조 (Step 4~5)

4. 🔗 **공유 컴포넌트가 등장하면 → [_shared-components.md](_shared-components.md)**
   - 항목 파일에 `BreathingGuide`, `CoolingOffWarningModal`, `EMOTION_LABELS` 등이 보이면 이 파일에서 *유일한 사양*을 확인
   - 항목 파일에 적힌 사양과 _shared-components.md의 사양이 다르면 → _shared-components.md가 권위

5. 🗺️ **의존성 있는 작업이면 → README.md 의존성 그래프**
   - 아래 §🗺️ 의존성 그래프 참조
   - 의존하는 다른 항목 파일도 함께 읽기 (예: 6-11 작업 → 6-0, 6-1, 6-6도 같이)

### 작업 진행 (Step 6)

6. 코드 작성 / 문서 변경

### 작업 후 (Step 7)

7. ✅ **[VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md) 확인**
   - "변경 시 동기화 체크" 섹션 모든 항목 검증
   - 빠른 검증 명령어로 회귀 확인 (톤, 모델명, RLS 등)

---

## 📚 메타 문서

| 파일 | 내용 | 언제 읽나 |
|------|------|---------|
| 📋 [00-overview.md](00-overview.md) | 개요 + 톤 정책 + 마이그레이션 일람 | 모든 작업 전 (필독) |
| 🎯 [PRIORITY.md](PRIORITY.md) | P0/P1-A/P1-B/P2/P3 우선순위 정렬 | 작업 선택 시 |
| 🔗 [_shared-components.md](_shared-components.md) | 공유 컴포넌트 단일 명세 (BreathingGuide, CoolingOffWarningModal, EMOTION_LABELS 등) | 공유 사양 다룰 때 |
| ✅ [VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md) | 최종 검증 + 변경 시 동기화 체크 (V1~V4 검증 결함 모두 반영) | 작업 완료 후 |

---

## 🌱 Phase 6 — 감정 회복 강화 (Psychology-Based Improvements)

| 우선순위 | 항목 | 내용 | 마이그레이션 |
|---------|------|------|-------------|
| 🟡 P1-B | [6-0. 온보딩 확장: 연애 기간](6-0-onboarding-duration.md) | 단기/중기/장기 분기 + 5곳 활용 | 015 |
| 🟢 P1-A | [6-1. 일기 감정 입력 다층화](6-1-emotion-layers.md) | 12개 라벨 + 4개 신체 신호 | 006 |
| 🟡 P1-B | [6-2. 원망↔애정 수평축](6-2-affection-axis.md) | 7종 verdict + 회복 진행 신호 | 007 |
| 🟡 P1-B | [6-3. Day별 유예 콘텐츠](6-3-cooling-day-content.md) | Day 1~6 회복 작업 (호흡/회상/차트/의미/미래) | 008 |
| 🟡 P1-B | [6-4. 체크인 GPT 응답](6-4-checkin-gpt.md) | Day별 톤 + Day 7 양방향 분기 | 없음 |
| 🟢 P1-A | [6-5. 떠오름 빠른 진입점](6-5-intrusive-memory.md) | 30초 DBT distress tolerance | 009 |
| 🟢 P1-A | [6-6. 분석 D+7 게이트](6-6-time-gate.md) | 부드러운 만류 (CoolingOffWarningModal) | 없음 |
| 🟢 P1-A | [6-7. 진단 결과 시간성 명시](6-7-result-timing.md) | "이 수치는 D+N 시점의 너야" | 없음 |
| 🔴 P2 | [6-8. 시점별 장단점 분리](6-8-temporal-pros-cons.md) | 로시 회상 방지 + 시간 가중치 | 010 |
| 🔴 P2 | [6-9. 졸업 양방향성](6-9-graduation-farewell.md) | 사용자 한 줄 + AI 응답 (별도 라우트) | 012 |
| 🔵 P3 | [6-10. 추억 능동 정리](6-10-memory-organization.md) | 사진/메시지/장소 (출시 후 점진적) | 013 |
| 🟡 P1-B | [6-11. 자기 성찰 트랙](6-11-self-reflection.md) | 6개 카테고리 (자존감 회복) | 014 |

---

## 🛡️ Phase 7 — 기술 안정성 + 감정 안전장치

| 우선순위 | 항목 | 내용 | 마이그레이션 |
|---------|------|------|-------------|
| 🟢 P1-A | [7-1. 일기 임시 저장 (draft)](7-1-journal-draft.md) | AsyncStorage + Phase 5 통합 정책 | 없음 |
| 🔴 P2 | [7-2. 일기 미니 모드](7-2-mini-mode.md) | 감정 온도만 빠르게 + canGraduate 가중 | 011 |
| 🟢 P1-A | [7-3. 저장 실패 재시도 UI](7-3-error-retry.md) | ErrorToast + 재시도 버튼 | 없음 |
| 🔴 P0 | [7-4. 감정 안전장치 (위기 신호)](7-4-emotional-safety.md) | 3일 연속 저온 + 새벽 + 위기 핫라인 | 없음 |

---

## 🗺️ 의존성 그래프

```
6-1 (감정 라벨) ────┬───→ 7-1 (draft)
                   ├───→ 7-2 (미니 모드)
                   ├───→ 7-4 (위기 신호)
                   └───→ 6-2 (원망 축)
                          ↓
                          6-7 (시간성 명시)

6-0 (연애 기간) ───────────→ 6-11 (자기 성찰)
                              ↑
6-1 (자존감 라벨) ────────────┤
6-6 (CoolingOffModal) ───────┤
                              ↑
6-3 (Day 5/6) ─── source ────┘

6-3 (Day 1) ─── BreathingGuide ─── 6-5 (떠오름)
6-6 (만류 모달) ─── context prop ── 6-11 (자기 성찰)
6-4 (체크인 응답) ─── 별도 라우트 패턴 ── 6-9 (졸업 작별)
```

---

## 📊 통계

- 총 항목: **17개** (Phase 6: 12개, Phase 7: 4개, 메타: 3개 + README)
- 신규 마이그레이션: **10개** (006~015)
- 신규 테이블: **5개** (cooling_reflections, intrusive_memory_response, graduation_farewell, memory_organization, self_reflections)
- 신규 컴포넌트: 다수 (BreathingGuide, CoolingOffWarningModal, IntrusiveMemoryModal, EmotionalCheckModal, ReflectionCard, ReflectionDisplay, CoolingSourceReflections)
- 신규 Edge Functions: **2개** (cooling-checkin-response, graduation-farewell-response)

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

- [psychology-analysis.md](../psychology-analysis.md) — 심리학 분석 원본
- [user-flow.md](../user-flow.md) — 현재 앱 흐름
- [reason_project_v2.md](../reason_project_v2.md) — 전체 기획 원문
- [CLAUDE.md](../../CLAUDE.md) — 절대 규칙 + 컨벤션
- [VALIDATION-OPUS-V4(psychology).md](../../VALIDATION-OPUS-V4(psychology).md) — 최종 검증 보고서

---

*인덱스 작성: 2026-05-02 | 분리 기준: 한 작업당 하나의 파일 (100-450줄)*
