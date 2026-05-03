# CLAUDE.md — reason 개발 인덱스

## 절대 규칙 (위반 불가)

| 규칙 | 내용 |
|------|------|
| UI 구조 | 채팅 UI 금지 — 화면 전환형 질문 UX만 허용 |
| API 보안 | GPT API는 Edge Function에서만 호출, 클라이언트 직접 호출 금지 |
| 키 관리 | `OPENAI_API_KEY`는 Edge Function 환경변수에만 저장 |
| DB 보안 | 모든 테이블 RLS 필수 (`user_id` 기준), 미적용 테이블 사용 금지 |
| 졸업 | 졸업 즉시 확정 금지 — 7일 유예 필수 |
| 유예 알림 | Day 1~6 알림 없음 / Day 7 최종 푸시 1회만 허용 |
| 유예 중 알림 | 유예기간 중 일반 알림(리마인더/감정변화) 전면 중지. **예외**: ① C-SSRS 양성 사용자에 대한 24시간 안부 재확인 푸시 (B-1) |
| 판단 문구 | 진단/나침반 결과 화면에 "정답이 아니야" 문구 필수 포함 |
| 방향 변화 | 방향 변화에 대한 비난/판단 문구 금지 |
| D+N | D+N(이별 경과일) 전역 표시 항상 유지 |
| 위기 신호 | 3일 연속 mood_score 1~2점 또는 새벽(00~04시) 진입 감지 시 반드시 `EmotionalCheckModal` 표시 — 핫라인 정보는 `resources/crisis-hotlines.json`에서만 로드, 하드코딩 금지. 페르소나별 우선 핫라인 매핑 적용. C-SSRS 양성 시 결정 트랙(분석·나침반) 자동 잠금 — 해제는 `/safety/release` 화면에서만 (24시간 경과 + 안전 4문항 통과) |
| 위기 안내 톤 | `EmotionalCheckModal` 본문은 반말 / `/resources/hotline` 화면(정보 전달)만 존댓말 예외 허용 |
| 페르소나 라벨 비노출 | 페르소나 코드(P01~P20)·진단명-유사 어휘(가스라이팅·회피형·불안형·트라우마 본딩·ROCD 등)를 사용자 노출 코드에 직접 쓰지 않음. `npm run lint:persona`로 강제. 예외: `app/resources/`, `app/legal/`, `app/onboarding/consent.tsx` |

---

## 아키텍처

### 프론트엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | React Native + Expo SDK 51+ |
| 스타일 | NativeWind v4 |
| 상태관리 | Zustand |
| 내비게이션 | React Navigation v6 |
| 알림 | expo-notifications |
| 차트 | react-native-chart-kit |
| 로컬 저장 | AsyncStorage |
| 언어 | TypeScript strict |

### 백엔드
| 항목 | 기술 |
|------|------|
| 플랫폼 | Supabase (Auth + Postgres + Edge Functions) |
| AI 호출 | GPT API — Edge Function 프록시 경유만 허용 |
| 기본 모델 | `gpt-4.1-mini` |
| 푸시 | Expo Push / FCM |
| DB 변경 | `supabase/migrations/` SQL 파일로만 관리 |

### Zustand 스토어 구조
| 스토어 | 책임 |
|--------|------|
| `useUserStore` | 이별 날짜, D+N, 온보딩, 푸시 토큰 |
| `useJournalStore` | 오늘 일기, 목록, 통계 |
| `useQuestionStore` | 질문 풀, 응답, 맥락 필터 |
| `useRelationshipStore` | 장단점/이유 누적, 변화 이력 |
| `useDecisionStore` | 방향 변화 이력 |
| `useCoolingStore` | 유예 상태, 체크인 기록 |

### 핵심 DB 테이블
`journal_entries` / `question_responses` / `relationship_profile` / `decision_history` / `graduation_cooling` / `question_pool`

---

## 빌드 / 테스트 / 배포 명령어

### 개발 서버
```bash
npx expo start          # Metro 번들러 + QR
npx expo start --ios    # iOS 시뮬레이터
npx expo start --android # Android 에뮬레이터
```

### 타입 체크
```bash
npx tsc --noEmit        # TypeScript 오류 확인 (CI 필수)
```

### Supabase
```bash
supabase db push                          # 마이그레이션 적용
supabase functions deploy <function-name> # Edge Function 배포
supabase functions serve                  # Edge Function 로컬 테스트
```

### 프로덕션 빌드 (EAS)
```bash
eas build --platform ios     # iOS 빌드
eas build --platform android # Android 빌드
eas submit                   # 스토어 제출
```

---

## 코딩 컨벤션

