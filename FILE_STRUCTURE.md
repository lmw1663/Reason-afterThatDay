# Reason · 파일 구조 인덱스

> 프로젝트 전체 폴더·파일을 한 줄씩 요약한 인덱스. 신규 진입자나 LLM 컨텍스트 절약용으로 사용.
> 작성 기준일: 2026-05-06 / Branch: `main`

---

## / (root)

- `README.md` — 이별 회복 앱 Reason의 프로젝트 개요.
- `CLAUDE.md` — 절대 규칙·아키텍처·컨벤션을 정리한 Claude Code 작업 인덱스.
- `TODO.md` — 2026-05-04 기준 A~E 페이즈 통합 로드맵 및 진행 현황.
- `TODO(psychology).md` — Phase 6-7 심리학 기반 구현 항목 인덱스 및 우선순위.
- `VALIDATION(psychology).md` — psychology-analysis와 TODO(psychology)의 1차 동기화 검증 (98%).
- `VALIDATION-OPUS(psychology).md` — Opus 1차 재검증 (78%, 11개 결함).
- `VALIDATION-OPUS-V2(psychology).md` — Opus 2차 재검증 (92%, 8개 신규 결함).
- `VALIDATION-OPUS-V3(psychology).md` — 6-0/6-11 추가 후 3차 검증 (70%, Critical 2건).
- `VALIDATION-OPUS-V4(psychology).md` — P0~P3 수정 후 4차 최종 검증 (94%).
- `LICENSE` — Apache License 2.0 본문.
- `package.json` — Expo React Native 의존성 및 npm 스크립트.
- `app.json` — Expo 앱 설정 (이름·버전·플랫폼·OAuth 프로바이더).
- `tsconfig.json` — TypeScript 컴파일러 옵션 (Expo 베이스 확장).
- `babel.config.js` — Babel 트랜스파일 설정 (NativeWind JSX 지원).
- `metro.config.js` — Metro 번들러 설정 (NativeWind 통합).
- `tailwind.config.js` — Tailwind CSS 토큰 (커스텀 컬러 + NativeWind).
- `.eslintrc.js` — ESLint 규칙 (React Native 플러그인).
- `vitest.config.ts` — Vitest 단위 테스트 설정.
- `expo-env.d.ts` — Expo 환경 타입 정의.
- `nativewind-env.d.ts` — NativeWind 타입 정의.
- `global.css` — 전역 Tailwind CSS 스타일.
- `skills-lock.json` — Claude 스킬 잠금 설정.

---

## api/

- `ai.ts` — AI 응답 (일기·일일 명언·위로·체크인·졸업 편지)을 Edge Function 프록시로 호출, 일시정지 게이트·페르소나 자동 첨부·폴백.
- `assessments.ts` — PHQ-9·GAD-7·RSE 응답 저장·채점·회복 추적 시계열 조회 (`psych_assessments`).
- `auth.ts` — OAuth (Google/Apple/Kakao) PKCE/암시적 콜백 처리·익명 세션 유지.
- `consent.ts` — 필수 약관 버전 저장·조회·최신화 검증 (`users.consent_versions`).
- `contactUrges.ts` — 연락 충동 1탭 보고·7일 추세 (`contact_urges`).
- `coolingReflections.ts` — 유예 Day 5/6 학습·미래 계획 저장 + 가장 초기 일기 조회.
- `graduation.ts` — 졸업 신청·유예 상태·7일 연장·체크인 누적·확정 (`graduation_cooling`).
- `intrusiveMemory.ts` — 떠올림 기록·이전·현재 7일 추세 비교 (`intrusive_memory_response`).
- `journal.ts` — 일기 작성 (오늘 1회 upsert)·최근 조회·raw-mode 일 2회 제한 (`journal_entries`, KST 기준).
- `memoryLog.ts` — 추억 메모 저장·조회·삭제 (`memory_log`, photo/message/place/other).
- `persona.ts` — 8축 프로파일 저장·페르소나 분류·D+N 재분류 (`personas`/`psych_profile_axes`).
- `processingSuspension.ts` — 알림·AI 분석 처리정지 토글 (PIPA §37).
- `questions.ts` — 활성 질문 풀 서버 조회 (폴백: 번들)·응답 저장·표시 마킹 (`question_pool`/`question_responses`).
- `referrals.ts` — 외부 의뢰 임계 평가 (14/30일 윈도우 위기·결정 변동·검사 점수·페르소나 스냅샷).
- `relationship.ts` — 관계 프로필 저장·조회 (이유·장단점·날짜별 추이, `relationship_profile`).
- `safety.ts` — C-SSRS 위기 평가·심각도 산출·자동 잠금·24시간 추적 (`crisis_assessments`/`safety_lockouts`).
- `selfReflections.ts` — about-me 자기 성찰 14 카테고리 저장·조회 (`is_current` 토글).
- `supabase.ts` — Supabase 클라이언트 초기화 (AsyncStorage 세션 지속·토큰 갱신).
- `telemetry.ts` — 이벤트 기록·옵트인 상태·민감 정보 화이트리스트 필터링.
- `userData.ts` — 데이터 카운트 요약·JSON 반출·완전 삭제 (PIPA §35/36, 17개 테이블).

