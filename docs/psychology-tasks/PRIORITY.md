# PRIORITY.md — Phase 6-7 구현 우선순위

> **단일 라벨 시스템**
> psychology-analysis.md §9 + Opus 검증 결과 반영
> **출처**: `TODO(psychology).md` 라인 3549-3641

---

## P0 (생명 안전 — 코드 작성 전 필수)

```
□ 7-4. 감정 안전장치 (위기 신호 감지)
       이유: 자살 위험 스크리닝 — psychology-analysis §10에서 "절대 규칙급" 명시
       선행 작업:
         - CLAUDE.md에 새 절대 규칙 추가 (위기 신호 감지)
         - 위기 핫라인 정보 사실 검증 (보건복지부 출처)
         - resources/crisis-hotlines.json 별도 관리
       의존성: 6-1 (감정 온도 데이터 누적이 필요)
```

📄 [7-4-emotional-safety.md](7-4-emotional-safety.md)

---

## P1-A (가장 효과 높음 — 작은 비용/큰 효과 + 의존성 없음)

```
□ 6-1. 일기 감정 입력 다층화 (감정 라벨 12개 + 신체 신호)
       이유: 애도 5단계 정상화 — 이것 없이는 다른 모든 개선이 반쪽
       의존성: 없음 (기존 mood_label 활용)

□ 6-5. 떠오름 빠른 진입점 (🫧 갑자기 떠올랐어)
       이유: 가장 자주 호소되는 상황
       의존성: 없음

□ 6-6. 분석 D+7 게이트 (부드러운 만류)
       이유: 반추 방지 — 조기 분석이 회복 지연
       의존성: 없음 (CoolingOffWarningModal 신규 작성)

□ 6-7. 진단 결과 시간성 명시
       이유: 고정 마인드셋 방지 — 한 줄 메시지로 큰 효과
       의존성: 없음

□ 7-1. 일기 임시 저장 (draft)
       이유: 재방문 의지 보호
       의존성: 6-1 (mood_label, physical_signals 필드 사용)

□ 7-3. 저장 실패 시 재시도 UI
       이유: 의식적 행위 확인
       의존성: 없음
```

📄 [6-1-emotion-layers.md](6-1-emotion-layers.md) · [6-5-intrusive-memory.md](6-5-intrusive-memory.md) · [6-6-time-gate.md](6-6-time-gate.md) · [6-7-result-timing.md](6-7-result-timing.md) · [7-1-journal-draft.md](7-1-journal-draft.md) · [7-3-error-retry.md](7-3-error-retry.md)

---

## P1-B (필수 — 의존성 있음, 큰 효과)

```
□ 6-0. 온보딩 확장: 연애 기간 질문
       이유: 6-11 맥락화 + 메시지 톤 분기 데이터 제공
       선행: 없음 (먼저 구현해도 OK)
       후행 의존: 6-11이 6-0 데이터 활용

□ 6-2. 수평축 추가 (원망↔애정)
       이유: 집착/건강한 수용 구분 — 나침반 정확도 상향
       의존성: 6-1 (mood_label과 함께 입력)

□ 6-3. Day별 유예 콘텐츠 (Day 1~6 회복 작업)
       이유: 가장 취약한 7일을 회복으로 — psychology-analysis Top 2
       의존성: 6-1 (mood_score 차트), 6-6 (CoolingOffWarningModal 공유)

□ 6-4. 체크인 GPT 응답
       이유: 일방향 입력 해결
       의존성: 6-3 Day 7 분기와 일관성

□ 6-11. 자기 성찰 트랙 "나에 대해" (자존감 회복)
       이유: 6-1 "자존감 흔들림" 라벨의 처치 부재 모순 해소
       의존성: 6-0 (연애 기간 맥락화), 6-1 (자존감 라벨), 6-6 (만류 모달)
```

📄 [6-0-onboarding-duration.md](6-0-onboarding-duration.md) · [6-2-affection-axis.md](6-2-affection-axis.md) · [6-3-cooling-day-content.md](6-3-cooling-day-content.md) · [6-4-checkin-gpt.md](6-4-checkin-gpt.md) · [6-11-self-reflection.md](6-11-self-reflection.md)

---

## P2 (중간 — 큰 비용 또는 일회성 효과)

```
□ 6-8. 시점별 장단점 분리
       이유: 로시 회상(rosy retrospection) 방지 — 기술 복잡도 높음

□ 6-9. 졸업 양방향성 (사용자 작별 한 줄)
       이유: 의미 부여 능동성 — 심리학 효과 높으나 일회성

□ 7-2. 미니 모드 (감정 온도만)
       이유: 진입 장벽 ↓ — 무기력 단계 재방문 의지
```

📄 [6-8-temporal-pros-cons.md](6-8-temporal-pros-cons.md) · [6-9-graduation-farewell.md](6-9-graduation-farewell.md) · [7-2-mini-mode.md](7-2-mini-mode.md)

---

## P3 (보강 — 출시 후 점진적 추가)

```
□ 6-10. 추억 능동적 정리 트랙 (사진/메시지/장소)
       이유: psychology-analysis §7 미커버 영역 — 통제감 회복

□ 회복 진행 신호 메시지 (시간 비교)
       이유: psychology-analysis §3 미세 효과 — "어제보다 줄었어요"
       (6-2 안에 포함됨 — generateProgressMessage 함수)
```

📄 [6-10-memory-organization.md](6-10-memory-organization.md)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- ✅ [VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md) — 최종 검증 체크리스트
