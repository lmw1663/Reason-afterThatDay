# VALIDATION-CHECKLIST.md — 최종 검증 체크리스트

> Opus 1차 + 2차 + 3차 검증 모두 반영
> **출처**: `TODO(psychology).md` 라인 3643-3727

---

## CLAUDE.md 절대 규칙 양립성 (P0)

- [x] 모든 GPT 호출이 `gpt-4.1-mini` 사용 (gpt-4o-mini 없음)
- [x] 신규 4개 테이블 (cooling_reflections, intrusive_memory_response, graduation_farewell, memory_organization) 모두 RLS ENABLE + user_id 정책
- [x] 6-4, 6-9에 GPT fallback + 5초 타임아웃 명시
- [x] 6-4, 6-9 모두 채팅 UI 회피 (별도 라우트 + DB 조회 패턴 통일)
- [x] 위기 핫라인 정보 사실 검증 (보건복지부 출처) + JSON 파일 분리
- [x] 메시지 톤 반말 일관성 (Day 1~6 모두 + Phase 7 모두)
- [x] 7-4 P0 상향 (생명 안전)

---

## 각 항목이 psychology-analysis.md 의도를 충실히 반영했는가?

- [x] 6-0 (신규): 온보딩 연애 기간 추가 (4단계 범위형 + skip) + 5곳 활용 지점
- [x] 6-1: 감정 라벨 12개 (원본 §2 7가지 핵심 모두 커버, 자존감/자유로움/충격 포함) + 신체 신호 4가지 + freeText 위치 명시 + 6-11 hook
- [x] 6-2: 4가지 임상 상태 구분 + verdict 결합 알고리즘 명세 + 회복 진행 신호 메시지 + UI/UX 반말
- [x] 6-3: Day 1~6 모든 화면 반말 + Day 2 듀얼 카드 (시작+결심) + Day 5/6 → 6-11 자동 누적
- [x] 6-4: "결정을 흔들지 않는" 톤 + Day 7 양방향 분기 + 별도 라우트 + GPT 프롬프트에 반말 명시
- [x] 6-5: 약 30초 DBT distress tolerance 플로우 + BreathingGuide quick 모드
- [x] 6-6: D+0~7 부드러운 만류 (반말, 강제 차단 X) + Day별 메시지 차이
- [x] 6-7: "이 수치는 D+N 시점의 너야. ~ 거야" 일관된 반말 + verdictMessages 5개 모두 반말
- [x] 6-8: 시간별 게이트(D+14, D+30) + 모든 메시지 반말
- [x] 6-9: 사용자 한 줄 입력 + AI 응답 별도 라우트 + DB 조회 패턴 (params 노출 X) + 톤 가이드 반말 + 6-11 안내 hook
- [x] 6-10 (P3): 추억의 능동적 정리 트랙 (사진/메시지/장소)
- [x] 6-11 (신규 P1-A): 자기 성찰 트랙 — 6개 카테고리 + D+8 게이트 + 자유 답변 + 변경 이력 보관 + 5곳 hook 연계
- [x] 7-1: AsyncStorage draft 복구 UX + Phase 5 큐와의 통합 정책 + 모달 반말
- [x] 7-2: mini journal canGraduate 2배 가중 + 6-1 라벨 선택사항 통합 + 옵션 모달 반말
- [x] 7-3: 재시도 버튼 있는 ErrorToast (3개 화면 적용) + 메시지 반말
- [x] 7-4: 3일 연속 저온 + 새벽 감지 + 익명 통계(50명 미만 가드) + 검증된 핫라인 정보 + 3일 침묵 로직

---

## 구조적 결함 (P2) 확인

- [x] 우선순위 라벨 단일 시스템 (P0/P1-A/P1-B/P2/P3)
- [x] 마이그레이션 번호 006~015 명시 + 의존성 표
- [x] BreathingGuide 단일 컴포넌트 (pattern props 분기)
- [x] freeText 행방 명확 (1.7단계, 기존 위치 유지)
- [x] 미니 모드 + 라벨 결정 (라벨은 선택사항으로 유지)

---

## Opus 2차 검증 결함 해결

- [x] V2-1: 6-3 Day 3~6 톤 일괄 반말 변환 (11곳 수정)
- [x] V2-2: 6-6 Day별 게이트 메시지 + 모달 반말
- [x] V2-3: 6-7 timingNotice "너야 + 거야" 일관성 + verdictMessages 반말
- [x] V2-4: 6-8/6-9 톤 가이드, 6-2 UI/UX 반말
- [x] V2-5: 7-2/7-3/7-4 반말 (핫라인 화면만 존댓말 예외)
- [x] V2-6: 6-4 JSX 문법 오류 수정 (View로 감쌈) + 별도 라우트로 분리
- [x] V2-7: 6-9 router params → DB 조회 패턴 (보안)
- [x] V2-8: 7-4 반복 트리거 방지 (3일 침묵) + 익명 통계 50명 미만 가드 + checkLateNightAccess 정리