### api/__tests__/

- `assessments.test.ts` — PHQ-9/GAD-7/RSE 자동 채점·시계열 분리·null 행 제외 검증.
- `contactUrges.test.ts` — 충동 보고·7일 추세 (오늘 포함, 0-카운트 처리)·오늘 카운트.
- `journalRawMode.test.ts` — raw-mode 오늘 카운트 (KST 자정~23:59, 개수 제한).
- `processingSuspension.test.ts` — 처리정지 조회·부분 업데이트·empty patch 조기 반환·RLS 실패.
- `telemetry.test.ts` — 옵트인·이벤트 기록·allowlist 필터링·민감 정보 제거·silent fail.

---

## app/ (Expo Router 화면)

### app/ (root)

- `_layout.tsx` — 앱 부트스트랩 (인증·오프라인 동기화 등 초기화) 및 라우터 설정.
- `index.tsx` — 첫 진입 라우터 (미동의/미온보딩/완료 상태 기반 리다이렉트).
- `graduation-paused.tsx` — 졸업 기능 보류 안내 화면.

### app/(tabs)/

- `_layout.tsx` — 하단 3탭 레이아웃 (오늘/기록/나).
- `index.tsx` — 홈: D+N 표시·오늘의 한마디·일기 CTA·안전 감지 모달.
- `analysis.tsx` — 분석 탭 진입 가드 (→ [나]로 리다이렉트).
- `compass.tsx` — 나침반 탭 진입 가드 (→ [나]로 리다이렉트).
- `graduation.tsx` — 졸업 탭 진입 가드 (→ 졸업-보류 안내).
- `me.tsx` — [나] 탭: 내 이야기·관계분석·오늘의 방향·데이터 관리.
- `records.tsx` — [기록] 탭: 일기 모아보기·추억·회복의 결.

### app/about-me/

- `index.tsx` — 자기 이야기 카테고리 선택 (권장 카드 + 4개 노출 + 전체 보기).
- `[category].tsx` — 카테고리별 자기 성찰 답변 (점수·라벨·텍스트).

### app/analysis/

- `_layout.tsx` — 분석 트랙 진입 가드 (C-SSRS 잠금 + 페르소나 차단).
- `reasons.tsx` — 분석 1/5: 이별 이유 선택 + 풀 질문 응답.
- `pros-cons.tsx` — 분석 2/5: 상대의 장단점 입력 (탭 전환).
- `role-partner.tsx` — 분석 3/5: 마음속 두 목소리 (잡기 vs 보내기).
- `stay-leave.tsx` — 분석 4/5: 3가지 슬라이더 점수 매기기.
- `result.tsx` — 분석 5/5: 재연결/극복/회복도 진단 결과 저장.

### app/assessments/

- `[instrument].tsx` — PHQ9/GAD7/RSE 1문항씩 슬라이더 응답 (C-SSRS 자동 escalate).

### app/compass/

- `_layout.tsx` — 나침반 진입 가드 (C-SSRS 잠금 + 페르소나 D+N 게이트).
- `index.tsx` — 나침반 요약: D+N·최근 7일 방향·평균 온도·이전 결과.
- `want.tsx` — 나침반 1/5: 방향 선택 + 애정 수준 슬라이더 (4가지 임상 상태).
- `check.tsx` — 나침반 2/5: 5개 이성적 체크 질문 (yes/no).
- `scenario.tsx` — 나침반 3/5: 3개 시나리오 선택 (catch/let_go/neutral).
- `needle.tsx` — 나침반 4/5: 나침반 시각화 + 7가지 verdict 표시.
- `action.tsx` — 나침반 5/5: 결과별 행동 제안 + 주의사항.

### app/cooling/