### 파일 네이밍
| 유형 | 규칙 | 예시 |
|------|------|------|
| 화면 | PascalCase | `HomeScreen.tsx` |
| 컴포넌트 | PascalCase | `InsightCard.tsx` |
| 훅 | `use` prefix camelCase | `useSmartQuestion.ts` |
| API | camelCase | `journal.ts` |
| Edge Function | kebab-case 폴더 | `gpt-response/` |

### UI 패턴
- 화면 전환 시 `fadeUp` 애니메이션 필수 (`opacity` + `translateY` 조합)
- 질문은 화면을 채우고, 선택/입력 후 다음 화면으로 이동
- GPT 실패/타임아웃 시 반드시 템플릿 fallback 응답 제공

### DB 정합성
- `question_responses`: `(user_id, question_id)` unique + upsert 강제
- `direction` / `status` enum 전역 통일 (혼용 금지)
- 유예 리셋/취소 시 체크인 데이터 보존 정책 명시 필수

### GPT 프롬프트 필수 컨텍스트
- 사용자 이별 D+N
- 최근 3일 감정 온도 추이
- 최근 방향 변화
- 말투 원칙: 단정 금지 / 가능성 제시 / 비난 금지

---

## 개발 단계 (Phase)

| Phase | 내용 |
|-------|------|
| 0 | 인프라 / DB / 디자인 시스템 |
| 1 | 온보딩 / 홈 / 일기 / Auth |
| 2 | 질문 풀 / 관계 분석 / 나침반 |
| 3 | GPT Edge Function / AI 응답 |
| 4 | 졸업 / 유예 / 푸시 |
| 5 | 오프라인 / 에러 / 배포 |

---

## 작업별 참조 문서

| 작업 유형 | 문서 |
|-----------|------|
| UX 원칙 / 화면 전환 | [`docs/guide/01-product-principles.md`](docs/guide/01-product-principles.md) |
| 기술 스택 / 아키텍처 | [`docs/guide/02-tech-and-architecture.md`](docs/guide/02-tech-and-architecture.md) |
| 이별 일기 / 졸업 유예 | [`docs/guide/03-journal-and-cooling-policy.md`](docs/guide/03-journal-and-cooling-policy.md) |
| DB / 상태관리 | [`docs/guide/04-data-and-state.md`](docs/guide/04-data-and-state.md) |
| GPT 호출 / 프롬프트 | [`docs/guide/05-ai-and-prompt-policy.md`](docs/guide/05-ai-and-prompt-policy.md) |
| 알림 정책 | [`docs/guide/06-notification-policy.md`](docs/guide/06-notification-policy.md) |
| 진단 / 나침반 / 질문 상태머신 | [`docs/guide/07-logic-rules.md`](docs/guide/07-logic-rules.md) |
| 리스크 / QA | [`docs/guide/08-quality-and-risks.md`](docs/guide/08-quality-and-risks.md) |
| 네이밍 / 로드맵 | [`docs/guide/09-conventions-and-roadmap.md`](docs/guide/09-conventions-and-roadmap.md) |
| 전체 기획 원문 | [`docs/reason_project_v2.md`](docs/reason_project_v2.md) |

## 필수 참조 문서 (상황별)

| 상황 | 문서 | 내용 |
|------|------|------|
| 설계·구조 변경 시 | [`docs/reason_project_v2.md`](docs/reason_project_v2.md) | 전체 기획 — 화면/API/DB 원문 |
| 새 기능 추가 시 | [`docs/research.md`](docs/research.md) | 전체 시스템 리서치 — 작동 방식 상세 |
| 태스크 시작/완료 시 | [`TODO.md`](TODO.md) | 할 일 목록 — 진행 상태 확인 및 업데이트 |

## 사용 규칙
- 매 작업 시작 시 이 파일의 절대 규칙만 먼저 확인
- 태스크 시작·완료 시 `TODO.md` 읽고 상태 업데이트
- 필요한 참조 문서만 선별해 읽고 구현
- 구현 완료 후 절대 규칙 위반 여부만 빠르게 재검증

## 커밋 규칙
- **서브태스크(X-N) 하나 완료 시마다 즉시 커밋**
- `TODO.md` 진행도 업데이트 → 커밋 → 다음 서브태스크 순서 엄수
- 커밋 메시지: 한국어, "왜"에 초점, 서브태스크 번호 포함
  - 예: `[1-4] 이별 일기 4화면 흐름 구현 — 일기 작성 핵심 루틴 완성`
- 민감 파일(`.env*`, `*.key`) 커밋 절대 금지
- `git add -A` / `git add .` 사용 금지 — 파일 개별 명시
