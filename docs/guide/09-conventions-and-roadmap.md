# Conventions And Roadmap

## 파일 네이밍
- 화면: PascalCase (`HomeScreen.tsx`)
- 컴포넌트: PascalCase (`InsightCard.tsx`)
- 훅: `use` prefix camelCase (`useSmartQuestion.ts`)
- API: camelCase (`journal.ts`)
- Edge Functions: kebab-case 폴더 (`ai-journal-response/`)

## 라우팅 구조 (Expo Router)

| 경로 | 역할 |
|---|---|
| `/(tabs)/index.tsx` | 홈: D+N 표시·일기 CTA·안전 모달 |
| `/(tabs)/records.tsx` | [기록] 탭: 일기 모아보기·추억·회복의 결 |
| `/(tabs)/me.tsx` | [나] 탭: 분석·관계·내 이야기·데이터 관리 |
| `/onboarding/*` | login → consent → duration → mood → persona → intro |
| `/journal/*` | 일기 4단계 + mini · raw-mode · today · history · unsent-letter · `[id]` |
| `/analysis/*` | 분석 5단계 (C-SSRS·페르소나 D+N 게이트 가드) |
| `/compass/*` | 나침반 5단계 (verdict 8종) |
| `/cooling/*` | 유예 대시보드 + 체크인 |
| `/graduation/*` | **현재 보류** — 모두 `/graduation-paused`로 리다이렉트 |
| `/about-me/*` | 자기 성찰 14 카테고리 |
| `/assessments/[instrument]` | PHQ-9 / GAD-7 / RSE 1문항 슬라이더 |
| `/safety/release` | C-SSRS 양성 잠금 해제 (24h + 4문항) |
| `/recovery-trace` | D+0 vs 현재 메타포 + 검사 시계열 |
| `/memory/*` | 추억 정리 (continuing-bonds·declutter·encounter-plan·reflect·seal·write) |
| `/resources/hotline` | 위기 자원 안내 |
| `/legal/[document]` | 약관·처리방침 |
| `/settings/data` | 데이터 반출·삭제·처리정지 토글 |

## 개발 단계 (Phase) — 진행 상황

| Phase | 내용 | 상태 |
|---|---|---|
| 0 | 인프라 / DB / 디자인 시스템 | ✅ 완료 |
| 1 | 온보딩 / 홈 / 일기 / Auth | ✅ 완료 |
| 2 | 질문 풀 / 관계 분석 / 나침반 | ✅ 완료 |
| 3 | GPT Edge Function / AI 응답 | ✅ 완료 |
| 4 | 졸업 / 유예 / 푸시 | ⏸ 졸업 트랙 보류 (유예·푸시는 완료) |
| 5 | 오프라인 / 에러 / 배포 | ✅ 기본 구현 완료, iOS bare workflow 적용 |
| 6 | 심리학 V1 (페르소나·검사·안전) | 🔄 진행 중 — `docs/psychology-tasks/` 참조 |
| 7 | 심리학 V2 (자가보고·메타뷰) | 🔄 진행 중 — `docs/psychology-tasks/` 참조 |

## 추가 기술 스택 (심리·안전)
- **심리 검사**: PHQ-9 (우울) · GAD-7 (불안) · RSE (자존감) — `psych_assessments` 테이블 (migration 030), 라이선스 정리: `docs/legal/scales-license.md`
- **C-SSRS**: 자살 위험 평가 → `crisis_assessments` + `safety_lockouts` (migration 020)
- **8축 페르소나 분류**: `psych_profile_axes` (migration 022), 매일 0시 `persona-reclassify-cron`이 axes 갱신
- **처리정지권 (PIPA §37)**: `users.notifications_suspended` · `ai_analysis_suspended` 토글 (migration 025)

## 비가역 원칙
- API 키 클라이언트 노출 금지
- 졸업 즉시 확정 금지 (7일 유예 필수)
- 방향 변화 비난 금지
- D+N 전역 표시 유지
- 페르소나 라벨 사용자 노출 금지

## 린팅·검증 명령어
- `npx tsc --noEmit` — TypeScript 검사 (CI 필수)
- `npm run lint:persona` — 페르소나 라벨 비노출 검사 (`scripts/check-persona-labels.js`)
  - 예외 경로: `app/resources/`, `app/legal/`, `app/onboarding/consent.tsx`
- `npx vitest` — 단위 테스트