- `_layout.tsx` — 유예 기간 화면 레이아웃.
- `index.tsx` — 유예 대시보드: Day별 콘텐츠·타이머·체크인 기록·취소.
- `checkin.tsx` — 자율 체크인: 현재 마음 입력 + AI 응답.
- `final.tsx` — 졸업 트랙 보류로 [졸업-보류]로 리다이렉트.
- `checkin/response.tsx` — 체크인 완료 후 AI 응답 카드 표시.

### app/graduation/

- `_layout.tsx` — 졸업 트랙 보류로 모든 route를 [졸업-보류]로 리다이렉트.
- `report.tsx` — 졸업 1/5: D+N별 회복 리포트 (일기 수·평균 온도·방향 변화).
- `letter.tsx` — 졸업 2/5: 일기·분석·체크인 데이터 기반 AI 편지 (로딩).
- `confirm.tsx` — 졸업 3/5: 아쉬웠던 기억 + 준비 상태 확인.
- `farewell.tsx` — 졸업 4/5: 상대 또는 과거 자신에게 마지막 한 줄 작성.
- `ritual.tsx` — 졸업 4/5: 기억 보관 방식 선택 (편지/추억/놓아주기/시간).
- `request.tsx` — 졸업 5/5: 7일 유예 신청 확인 및 주의사항.
- `farewell/response.tsx` — 졸업 4/5: 사용자 작별 한 줄에 대한 AI 응답.

### app/journal/

- `_layout.tsx` — 일기 흐름 레이아웃 (slide_from_right).
- `index.tsx` — 일기 1/4: 감정 온도(필수) + 라벨 + 신체 신호 선택.
- `direction.tsx` — 일기 2/4: 방향 선택(잡고/보내고/모르겠어) + 애정 수준.
- `question.tsx` — 일기 3/4: 스마트 질문 + 답변 입력.
- `response.tsx` — 일기 4/4: AI 응답 스트리밍 + 저장.
- `mini.tsx` — 일기 미니 모드: 감정 온도만 빠르게 기록.
- `today.tsx` — 오늘 일기 수정 (모든 필드 + AI 응답 읽기 전용).
- `history.tsx` — 일기 목록 모아보기 (최근순, 날짜·온도·방향·메모).
- `raw-mode.tsx` — 분노 모드 2단계: venting + 분노 아래 2차 감정 (P10).
- `unsent-letter.tsx` — 부치지 않을 편지: 24시간 잠금 후 읽기 가능.
- `[id].tsx` — 일기 상세 보기 (읽기 전용).

### app/legal/

- `[document].tsx` — 약관/처리방침 등 법률 문서 읽기 화면.

### app/memories/

- `index.tsx` — 추억 기록 허브 (입력 + 카테고리 필터 + 페르소나 권장 트랙).

### app/memory/

- `_layout.tsx` — 추억 돌아보기 흐름 레이아웃.
- `index.tsx` — 추억 카테고리 선택 (행복/그리움/아픔/성장, 게이트 + 미화 차단).
- `write.tsx` — 기억 꺼내기: 기억 입력 + 감정 추가.
- `continuing-bonds.tsx` — 사별 후 지속적 유대 (continuing bonds) 기반 기억 의식.
- `declutter.tsx` — 추억 능동 정리 (사진/메시지/장소 체크리스트).
- `encounter-plan.tsx` — 우연한 마주침 대비 사전 계획 시뮬레이션.
- `reflect.tsx` — 추억에 대한 반추 후 의미 재구성.
- `seal.tsx` — 추억 봉인 의식 (놓아주기 단계).

### app/onboarding/

- `index.tsx` — 온보딩 초기 라우터 (상태 기반 리다이렉트).
- `login.tsx` — 로그인 (카카오/Apple/Google OAuth).
- `consent.tsx` — 약관 동의 (필수 3개 + 위기 상담 안내).
- `duration.tsx` — 온보딩 2/3: 관계 기간 선택 (5가지 범위).
- `mood.tsx` — 온보딩 3/3: 현재 기분 선택 (12가지 라벨).

### app/onboarding/persona/

- `_layout.tsx` — 페르소나 온보딩 레이아웃.
- `index.tsx` — 페르소나 온보딩: Q1~Q6 + C-SSRS 3항 (단계별, 4단계부터 피로 옵션).
- `intro.tsx` — 페르소나 사전 안내 카드 (baseline 제외 1회 노출).

### app/recovery-trace/

- `index.tsx` — 회복의 결: D+0 vs 현재 메타포 + PHQ9/GAD7/RSE 시계열 그래프.

### app/resources/

- `hotline.tsx` — 위기 자원 및 핫라인 (비밀·무료 강조, 통화/온라인 선택).

### app/safety/

