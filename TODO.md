# TODO.md — reason 개발 로드맵

---

## 진행도

> 마지막 업데이트: 2026-04-27  
> **상태 범례:** ✅ 완료 · 🔄 진행 중 · ⬜ 대기 · ❌ 블로킹

```
전체  ▓▓░░░░░░░░░░░░░░░░░░  10%   Phase 0-1 완료
```

---

### 📄 문서 ✅ 완료

| 항목 | 상태 |
|------|------|
| CLAUDE.md — 절대규칙 / 아키텍처 / 빌드 명령어 / 컨벤션 | ✅ |
| docs/guide 00~09 — 정책 가이드 전체 + mermaid 다이어그램 | ✅ |
| docs/research.md — 전체 시스템 상세 리서치 | ✅ |
| TODO.md — 로드맵 / 스니펫 / 피드백 반영 | ✅ |

---

## Phase 문서 분리 참조 (Claude 토큰 절약)

- 인덱스: [docs/phases/README.md](docs/phases/README.md)
- Phase 0: [docs/phases/phase-0.md](docs/phases/phase-0.md)
- Phase 1: [docs/phases/phase-1.md](docs/phases/phase-1.md)
- Phase 2: [docs/phases/phase-2.md](docs/phases/phase-2.md)
- Phase 3: [docs/phases/phase-3.md](docs/phases/phase-3.md)
- Phase 4: [docs/phases/phase-4.md](docs/phases/phase-4.md)
- Phase 5: [docs/phases/phase-5.md](docs/phases/phase-5.md)

> 작업 시 권장: [CLAUDE.md](CLAUDE.md) 최소 규칙 확인 → 현재 Phase 문서만 읽기 → 공통 규칙은 [docs/phases/common-api-errors.md](docs/phases/common-api-errors.md) 확인

---