---

## Opus 3차 검증 결함 해결

- [x] **C-1 (CRITICAL)**: 마이그레이션 번호 +1 시프트 (005~014 → 006~015) — 005가 이미 question_pool_additions에 사용 중
- [x] **C-2 (CRITICAL)**: 실제 DB 컬럼명 적용 — `temperature` → `mood_score`, `emotion_labels` → 기존 `mood_label TEXT[]` 활용 (이중 컬럼 방지), 모든 SQL의 `auth.users(id)` → `public.users(id)`
- [x] V3-3: CoolingOffWarningModal에 `context: "analysis" | "self_reflection"` prop 추가 (6-6/6-11 공유)
- [x] V3-4: `/onboarding/mood` "Step 3/3" 표기 변경 명시
- [x] V3-5: `mergeOrCreateReflection` prefix 누적 → `source` 컬럼 방식으로 데이터 구조 개선
- [x] V3-6: `relationship_duration_months` 필드 제거 (데드 필드)
- [x] V3-7: 6-1 자존감 흔들림 hook에 D+8 가드 추가 (self-defeating UX 회피)
- [x] V3-8: P1-A 8개 → 6개로 축소, 6-0/6-11/6-2/6-3/6-4를 P1-B로 재분류
- [x] V3-9: ReflectionCard, ReflectionDisplay, CoolingSourceReflections 컴포넌트 신규 작성 명시
- [x] V3-10: 슬라이더 minimumValue/maximumValue/step 명시 + 초기값 복구 로직
- [x] V3-11: `fetchCurrent` 함수 본문 정의 (source='manual' 필터)
- [x] V3-12: useUserStore에 `relationshipDuration` 추가 사양 명시 + Zustand persist
- [x] V3-13: 자기애 점수 변화 시각화 알고리즘 (`getProgressMessage`)
- [x] V3-14: 카테고리 6 노출 위치 = `/(tabs)/graduation` confirmed 분기
- [x] V3-15: STRENGTH_LABELS 한글 키 + 한국어 전용 단계 명시
- [x] V3-16: D+8 기준점 = `breakup_date` 명시 (CLAUDE.md 규칙)
- [x] V3-17: Day 5/6 hook 트랜잭션 처리 (Postgres RPC 또는 클라이언트 순차)

---

## 톤 일관성 잔존 검증

`grep "당신"` 결과 5건 모두 의도된 사용:
- 정책 자체에서 금지 패턴 명시
- GPT 시스템 프롬프트 메타 명령 ("당신은 응답자다")
- GPT에게 반말 사용 강제 명시 ("'당신' 사용 금지")

`grep "거예요\|이에요\|예요\|어요\|네요"` 결과 모두 의도된 사용:
- 정책 금지 패턴 명시
- psychology-analysis 원본 인용
- 핫라인 안내 화면의 존댓말 예외

---

## 🔄 변경 시 동기화 체크 (분리 문서 시스템 — Drift 방지)

**언제 사용하나**: 항목 파일을 *수정* 또는 *추가*할 때마다 작업 후 실행.

분리된 19개 파일 시스템에서 한 곳을 변경하면 다른 곳도 같이 갱신해야 일관성 유지.
아래 체크리스트로 누락 없이 확인.

### A. 의존성 있는 항목 동기화 (가장 자주 발생)

변경한 항목이 다른 항목에 영향을 주는가? `README.md`의 의존성 그래프로 확인:

- [ ] **6-1 (감정 라벨)** 변경 시 → 7-1 (draft 인터페이스), 7-2 (미니 모드), 6-1 hook (6-11) 영향 검토
- [ ] **6-2 (affection_level)** 변경 시 → 6-7 verdictMessages, 7-1 draft 영향
- [ ] **6-3 Day 5/6** 변경 시 → 6-11 source 처리 (cooling_day5/6) 영향
- [ ] **6-0 (연애 기간)** 변경 시 → 6-11 카테고리 1/5, 6-3 Day 4, 6-9 GPT 프롬프트 영향
- [ ] **6-6 / 6-11 (CoolingOffWarningModal)** 변경 시 → `_shared-components.md` §2도 갱신
- [ ] **6-3 Day 1 / 6-5 (BreathingGuide)** 변경 시 → `_shared-components.md` §1도 갱신

### B. 공유 컴포넌트 일관성 (`_shared-components.md`)

- [ ] 변경한 사양이 `_shared-components.md`의 명세와 일치
- [ ] 항목 파일이 컴포넌트 props/타입을 *직접* 정의하지 않음 (`_shared-components.md` 참조만)
- [ ] 사용 예시가 사양과 일치
- [ ] 변경된 props 타입이 모든 사용처에서 호환