- `release.tsx` — 안전 잠금 해제: 4문항 안전 확인 + 24시간 경과 조건.

### app/settings/

- `_layout.tsx` — 설정 화면 레이아웃.
- `data.tsx` — 데이터 관리: 반출(JSON)·계정 삭제·처리정지 토글.

---

## components/

### components/ (top)

- `AssessmentRecommendationCard.tsx` — D+7/14/30에 PHQ-9/GAD-7/RSE 권유 카드 (24시간 차단).
- `BreathingGuide.tsx` — 진정/깊음 호흡 패턴 시간 타이머 유도.
- `ContactUrgeChip.tsx` — 연락 충동 1탭 기록 + 7일 추세 막대.
- `CoolingOffWarningModal.tsx` — D-1~7 분석/자기반성 진입 시 감정 변동 경고.
- `EmotionalCheckModal.tsx` — 연속 저기분/새벽 진입 시 6항 C-SSRS 평가 + 자원 안내.
- `IntrusiveMemoryModal.tsx` — 침투사고 발생 시 호흡→기록→기분 4단계 외현화.
- `PersonaPriorityCard.tsx` — 페르소나별 우선 액션 카드 (24시간 dismiss).

### components/layout/

- `ScreenWrapper.tsx` — 안전영역·fade-in·키보드 회피 통합 화면 컨테이너.
- `StepLabel.tsx` — "N / Total" 진행 + 라벨 표지판.

### components/ui/

- `AssessmentSlider.tsx` — PHQ/GAD/RSE용 4점 리커트 카드 라디오 그룹.
- `BackHeader.tsx` — 흐름 중간 화면의 뒤로가기 헤더 (router.back).
- `Card.tsx` — 기본/강조/경고/미묘 4가지 변형 카드.
- `ChangeIndicator.tsx` — 어제→오늘 방향(잡고/보내고/모르겠고) 변화 표시.
- `ChoiceButton.tsx` — 아이콘·부설명·체크마크 선택 버튼.
- `CoolingTimer.tsx` — D-N 카운트다운 + "오늘이야" 메시지.
- `DirectionPicker.tsx` — 3가지 방향 옵션 ChoiceButton 배치.
- `ErrorToast.tsx` — 하단 토스트 + 재시도 버튼.
- `Icon.tsx` — Lucide 기반 22개 명명 아이콘 시스템.
- `Input.tsx` — 라벨/오류/도움말 슬롯 폼 입력.
- `InsightCard.tsx` — 좌측 accent border + tag/title/body 통찰 카드.
- `LoadingOverlay.tsx` — 반투명 전체화면 로딩 표시기.
- `MeterBar.tsx` — 0~1 누적 프로그레스 바 (낮음/중간/높음).
- `Modal.tsx` — 제목/설명/primary/secondary + dismissable 모달.
- `MoodChart.tsx` — react-native-chart-kit 7일 기분 추이 선형 차트.
- `MoodSlider.tsx` — 1~10 감정 온도 슬라이더 (색상 그래디언트).
- `Pill.tsx` — 동그란 태그 버튼 (색상/선택 상태).
- `PrimaryButton.tsx` — primary/ghost 변형 + 로딩·비활성.
- `ProgressDots.tsx` — 다단계 도트 시퀀스 진행 표시.
- `Typography.tsx` — Display/Heading/Body/Caption 4단계 텍스트 위계.

---

## hooks/

- `useAuth.ts` — Supabase 익명 가입 자동 + 세션 변경 감시 + 프로필 로드.
- `useDecisionLockGuard.ts` — 분석/나침반 진입 시 `decision_locked` 검증·`/safety/release` 우회.
- `useEmotionalSafety.ts` — 연속 저기분(3일 ≤2점) + 새벽(00~04시) 감지·3일 침묵 윈도우.
- `useErrorHandler.ts` — 코드별 사용자친화 메시지 매핑·표시/숨김 상태.
- `useExperiment.ts` — userId 결정론적 hashing A/B 변형 할당.
- `useJournalDraft.ts` — AsyncStorage 일기 진행 저장·7일 TTL 자동 정리.
- `useOfflineSync.ts` — 포그라운드 진입 시 오프라인 큐 flush.
- `usePersonaReclassify.ts` — 8축 변화 감지·로그만·재분류는 수동 진입 시.
- `usePushNotifications.ts` — 푸시 토큰 등록 + 불안형(P03) 새벽 푸시 차단.
- `useQuestionPool.ts` — 앱 루트에서 질문 풀·응답 목록 로드.
- `useScreenView.ts` — 화면 마운트 시 `screen_view` 1회 기록.
- `useSmartQuestion.ts` — 방향 변화 우선 감지·페르소나별 차단·부스터 적용.
- `useStreamingAI.ts` — 일기 응답 스트리밍 글자 효과 + 폴백 일반 호출.
- `useUnsentLetter.ts` — AsyncStorage 24시간 잠금 편지함·30일 자동 정리.

