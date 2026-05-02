# TODO.md — reason 개발 로드맵

---

## 진행도

> 마지막 업데이트: 2026-04-27  
> **상태 범례:** ✅ 완료 · 🔄 진행 중 · ⬜ 대기 · ❌ 블로킹

```
전체  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  전체 Phase 완료 🎓
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

### Phase 0 — 인프라 / DB / 디자인 시스템 ✅ `3 / 3`
참조: [docs/phases/phase-0.md](docs/phases/phase-0.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 0-1. Expo 프로젝트 초기화 | ✅ | Expo Router + NativeWind v4 |
| 0-2. Supabase 프로젝트 + DB 스키마 | ✅ | 마이그레이션 001~003 + RLS |
| 0-3. 디자인 시스템 | ✅ | colors · 공통 컴포넌트 · ScreenWrapper |

---

### Phase 1 — 온보딩 / 홈 / 이별 일기 / Auth ✅ `5 / 5`
참조: [docs/phases/phase-1.md](docs/phases/phase-1.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 1-1. Supabase Auth + useUserStore | ✅ | 익명 가입 · D+N 계산 |
| 1-2. 온보딩 화면 | ✅ | 이별 날짜(캘린더) · 기분 멀티 선택 |
| 1-3. 홈 화면 | ✅ | D+N 배지 · 일기 CTA · 탭 레이아웃 |
| 1-4. 이별 일기 4화면 흐름 | ✅ | 감정→방향→질문→AI응답 |
| 1-5. Zustand 스토어 전체 구조 | ✅ | 6개 스토어 |

---

### Phase 2 — 질문 풀 / 관계 분석 / 나침반 ✅ `3 / 3`
참조: [docs/phases/phase-2.md](docs/phases/phase-2.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 2-1. 공유 질문 풀 시스템 | ✅ | 상태머신 · 스코어링 · upsert · 오프라인 폴백 |
| 2-2. 관계 분석 트랙 | ✅ | 이유·장단점·점수 4단계, 가망 진단 미터바 "정답이 아니야" |
| 2-3. 결정 나침반 트랙 | ✅ | 5단계 흐름, 경계값 판정, "정답이 아니야" 필수 포함 |

---

### Phase 3 — GPT Edge Functions / AI ✅ `3 / 3`
참조: [docs/phases/phase-3.md](docs/phases/phase-3.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 3-1. Edge Functions 구조 | ✅ | 4개 함수 · npm:openai · fallback · gpt-4o 졸업편지 |
| 3-2. 클라이언트 AI API 레이어 | ✅ | api/ai.ts 4개 함수 · 5초 타임아웃 · AppError 코드 |
| 3-3. AI 응답 지연 대응 | ✅ | SSE 스트리밍(일기), 사전생성(홈), 지수 백오프 Retry |

---

### Phase 4 — 졸업 / 유예 / 푸시 알림 ✅ `3 / 3`
참조: [docs/phases/phase-4.md](docs/phases/phase-4.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 4-1. 졸업 트랙 | ✅ | 성장 리포트·편지(gpt-4o)·확인·신청, 즉시 확정 금지 |
| 4-2. 유예기간 시스템 | ✅ | D-N 카운트다운, 체크인 보존, Day7 확정·연장·취소 |
| 4-3. 푸시 알림 | ✅ | 일반 리마인더·Day7 1회 전용, 유예 중 전면 중지 |

---

### Phase 5 — 오프라인 / 에러 / 배포 ✅ `3 / 3`
참조: [docs/phases/phase-5.md](docs/phases/phase-5.md)

| 서브태스크 | 상태 | 비고 |
|-----------|------|------|
| 5-1. 오프라인 캐시 + 동기화 | ✅ | AsyncStorage 큐, last-write-wins upsert, 포그라운드 flush |
| 5-2. 에러 핸들링 + 로딩 상태 | ✅ | ErrorToast, useErrorHandler, LoadingOverlay |
| 5-3. 앱스토어 배포 | ✅ | pg_cron 마이그레이션, EAS 배포 체크리스트 문서화 |

---

### Phase 6 — 감정 회복 강화 (Psychology-Based Improvements) 🔄 `0 / 9`
참조: [docs/psychology-analysis.md](docs/psychology-analysis.md)

*심리학자 관점 분석을 바탕으로 애도 회복(grief work) 프로세스 강화*

| 서브태스크 | 상태 | 우선순위 | 비고 |
|-----------|------|---------|------|
| 6-1. 일기 감정 입력 다층화 | ⬜ | **P1** | 감정 라벨(분노/죄책감/안도 등) + 신체 신호 체크 추가, mood Pill 컴포넌트 재사용 |
| 6-2. 방향 선택에 원망↔애정 수평축 추가 | ⬜ | **P1** | `/journal/direction` 또는 `/compass/want`에 수평축 슬라이더 1개, 나침반 verdict 정확도 상향 |
| 6-3. Day별 유예 콘텐츠 (Day 1~6 회복 작업) | ⬜ | **P2** | `/cooling/index` 동적 콘텐츠 (호흡가이드→회상→분노→차트→의미→미래), 알림 없이 진입 시만 표시 |
| 6-4. 체크인 GPT 응답 추가 | ⬜ | **P2** | `/cooling/checkin`에 AI 공감 응답 추가, 톤: "결정을 흔들지 않으면서도 지지" |
| 6-5. 떠오름(intrusive memory) 빠른 진입점 | ⬜ | **P1** | 홈에 "🫧 지금 갑자기 떠올랐어" 버튼, 30초 호흡+진정+감정온도 미니 플로우 (DBT distress tolerance) |
| 6-6. 분석/나침반 D+7 시간 게이트 | ⬜ | **P1** | D+0~7에서 진입 시 부드러운 만류 ("일주일은 그냥 흘려보내자"), 강제 차단 X |
| 6-7. 진단 결과에 시간성 명시 | ⬜ | **P1** | `/analysis/result`, `/compass/needle` → "이 수치는 D+N 시점의 너야. 한 달 뒤엔 다른 결과가 나올 거야" 필수 문구 |
| 6-8. 시점별 장단점 분리 누적 | ⬜ | **P2** | `relationship_profile` 누적 데이터 활용, 시간별로 장점/단점 구분하여 로지스틱 회상 방지 |
| 6-9. 졸업 의식의 능동성 강화 | ⬜ | **P2** | `/graduation/letter` → 사용자 작별 문장 작성 + AI 응답 수신 (양방향), 의미 부여 기회 확보 |

---

### Phase 7 — 기술 안정성 + 감정 안전장치 ⬜ `0 / 4`

*Phase 6 감정 회복 강화를 받쳐주는 기술적 안정성과 위기 신호 감지*

| 서브태스크 | 상태 | 우선순위 | 비고 |
|-----------|------|---------|------|
| 7-1. 일기 작성 임시 저장 (draft) | ⬜ | **P1** | AsyncStorage에 draft 저장, 돌아올 때 복구, 재방문 의지 보호 |
| 7-2. 일기 미니 모드 (감정 온도만) | ✅ | **P2** | `app/journal/mini.tsx` + `is_mini_mode` 컬럼, 홈 ⚡/🔥 두 버튼 분기, mini 10개로 일반 5개 게이트 대체 |
| 7-3. 분석/졸업 저장 실패 시 재시도 UI | ⬜ | **P1** | console.warn에서 명시적 ErrorToast + "재시도" CTA, 사용자의 의식적 행위 확인 |
| 7-4. 감정 안전장치 (위기 신호 감지) | ⬜ | **P2** | 3일 연속 온도 1~2점 → 안녕 확인 + 자원 안내, 새벽 시간대 진입 감지, 익명 통계, 위기 핫라인 옵트인 |

---

### 지금 위치

**→ Phase 6 P1 (우선순위 1) 시작** — 심리학 분석을 바탕으로 감정 회복 품질 강화. P1 항목 4개(6-1, 6-2, 6-5, 6-6, 6-7)부터 진행.

### 다음 할 일

**Phase 6 P1 (우선순위 1) 실행:**
- [ ] 6-1. 일기 감정 입력 다층화 — `/journal/index`에 감정 라벨 Pill + 신체 신호 체크 통합
- [ ] 6-2. 방향 선택에 원망↔애정 수평축 추가 — `/journal/direction` 또는 `/compass/want` 슬라이더
- [ ] 6-5. 떠오름 빠른 진입점 — 홈에 "🫧 갑자기 떠올랐어" 버튼 + 30초 미니 플로우
- [ ] 6-6. 분석/나침반 D+7 게이트 — 진입 시 부드러운 만류 메시지
- [ ] 6-7. 진단 결과에 시간성 명시 — `/analysis/result`, `/compass/needle` 수정

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

---

## Phase 6-7 심리학적 가치 분석

### Phase 0-5 현황
- ✅ 기술 완성도: 100% (모든 기능 구현)
- ⚠️ 심리학적 깊이: "결정 보조"에 특화, "애도 회복(grief work)" 트랙 비어있음

### Phase 6-7로 달성할 것
| 개선 | 심리학 근거 | 효과 |
|------|-----------|------|
| 다층 감정 입력 | Kübler-Ross 5단계 애도 모델 정상화 | 분노/죄책감/안도 등 복합 감정 처리 |
| 원망↔애정 축 추가 | 양가감정(ambivalence)의 임상적 구분 | 위험 상태(집착) vs 건강한 수용 식별 |
| Day별 유예 콘텐츠 | Worden 4과제(고통 통과→적응→재배치) | 7일을 방치가 아니라 회복의 장으로 전환 |
| 떠오름 진입점 | DBT distress tolerance 모듈 | 가장 자주 호소되는 상황("갑자기 떠올랐을 때") 처리 |
| 시간 게이트 + 명시 | 이별 직후 인지편향(rosy retrospection) 방어 | 결정 후회 감소, 반추(rumination) 방지 |
| 졸업 양방향성 | 의미 부여의 능동성 | "졸업"을 의식적 행위로 전환 |
| 임시 저장 | 재방문 의지 보호 | 무기력 단계의 재진입 장벽 낮춤 |
| 위기 신호 감지 | 자살 위험 스크리닝 | "혼자가 아니다"는 신호 전달 |

### 기대 효과 (가설)
- **회복 경험 품질 ↑** — "내 감정이 정상이구나"하는 안정감
- **재방문 의지 ↑** — 매일 재진입이 아니라 필요 시점의 맞춤형 경험
- **위기 신호 감지율 ↑** — 3일 연속 최저 감정 → 자동 안녕 확인

---

*이 파일은 구현 계획 검토용입니다. Phase 6-7 진행 중 지속적으로 업데이트 예정.*