### C. 마이그레이션 번호 일람표 동기화

- [ ] 신규 마이그레이션 번호 부여 전 `00-overview.md` 일람표 확인
- [ ] `ls supabase/migrations/`로 충돌 검증 (이미 사용 중인 번호 X)
- [ ] 번호 부여 후 `00-overview.md` 일람표에 추가
- [ ] 해당 항목 파일 헤더 `**마이그레이션**: NNN`도 갱신

### D. 우선순위 단일 권위 (`PRIORITY.md`)

- [ ] 우선순위 변경 시 `PRIORITY.md`에서 *먼저* 수정
- [ ] 그 다음 항목 파일 헤더의 라벨(🟢 P1-A 등) 갱신
- [ ] 메인 `TODO(psychology).md` 인덱스 표의 우선순위 컬럼도 동기화
- [ ] `README.md`의 우선순위 표시도 동기화

### E. hook 양방향 참조

- [ ] 새 hook 추가 시 *양쪽* 항목 파일 모두 갱신
  - 예: 6-1에 "자존감 흔들림 → 6-11" hook 추가 → 6-11에도 "hook 입력" 섹션에 명시
- [ ] hook 제거 시도 양쪽 모두 제거
- [ ] hook 사양 변경 (예: D+8 가드) 시 양쪽 모두 일치

### F. 외부 문서 참조

- [ ] 항목 번호/파일 경로 변경 시 다음 문서들 검색 후 갱신:
  - `CLAUDE.md`
  - `docs/psychology-analysis.md`
  - `docs/research.md`
  - `docs/user-flow.md`
- [ ] 검색 명령: `grep -r "6-N\|psychology-tasks/" docs/ CLAUDE.md`
- [ ] 라인 번호 참조 X — 항목 번호(6-1) 또는 파일 경로로 참조

### G. 새 항목 추가 시 인덱스 4곳 갱신

신규 항목 (예: 6-12) 추가 시 다음 4개 파일 모두 갱신:
- [ ] `TODO(psychology).md` (메인 인덱스 표)
- [ ] `docs/psychology-tasks/README.md` (Phase 6 또는 7 표)
- [ ] `docs/psychology-tasks/PRIORITY.md` (해당 우선순위 섹션)
- [ ] `docs/psychology-tasks/00-overview.md` (마이그레이션 일람 — 새 마이그레이션이 있다면)

### H. 톤 정책 위반 회귀 (Regression)

작업한 항목 파일에서 다음 grep으로 회귀 확인:
- [ ] `grep -n "당신" 새파일.md` → 의도된 사용만 (정책 명시, GPT 메타 명령)
- [ ] `grep -n "거예요\|이에요\|예요\|어요\|네요" 새파일.md` → 의도된 예외만 (핫라인, 정책 금지 패턴 명시)
- [ ] "너야 + 거예요" 한 문장 안 혼용 X

### I. CLAUDE.md 절대 규칙 회귀

- [ ] 신규 GPT 호출 → `gpt-4.1-mini` 모델 사용
- [ ] 신규 Edge Function → 5초 타임아웃 + fallback 명시
- [ ] 신규 테이블 → RLS ENABLE + user_id 정책
- [ ] 신규 화면 → "당신" 미사용, 단정/강요/비난 없음
- [ ] 사용자 입력 + AI 응답이 한 화면에 동시 노출 X (채팅 UI 회피)

---

## 빠른 검증 명령어

```bash
# 톤 회귀 검증
grep -rn "당신" docs/psychology-tasks/ | grep -v "정책\|금지\|GPT\|시스템 프롬프트"

# 공유 컴포넌트 사양 분기 검증 (BreathingGuide의 inhale 값이 일관되는지)
grep -rn "inhale:" docs/psychology-tasks/

# 마이그레이션 번호 충돌 검증
ls supabase/migrations/ | sort
grep -E "마이그레이션 0[0-9]{2}" docs/psychology-tasks/*.md | sort

# GPT 모델명 일관성
grep -rn "gpt-4o-mini\|gpt-3.5\|gpt-4-" docs/psychology-tasks/  # 결과 0건이어야 함
grep -rn "gpt-4.1-mini" docs/psychology-tasks/                  # 모든 GPT 호출

# RLS 정책 누락 검증 (모든 신규 테이블에 ENABLE 있는지)
grep -B5 "ENABLE ROW LEVEL SECURITY" docs/psychology-tasks/*.md
```

---

*마지막 검증: 2026-05-02 | Opus 1차+2차+3차 검증 모두 반영 + 분리 문서 시스템 동기화 체크 추가*
*문서 출처: psychology-analysis.md + VALIDATION-OPUS(psychology).md ~ V4*

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🎯 [PRIORITY.md](PRIORITY.md) — 우선순위 정렬