---

## store/ (Zustand)

- `useUserStore.ts` — userId·이별날짜·D+N·동의·푸시토큰·관계기간.
- `useJournalStore.ts` — 오늘 일기·최근 리스트·7일 기분·방향 히스토리 통계.
- `useQuestionStore.ts` — 전체 질문 풀·답변·노출 상태(질문ID별).
- `useRelationshipStore.ts` — 관계 분석 이유/장단점/고정도·외도·역할·시간대 박스.
- `useDecisionStore.ts` — 나침반 판정(7종) 히스토리·최신값.
- `useCoolingStore.ts` — 유예 id/status/타이머/체크인/푸시 카운트.
- `usePersonaStore.ts` — 분류된 주/부 페르소나·추정 시각·라벨 비노출 강제.

---

## utils/

- `assessmentTrigger.ts` — D+7/14/30 윈도우·마지막 응답 컷오프·1건 결정.
- `crisisHotlines.ts` — `crisis-hotlines.json` 단일 출처·페르소나 우선 조회.
- `dateUtils.ts` — 로컬 자정 D+N 계산·문자열/Date 변환.
- `diagnosis.ts` — relationship profile + 기분 평균 → reconnect/fix/heal 가망도.
- `durationContext.ts` — 기간 범위(<1y/1~3y/3~5y/5y+) 질문문맥 적용.
- `experiment.ts` — `userId+experimentId` 해시 [0,1) 가중치 분기 결정론적 변형.
- `moodAnalysis.ts` — 최근 3일 vs 이전 3일 기분 평균 → 상승/하강/안정/변동.
- `offlineQueue.ts` — AsyncStorage 큐 enqueue·온라인 복귀 flush.
- `personaClassifier.ts` — 응답+8축 → top-1 페르소나 점수 합산·P12 baseline·위기 처리.
- `personaResolver.ts` — (주/부) → R0~R5 매트릭스로 effective + guardOverlay 환원.
- `personaScoringRules.ts` — Q1~Q6·외도·복잡도·이별사유 페르소나 점수 규칙.
- `referralEvaluator.ts` — 안전 snapshot으로 활성 임계 평가·우선순위 정렬.
- `referralThresholds.ts` — `referral-thresholds.json` 단일 출처·자원 해소.
- `retry.ts` — 지수 백오프 3회 재시도·타임아웃 즉시 fallback.
- `scoring.ts` — PHQ-9/GAD-7/RSE 표준 채점 + band 메타포 매핑.
- `telemetryHelpers.ts` — 페르소나 코드 → 4유형(A/B/C/D) 익명화.

### utils/__tests__/

- `assessmentTrigger.test.ts` — 권유 윈도우 경계·마지막 응답 컷오프 검증.
- `experiment.test.ts` — deterministic 변형 일관성·가중치 분포 검증.
- `personaResolver.test.ts` — (주/부) 충돌 R0~R5 케이스별 검증.
- `referralEvaluator.test.ts` — C-SSRS 심각도·결정 반복·페르소나 트리거 조건.
- `referralThresholds.test.ts` — 활성 임계 조회·자원 해소 동작.
- `scoring.test.ts` — PHQ/GAD/RSE band 경계·메타포 매핑 검증.

---

## constants/

- `colors.ts` / `colors.js` — 다크 테마 색상 토큰 (purple/teal/coral/amber/blue/gray).
- `consent.ts` — 동의 버전 유효성 헬퍼·문안 통합.
- `copy.ts` — 진단/나침반/누적요약 면책 캐치프레이즈.
- `duration.ts` — 관계기간 범위 타입 (under_1y~over_5y/skip).
- `emotionLabels.ts` — 기분 라벨(슬픔/분노/공허/죄책감/불안/혼란) 이모지 매핑.
- `errors.ts` — `AppError` 코드(AI_TIMEOUT/AI_FAILED/RLS_DENIED 등) 표준화.
- `legal.ts` — 법률·라이선스 귀속·스케일 인용·개인정보 정책 링크.
- `personaBranches.ts` — 페르소나별 화면 분기(미니일기 우선·pros·cons cap·D+N 잠금 등).
- `personaCards.ts` — 페르소나별 우선 카드 metadata (제목·아이콘·라우트).
- `personaIntroCards.ts` — 페르소나 사전 안내 카드 (P01~P20 설명).
- `personaQuestionWeights.ts` — 페르소나별 질문 차단·부스터 가중치.
- `personaTypology.ts` — 4유형(A 안전·B 감정·C 조절·D 의미) 분류·우선순위·톤.
- `questionPool.ts` — 전체 질문 풀 id/문맥(일기/분석/나침반/졸업)/가중치.
- `typography.ts` — Tailwind 텍스트 스케일(3xl~xs) 토큰.