### Phase 0 — 인프라 / DB / 디자인 시스템 🔄 `1 / 3`
참조: [docs/phases/phase-0.md](docs/phases/phase-0.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 0-1. Expo 프로젝트 초기화 | ✅ | Expo Router + NativeWind v4 |
| 0-2. Supabase 프로젝트 + DB 스키마 | ⬜ | 마이그레이션 001~003 + RLS |
| 0-3. 디자인 시스템 | ⬜ | colors · 공통 컴포넌트 · ScreenWrapper |

---

### Phase 1 — 온보딩 / 홈 / 이별 일기 / Auth ⬜ `0 / 5`
참조: [docs/phases/phase-1.md](docs/phases/phase-1.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 1-1. Supabase Auth + useUserStore | ⬜ | 익명 가입 · D+N 계산 |
| 1-2. 온보딩 화면 | ⬜ | 이별 날짜 · 기분 선택 |
| 1-3. 홈 화면 | ⬜ | D+N 배지 · 일기 CTA |
| 1-4. 이별 일기 4화면 흐름 | ⬜ | 감정→방향→질문→AI응답 |
| 1-5. Zustand 스토어 전체 구조 | ⬜ | 6개 스토어 |

---

### Phase 2 — 질문 풀 / 관계 분석 / 나침반 ⬜ `0 / 3`
참조: [docs/phases/phase-2.md](docs/phases/phase-2.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 2-1. 공유 질문 풀 시스템 | ⬜ | 상태머신 · 스코어링 · upsert |
| 2-2. 관계 분석 트랙 | ⬜ | 장단점 · 가망 진단 미터바 |
| 2-3. 결정 나침반 트랙 | ⬜ | diff 경계값 · 5단계 흐름 |

---

### Phase 3 — GPT Edge Functions / AI ⬜ `0 / 3`
참조: [docs/phases/phase-3.md](docs/phases/phase-3.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 3-1. Edge Functions 구조 | ⬜ | 4개 함수 · npm:openai · fallback |
| 3-2. 클라이언트 AI API 레이어 | ⬜ | api/ai.ts · 에러 코드 |
| 3-3. AI 응답 지연 대응 | ⬜ | 스트리밍 · 사전생성 · Retry |

---

### Phase 4 — 졸업 / 유예 / 푸시 알림 ⬜ `0 / 3`
참조: [docs/phases/phase-4.md](docs/phases/phase-4.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 4-1. 졸업 트랙 | ⬜ | 성장 리포트 · 편지 · 신청 |
| 4-2. 유예기간 시스템 | ⬜ | D-N 카운트다운 · 체크인 · 상태 전환 |
| 4-3. 푸시 알림 | ⬜ | push-daily-reminder · push-cooling-day7 |

---

### Phase 5 — 오프라인 / 에러 / 배포 ⬜ `0 / 3`
참조: [docs/phases/phase-5.md](docs/phases/phase-5.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 5-1. 오프라인 캐시 + 동기화 | ⬜ | AsyncStorage 큐 · 충돌 정책 |
| 5-2. 에러 핸들링 + 로딩 상태 | ⬜ | AppError 코드 · fallback UX |
| 5-3. 앱스토어 배포 | ⬜ | EAS build · 체크리스트 |

---

### 지금 위치

**→ Phase 0 시작 전** — 검토 체크리스트(파일 하단) 확인 후 0-1 진행.

### 다음 할 일

- [ ] 파일 하단 검토 체크리스트 확인 및 동의
- [ ] Expo 프로젝트 초기화 (`Phase 0-1`)
- [ ] Supabase 프로젝트 생성 + 마이그레이션 실행 (`Phase 0-2`)

---

> 구현 전 검토 필요 — 각 Phase 시작 전 해당 섹션 DoD 확인 후 진행.

---

## Phase 상세 문서는 분리해서 참조

- Phase 0: [docs/phases/phase-0.md](docs/phases/phase-0.md)
- Phase 1: [docs/phases/phase-1.md](docs/phases/phase-1.md)
- Phase 2: [docs/phases/phase-2.md](docs/phases/phase-2.md)
- Phase 3: [docs/phases/phase-3.md](docs/phases/phase-3.md)
- Phase 4: [docs/phases/phase-4.md](docs/phases/phase-4.md)
- Phase 5: [docs/phases/phase-5.md](docs/phases/phase-5.md)
- 공통 API 에러 코드: [docs/phases/common-api-errors.md](docs/phases/common-api-errors.md)

> 토큰 절약 원칙: `TODO.md`에서는 진행도/체크리스트/DoD만 보고, 구현 상세는 해당 Phase 문서만 읽는다.

---

## Phase별 DoD (완료 기준)

각 Phase는 아래 DoD를 모두 통과해야 다음 Phase로 진행한다.

| Phase | DoD |
|-------|-----|
| **Phase 0** | ① Expo 앱 실행 + NativeWind 클래스 적용 확인 ② Supabase 연결 + 모든 테이블 RLS(WITH CHECK 포함) 활성화 ③ `ScreenWrapper` fadeUp 에니메이션 정상 동작 |
| **Phase 1** | ① 온보딩 → 이별 날짜 입력 → 홈 D+N 표시까지 e2e 통과 ② 일기 4화면(감정→방향→질문→AI응답) 작성 → DB 저장 → 홈 CTA 상태 변경 확인 ③ GPT fallback 응답 정상 표시 (오프라인 시뮬레이션) |
| **Phase 2** | ① 관계 분석 질문 응답 → question_responses upsert 확인 ② 같은 질문이 나침반에서 이전 답변으로 채워져 표시 ③ 가망 진단 미터바 + "정답이 아니야" 문구 포함 확인 |
| **Phase 3** | ① Edge Function 배포 후 클라이언트 호출 → 응답 수신 ② 5초 타임아웃 → fallback 표시 확인 ③ `OPENAI_API_KEY` 클라이언트 번들에 없는지 확인 |
| **Phase 4** | ① 졸업 신청 → `graduation_cooling` 생성 → Day 1~6 일반 알림 중지 확인 ② Day 7 알림 1회 발송 + `notifications_sent = 1` ③ 취소/리셋 시 `checkin_responses` 보존 확인 |
| **Phase 5** | ① 오프라인 일기 작성 → 온라인 복구 후 upsert 확인 ② 모든 에러 코드(`AppError`)가 UI에서 올바른 분기로 처리 ③ EAS build iOS/Android 성공 + 앱스토어 제출 |

---

## 검토 체크리스트 (구현 전 확인)

- [✔️] Phase 0 — DB 스키마 (특히 enum 값, generated column) 동의
- [✔️] Phase 0 — 라우터 선택 (Expo Router vs React Navigation 직접) 동의 - 라우터는 Expo Router 선택
- [✔️] Phase 1 — 익명 가입 방식 동의 - 익명 가입으로 하고 처음에는 온보딩하고 익명으로 기록하고 나중에 정보 저장하려면 구글 로그인 방식으로 사용자 저장하고 정보 불러올 수 있게 만들자.
- [✔️] Phase 1 — 일기 화면 4개 흐름 동의
- [✔️] Phase 2 — 가망 진단 점수 산식 (가중치) 동의
- [✔️] Phase 2 — 나침반 경계값 (-3/-1/1/3) 동의
- [✔️] Phase 3 — fallback 템플릿 문구 동의
- [✔️] Phase 4 — 유예 reset 시 checkin 데이터 보존 정책 동의
- [✔️] 전체 — 추가하거나 빼고 싶은 화면/기능 있으면 표시

---

*이 파일은 구현 계획 검토용입니다. 피드백 완료 전까지 코드 작성 없음.*