### constants/__tests__/

- `personaBranches.test.ts` — 페르소나 화면 분기 헬퍼 검증.
- `screenHelpers.test.ts` — 화면 헬퍼 함수(시각 포맷 등) 검증.

---

## types/

- `rawMode.ts` — 거칠게모드(P10 venting) 세션 인터페이스·2차 정서 강제·저장 가드.

---

## supabase/

### supabase/ (root)

- `004_pg_cron_setup_manual.sql` — `push-daily-reminder`(21:00 KST)·`push-cooling-day7`(09:00 UTC) cron 등록.

### supabase/functions/_shared/

- `personaPrompts.ts` — 페르소나별 GPT 시스템 프롬프트(톤·금기·프레이밍) 빌더 + 응답 검증.
- `processingSuspension.ts` — 알림/AI 분석 처리정지 토글 조회 헬퍼 (PIPA §37).

### supabase/functions/ (Edge Functions)

- `account-delete/index.ts` — JWT 검증 후 service role로 인증·공개 사용자 완전 삭제 (CASCADE).
- `ai-comfort/index.ts` — 분석/나침반 상황별 2~3문장 위로 GPT 호출.
- `ai-daily-quote/index.ts` — 일일 1~2문장 격려 (같은 날 같은 사용자 캐시).
- `ai-graduation-letter/index.ts` — gpt-4o로 졸업 편지 400~600자 1인칭 생성.
- `ai-journal-response/index.ts` — 일기 방향(잡기/보내기/모르겠어) 기반 2~3문장 감정 응답.
- `ai-journal-response-stream/index.ts` — 일기 완료 후 실시간 SSE 스트리밍 응답.
- `cooling-checkin-response/index.ts` — 유예 Day별(1~7) 체크인 1~2문장 단계별 응답.
- `graduation-farewell-response/index.ts` — 작별 문장 80자 수용 + AI 응답·DB 저장.
- `persona-reclassify-cron/index.ts` — pg_cron 매일 0시 D+7/14/30/60/90 axes 갱신.
- `push-cooling-day7/index.ts` — pg_cron 매일 09:00 UTC 유예 7일 종료자 최종 푸시.
- `push-daily-reminder/index.ts` — pg_cron 매일 21:00 KST 유예 미해당자 일기 독촉.

### supabase/migrations/

- `001_initial_schema.sql` — `users`/`journal_entries`/`question_pool`/`question_responses`/`relationship_profile`/`decision_history`/`graduation_cooling` 기본 정의.
- `002_rls_policies.sql` — `cooling_ends_at` 자동 설정·`updated_at` 트리거·전 테이블 RLS 활성.
- `003_question_pool_seed.sql` — 일기·분석·나침반·졸업 37개 초기 질문 시드.
- `005_question_pool_additions.sql` — 나침반 check 5개 채점·졸업 회한 2개 질문 추가.
- `006_emotion_physical_signals.sql` — `journal_entries.physical_signals TEXT[]` 추가.
- `007_affection_level.sql` — `journal_entries.affection_level INT` (원망↔애정 0~10).
- `008_cooling_reflections.sql` — Day 5/6 의미 재구성·미래 계획 (Worden 4과제).
- `009_intrusive_memory.sql` — 떠올림 응답 (mood_score·escalation 추적).
- `010_pros_cons_timeline.sql` — `relationship_profile` 시점별 장단점 JSONB.
- `011_journal_mini_mode.sql` — `journal_entries.is_mini_mode` 플래그.
- `012_graduation_farewell.sql` — 졸업 작별 문장·AI 응답 (UPDATE/DELETE 금지).
- `013_memory_organization.sql` — 추억 능동 정리 (photos/messages/places).
- `014_self_reflections.sql` — 자기 성찰 6+4 카테고리.
- `015_relationship_duration.sql` — `users.relationship_duration_range` (회복 깊이 분기용).
- `016_intrusive_memory_thought.sql` — `intrusive_memory_response.thought_text` 추가.
- `017_memory_log.sql` — 추억 정리 자유 입력 일기형 테이블.
- `018_consent.sql` — `users.consent_versions`/`consent_accepted_at` (PIPA).
- `019_oauth.sql` — `users.provider`/`provider_user_id` (OAuth 연결).
- `020_safety_protocol.sql` — `crisis_assessments`/`safety_lockouts` (C-SSRS).
- `022_persona_profiling.sql` — 8축 측정값 시계열·페르소나 분류 이력 (P01~P20, P13 제외).
- `023_persona_reclassify_cron.sql` — pg_cron persona-reclassify-cron 등록.
- `024_about_me_categories_g5b.sql` — `self_reflections` 4개 카테고리 추가.
- `025_processing_suspension.sql` — `users.notifications_suspended`/`ai_analysis_suspended`.
- `026_cascade_fk_for_account_delete.sql` — 001 FK들에 ON DELETE CASCADE 명시.
- `027_telemetry_events.sql` — `events` 테이블 (옵트인 행동 로깅).
- `028_contact_urge.sql` — 자가 보고 연락 카운터 (1탭=1행, 7일 추세).
- `029_raw_mode.sql` — `journal_entries.is_raw_mode`/`secondary_emotion` (P10).
- `030_assessments.sql` — `psych_assessments` 테이블 (PHQ/GAD/RSE 응답).
- `031_users_breakup_nullable.sql` — `breakup_date` NOT NULL 해제 (consent 저장 허용).

---

## docs/

### docs/ (root)

- `deploy-checklist.md` — 출시 전 검증 체크리스트.
- `psychology-analysis.md` — 이별 회복 심리학 분석 (Kübler-Ross·Worden·DBT 통합).
- `reason_project_v2.md` — 전체 프로젝트 기획 원문 및 비전.
- `research.md` — 시스템 전체 리서치 및 기술 스택.
- `setup-oauth.md` — Google·Apple·Kakao OAuth 설정 가이드.
- `todo-psychology-mapping.md` — TODO.md vs psychology-analysis.md 동기화 검증.
- `user-flow.md` — 온보딩~졸업 전체 사용자 흐름도.
- `ux-audit(cursor).md` — Cursor 세션 적용 기록 (2026-04-30).
- `ux-audit.md` — 홈 화면 및 전체 UI/UX 감사 결과.

### docs/guide/

- `00-reading-protocol.md` — 코드 리딩 프로토콜 (토큰 절약 팁).
- `01-product-principles.md` — 제품 설계 원칙 (공감·안전·자율성·의미).
- `02-tech-and-architecture.md` — 기술 스택 + 아키텍처 (Expo·Supabase·Edge Functions).
- `03-journal-and-cooling-policy.md` — 일기 4단계 + 유예 정책.
- `04-data-and-state.md` — 데이터 모델 + 상태 관리(Zustand).
- `05-ai-and-prompt-policy.md` — GPT 프롬프트 정책 (면책·톤·fallback).
- `06-notification-policy.md` — 푸시 알림 정책 (D+N 기반 맞춤 타이밍).
- `07-logic-rules.md` — 나침반 결정 로직 + D+N 계산.
- `08-quality-and-risks.md` — 품질 보증 + 위험 관리 (생명 안전).
- `09-conventions-and-roadmap.md` — 코딩 컨벤션 + 로드맵.
- `README.md` — guide 문서 인덱스.

### docs/legal/

- `scales-license.md` — PHQ-9·GAD-7·RSE 라이선스 정리·사용 허가.

### docs/phases/

- `README.md` — Phase 문서 인덱스.
- `common-api-errors.md` — API 에러 코드 표준 정의.
- `phase-0.md` — 인프라 / DB / 디자인 시스템.
- `phase-1.md` — 온보딩 / 홈 / 일기 / Auth.
- `phase-2.md` — 질문 풀 / 관계 분석 / 나침반.
- `phase-3.md` — Edge Functions / GPT 응답.
- `phase-4.md` — 졸업 / 유예기간 / 푸시 알림.
- `phase-5.md` — 오프라인 동기화 / 에러 / 배포.

### docs/psychology-logic/

- `구현계획.md` — 4부 심리학 시스템 구현 세부 (B 안전·C 페르소나·D 검사·E 타당도).
- `검사-라이선스-확인.md` — PHQ/GAD/RSE/C-SSRS/ECR-R/RRS 라이선스 진행 추적.
- `검증-임상관점.md` — 임상심리학자 관점 검증 리포트.
- `심리검사.md` — 도입 가능 심리 검사 목록·스펙.
- `심리검사-도입가능성.md` — 검사 도입 가능성 분석·권고.
- `참고용.md` — 페르소나별 선행 작업·앱 적용 방안.
- `페르소나.md` — 20개 페르소나 정의 (이별 유형·임상 특성·톤).
- `페르소나-분류체계.md` — 8축 분류 + 20 페르소나 시스템.
- `페르소나-화면-액션-매트릭스.md` — 20 페르소나 × 10 화면 = 200셀 분기.
- `페르소나별-유저-플로우.md` — P01~P20 개별 유저 여정.

### docs/psychology-tasks/

- `00-overview.md` — Phase 6-7 개요 + 톤 정책 + 마이그레이션 번호.
- `6-0-onboarding-duration.md` — 연애 기간 질문 추가.
- `6-1-emotion-layers.md` — 감정 라벨 + 신체 신호 다층화.
- `6-2-affection-axis.md` — 원망↔애정 수평축 추가.
- `6-3-cooling-day-content.md` — Day 1~6 유예 콘텐츠 + 회복 단계 개입.
- `6-4-checkin-gpt.md` — 체크인 GPT 응답 (Day별 톤).
- `6-5-intrusive-memory.md` — 떠올랐을 때 빠른 대응 (호흡·마인드풀니스).
- `6-6-time-gate.md` — 분석/나침반 D+7 게이트 + 부드러운 권고.
- `6-7-result-timing.md` — 진단 결과에 시간성 명시 문구.
- `6-8-temporal-pros-cons.md` — 시점별 장단점 누적 (로시 회상 방지).
- `6-9-graduation-farewell.md` — 양방향 졸업 의식.
- `6-10-memory-organization.md` — 추억 능동 정리 (사진/메시지/장소).
- `6-11-self-reflection.md` — 자존감 회복 자기 성찰 트랙.
- `7-1-journal-draft.md` — 일기 작성 중 자동 저장 (AsyncStorage).
- `7-2-mini-mode.md` — 감정 온도만 빠른 기록 모드.
- `7-3-error-retry.md` — 저장 실패 시 명시적 재시도 UI.
- `7-4-emotional-safety.md` — 위기 신호 감지 (3일 저온·새벽 진입·자살 위험).
- `PRIORITY.md` — P0/P1-A/P1-B/P2/P3 우선순위 정렬.
- `README.md` — psychology-tasks 인덱스 + 의존성 그래프.
- `VALIDATION-CHECKLIST.md` — 최종 검증 + 동기화 체크리스트.
- `_shared-components.md` — 공유 컴포넌트 단일 사양 (호흡·모달·라벨).

---

## evaluation/

- `2026-05-03-ux-ui-audit.md` — 사용자 피드백 기반 UX/UI 평가.
- `2026-05-03_SYNTHESIS-three-perspectives.md` — 3개 관점 종합 평가.
- `2026-05-03_user-perspective-strict-review.md` — 사용자 관점 엄격 리뷰.
- `2026-05-06_플로우-방향성-점검.md` — 유저 플로우 방향성 점검.
- `PSYCHOLOGY-V5-CLINICAL-EVALUATION.md` — 임상심리학자 5차 평가.

---

## resources/

- `assessment-items.json` — 검사 문항 메타데이터 (PHQ/GAD/RSE/C-SSRS).
- `crisis-hotlines.json` — 한국 위기 핫라인 (1393·1366·1388 등).
- `privacy-policy.md` — PIPA 준수 개인정보 처리방침.
- `referral-thresholds.json` — 외부 의뢰 임계값 (5개 트리거).
- `terms-of-service.md` — 서비스 이용약관 (데이터 수집·활용 동의).

---

## scripts/

- `check-persona-labels.js` — 페르소나 라벨 비노출 lint 헬퍼 (`npm run lint:persona`).

---

## tests/

### tests/helpers/

- `supabaseMock.ts` — Vitest용 Supabase 클라이언트 모킹 유틸.

---

## 기타 (요약 생략)

- `assets/` — 빈 폴더 (앱 아이콘·스플래시 등 향후 자산용).
- `dist/` — Expo 웹 빌드 산출물 (자동 생성).
- `ios/` — Expo prebuild로 생성된 네이티브 iOS 프로젝트 (`Podfile`·`*.xcodeproj`).
- `supabase/.temp/` — Supabase CLI 캐시 (linked-project 등 자동 생성).
- `.agents/`, `.claude/` — Claude Code/Agent SDK 스킬·설정.
- `.env`, `.env.example` — 환경변수 (Supabase URL·anon key 등).
