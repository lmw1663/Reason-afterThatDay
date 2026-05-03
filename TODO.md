# TODO.md — Reason 개발 로드맵

> 갱신일: 2026-05-03
> 본 문서는 다음 3개 SSOT를 통합한 실행 가능한 작업 목록.
> - [`docs/psychology-logic/구현계획.md`](docs/psychology-logic/구현계획.md) — 페이즈·태스크 인프라
> - [`docs/psychology-logic/페르소나-화면-액션-매트릭스.md`](docs/psychology-logic/페르소나-화면-액션-매트릭스.md) — 20×11 분기 SSOT
> - [`docs/psychology-logic/페르소나.md`](docs/psychology-logic/페르소나.md) + `페르소나-분류체계.md` — 페르소나 정의
>
> **재설계 결정 (2026-05-03)**:
> - 하단바 4탭 → **3탭**: [오늘] [기록] [나] (방향 C)
> - **졸업 트랙 일시 보류** — 매트릭스 C9 셀은 문서에 보존, 코드 미적용
> - 첫 진입에 **약관 동의 + OAuth 로그인**(Google·Apple·Kakao) 강제
> - 분석·나침반은 [나] 안 트랙으로 흡수, 페르소나·D+N 게이트로 노출 제어
>
> **상태 범례**: ✅ 완료 · 🔄 진행 중 · ⬜ 대기 · ⏸️ 보류(deferred) · ❌ 블로킹

---

## 진행도

```
기반 (Phase 0-5):     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료
심리학 V1 (Phase 6-7): ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░   90%  🔄
─────────────────────────────────────────────────────
A. 인증·구조 재설계:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (a15f8ae~898ebd5)
B. 안전·임상 (구현계획 1부): ░░░░░░░░░░░░░░░░░░░░    0%  🔄 진행 중
C. 페르소나 시스템 (구현계획 2부 + 매트릭스): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜
D. 검사 통합 (구현계획 3부): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜
E. 베타·프레임 (구현계획 4부): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜
횡단:                  ░░░░░░░░░░░░░░░░░░░░    0%  ⬜
```

---

# Phase A — 인증·구조 재설계 (즉시 착수) 🔴

> **이유**: 현재 익명 가입 + 4탭(홈/관계분석/나침반/졸업) 구조가 페르소나 매트릭스 적용을 막음. 매트릭스 적용 전 *기반*을 먼저 다진다.
>
> **참조**: 본 대화 §"하단바 재설계 방향 C" / 매트릭스 §5-4

| ID | 작업 | 상태 | 의존 |
|---|---|---|---|
| A-1 | **약관 동의 화면** — 정보처리방침 + 이용약관 | ⬜ | — |
| A-2 | **OAuth 로그인 화면** — Google·Apple·Kakao 3종 | ⬜ | A-1 |
| A-3 | **하단바 4탭 → 3탭** [오늘] [기록] [나] | ⬜ | — |
| A-4 | **졸업 탭 제거** + 졸업 진입 모두 비활성화 | ⬜ | A-3 |
| A-5 | **분석·나침반을 [나] 트랙 카드로 이동** | ⬜ | A-3 |
| A-6 | **[오늘] 페르소나 우선 카드 슬롯** 신설 | ⬜ | A-3 |
| A-7 | **users 테이블 OAuth 컬럼 + consent_versions JSONB** | ⬜ | A-2 |

## A-1. 약관 동의 화면

**파일**:
- `app/onboarding/consent.tsx` (신규 — 첫 진입 화면, `app/index.tsx` → consent 라우팅)
- `resources/terms-of-service.md` (신규)
- `resources/privacy-policy.md` (신규)
- `supabase/migrations/018_consent.sql` (신규 — `users.consent_versions JSONB`)

**필수 조항**:
1. 정보처리방침 (PIPA 일반)
2. 서비스 이용약관 (앱 사용 규칙)
3. 심리 척도 응답 수집·결과 활용 (PIPA 민감정보) — 구현계획 0-3 통합
4. 페르소나 자동 분류 동의 + 조회·삭제 권리 명시
5. 위기 응답 수집·응급 외 제3자 공유 없음
6. C-SSRS 양성 시 자동 동작(졸업 트랙 잠금·푸시) 사전 동의 — *졸업 보류 중에도 명문 유지*

**UI 패턴**:
- 화면 전환형 (CLAUDE.md 절대 규칙)
- 1화면 = 1조항 그룹, 스크롤 후 [동의] [거부] 양자택일
- 거부 시 앱 진입 차단 + "동의 없이는 사용할 수 없어" 안내
- 버전 갱신 시 재동의 (`consent_versions`에 timestamp 기록)

## A-2. OAuth 로그인 (Google·Apple·Kakao) — **한국 한정 출시**

**출시 범위**: 🇰🇷 **한국 시장 한정**. App Store / Google Play 모두 한국 스토어에만 등록. 다른 지역 출시는 별도 의사결정 필요.

**파일**:
- `app/onboarding/login.tsx` (신규 — A-1 직후)
- `api/auth.ts` (확장)
- `hooks/useAuth.ts` (확장)

**구현**:
- Supabase Auth + 3-party OAuth 프로바이더 등록
- `expo-auth-session` 사용
- 패키지: `expo-auth-session`, `@react-native-google-signin/google-signin`, `expo-apple-authentication`, `@react-native-seoul/kakao-login`
- iOS: Apple 로그인 *필수* (앱스토어 정책)
- Android: Google + Kakao 우선
- **카카오는 한국 메인 OAuth**로 1순위 노출 — 한국 사용자 친화

**한국 한정 출시에 따른 영향**:
- 약관·정책 문서는 **한국어만** (A-1)
- 핫라인은 한국 핫라인만 (`crisis-hotlines.json` — 1577-0199, 1366, 1388 등)
- PIPA(개인정보 보호법) 준수만 고려, GDPR 등 타국 법규 미적용
- 외부 자원도 한국 기관만 (비탄클리닉·강박장애 전문센터 등)
- 글로벌 확장 시 재논의 필요 항목: 다국어, 카카오 제외, 타국 핫라인, GDPR/CCPA

**UI**:
- 로고 + 한 줄 카피 ("천천히 들여다보자")
- 3개 버튼 세로 배열, OAuth 표준 디자인 가이드 준수
- "로그인하면 위 약관에 동의한 것으로 간주" 미표시 (A-1에서 명시 동의 받음)

**DB**:
- `users.provider text check (provider in ('google','apple','kakao'))` 컬럼 추가
- `users.provider_user_id text` 추가
- 익명 가입 → OAuth 전환 마이그레이션 흐름 (기존 사용자 보호)

## A-3. 하단바 3탭 재구성

**파일**:
- `app/(tabs)/_layout.tsx` (수정)
- `app/(tabs)/index.tsx` → "오늘"
- `app/(tabs)/records.tsx` (신규) → "기록"
- `app/(tabs)/me.tsx` (신규) → "나"
- `app/(tabs)/analysis.tsx` (제거 또는 redirect)
- `app/(tabs)/compass.tsx` (제거 또는 redirect)
- `app/(tabs)/graduation.tsx` (제거 — A-4)

**탭 구성**:
| 탭 | 내용 | 페르소나 분기 |
|---|---|---|
| 오늘 | 페르소나 우선 카드 + 일기 진입 + 위기 자원 | 매트릭스 C2·C3·C10 |
| 기록 | 일기 history + 회복 곡선 + 추억 archive + 사이클 타임라인(P06) | C7 일부 + 신규 |
| 나 | about-me 카테고리 + 분석·나침반 트랙 (페르소나 게이트) | C5·C6·C4 통합 |

## A-4. 졸업 트랙 일시 보류

- 하단바 졸업 탭 제거
- `app/graduation/*.tsx` 진입 경로 모두 비활성화 (코드 보존, deep link 차단)
- 매트릭스 C9 셀 — 문서엔 유지, 코드 게이트 OFF
- 기존 [6-9] 졸업 작별 문장 → archive로 이동
- 보류 해제 조건: 임상 재검증 + 페르소나별 졸업 흐름 별도 설계

## A-5. 분석·나침반 → [나] 안 트랙 이동

**구현**:
- `/analysis/*` URL 보존 (deep link 호환), 진입은 [나] 카드로만
- `/compass/*` URL 보존, [나] 카드로만
- [나] 화면에 *페르소나·D+N 게이트* 적용 — P02·P04·P07 등은 카드가 비활성/지연 표시

## A-6. [오늘] 페르소나 우선 카드 슬롯

**파일**: `app/(tabs)/index.tsx` 수정

- 헤더(D+N 배지) 아래에 *페르소나 우선 카드 슬롯* 추가
- `usePersonaStore` 미존재 시 baseline 카드 (P12 동작)
- C-2-G-2 본 구현은 Phase C에서 (여기선 슬롯만)

## A-7. users 테이블 확장

**파일**: `supabase/migrations/018_consent.sql`, `019_oauth.sql`

```sql
-- 018_consent.sql
alter table public.users add column consent_versions jsonb default '{}'::jsonb;
alter table public.users add column consent_accepted_at timestamptz;

-- 019_oauth.sql
alter table public.users add column provider text check (provider in ('google','apple','kakao','anonymous'));
alter table public.users add column provider_user_id text;
create unique index users_provider_id on public.users(provider, provider_user_id) where provider is not null;
```

---

# Phase B — 안전·임상 위해 차단 (구현계획 1부) 🔴

> **참조**: [`docs/psychology-logic/구현계획.md`](docs/psychology-logic/구현계획.md) §1부 / 매트릭스 §5-3
> **블로킹**: 라이선스·핫라인 검증 (B-0)

| ID | 작업 | 상태 | 의존 |
|---|---|---|---|
| B-0-1 | 라이선스 서면 확인 (PHQ/GAD/RSE/C-SSRS/ECR-R/RRS) | ⬜ | — |
| B-0-2 | 핫라인 데이터 검증·확장 (`crisis-hotlines.json`) | ⬜ | — |
| B-0-3 | 동의서 옵트인 갱신 (A-1과 통합) | ⬜ | A-1 |
| B-1 | C-SSRS 안전 프로토콜 (DB·API·UI·Cron·CLAUDE.md) | ⬜ | B-0-1 |
| B-2 | P19 ROCD ERP 제거 (문서) | ⬜ | — |
| B-3 | P10 카타르시스 보정 (문서 + 코드 가드) | ⬜ | — |
| B-4 | 라벨 비노출 lint rule | ⬜ | — |

> **핵심 산출물**:
> - 마이그레이션 `018_consent.sql`(=A-7), `020_safety_protocol.sql`, `021_data_retention.sql`
> - `api/safety.ts`, `components/EmotionalCheckModal.tsx` 확장
> - `app/safety/release.tsx` 신규 (잠금 해제 흐름)
> - Edge Function `safety-followup-cron/`
> - **CLAUDE.md 갱신**: C-SSRS 24h 재확인 푸시 예외 절 추가

---

# Phase C — 페르소나 시스템 + 화면 분기 (구현계획 2부 + 매트릭스 220셀) 🟠

> **참조**: 구현계획 §2부 + 매트릭스 §2~§4
> **목표**: 8축 분류 + 20 페르소나 × 10 화면(C9 졸업 제외) = **200 분기 셀** 빠짐없이 적용

## C-1. 페르소나 분류 인프라

| ID | 작업 | 상태 |
|---|---|---|
| C-1-1 | P1 명칭 변경 "가스라이팅" → "자기 판단 손상형" + 임계점 강화 | ⬜ |
| C-1-2 | P13 사별 분리 + `bereavement-notice.tsx` 신규 | ⬜ |
| C-1-3 | 8축 + 페르소나 분류 모듈 (DB·API·classifier) | ⬜ |
| C-1-4 | 재분류 cron (D+7/14/30/60/90) | ⬜ |

**산출물**:
- 마이그레이션 `022_persona_profiling.sql`
- `utils/personaClassifier.ts`, `utils/personaScoringRules.json`
- `api/persona.ts`, `store/usePersonaStore.ts`
- 온보딩 6+3 화면 (Q1~Q6 페르소나 + C-SSRS 1~3) — A-2 OAuth 직후

## C-2. 화면별 페르소나 분기 (매트릭스 §2 / 200셀, C9 제외)

> 각 서브태스크는 *화면 1개 × 20 페르소나*. 매트릭스 §2 표의 셀을 코드로 1:1 매핑.

| ID | 작업 | 매트릭스 셀 | 상태 |
|---|---|---|---|
| C-2-G-1 | C1 온보딩 — 페르소나별 사전 안내 카드 (20) | 20 | ⬜ |
| C-2-G-2 | C2 [오늘] 우선 카드 컴포넌트 (20) — A-6 슬롯에 본 구현 | 20 | ⬜ |
| C-2-G-3 | C3 일기 — 미니/거칠게/주어너/공허라벨 등 (20) | 20 | ⬜ |
| C-2-G-4 | C4 나침반 verdict modifier — `utils/diagnosis.ts` 확장 | 20 | ⬜ |
| C-2-G-5 | C5 about-me 카테고리 enum + 노출 분기 (20) | 20 | ⬜ |
| C-2-G-6 | C6 분석 pros·cons 분기 (컬럼·상한·D+N 게이트) | 20 | ⬜ |
| C-2-G-7 | C7 추억 트랙 분기 (미화차단·봉인·트리거정리) | 20 | ⬜ |
| C-2-G-8 | C8 쿨링 분기 (021 마이그레이션 + admin 탭) | 20 | ⬜ |
| ~~C-2-G-9~~ | ~~C9 졸업 분기~~ | ~~20~~ | ⏸️ **보류** (A-4) |
| C-2-G-10 | C10 위기/푸시 분기 (`EmotionalCheckModal` + 핫라인 매핑) | 20 | ⬜ |
| C-2-G-11 | 200 셀 단위 테스트 + dogfood 20명 (페르소나당 1명) | — | ⬜ |

## C-3. 다중 페르소나 충돌 해소

| ID | 작업 | 매트릭스 § |
|---|---|---|
| C-3-H | `utils/personaResolver.ts` (R0~R5 알고리즘 구현) | §4-1 |
| C-3-H-test | 충돌 8 케이스 단위 테스트 | §4-2 |

## C-4. 나침반 재설계 (본 대화에서 도출된 임상 결함 보강)

> **이유**: 11/20 페르소나가 catch/let_go 이분법과 충돌. 매트릭스 §2 C4 셀들과 자연스럽게 통합 필요.

| ID | 작업 |
|---|---|
| C-4-1 | verdict 차원 확장: `catch / let_go / mixed / accept / suspend / understand` (6택) |
| C-4-2 | 나침반 → "오늘의 방향"으로 라벨 변경 (선택적) |
| C-4-3 | [나] 안에서 페르소나·D+N 게이트로 진입 제어 — A-5와 통합 |

---

# Phase D — 검사 통합 + 회복 추적 (구현계획 3부) 🟡

> **참조**: 구현계획 §3부
> **블로킹**: B-0-1 라이선스

| ID | 작업 | 상태 |
|---|---|---|
| D-1 | 검사 응답 저장 인프라 (`023_assessments.sql`, `api/assessments.ts`) | ⬜ |
| D-2 | 검사 화면 컴포넌트 (`AssessmentSlider`, `app/assessments/[instrument].tsx`) | ⬜ |
| D-3 | 측정 시점 자동 트리거 (D+7/14/30 + 졸업 진입 — *졸업 보류 중엔 진입 트리거 없음*) | ⬜ |
| D-4 | 자가 보고 연락 카운터 (`ContactUrgeChip` + `024_contact_urge.sql`) | ⬜ |
| D-5 | P10 분노 모드 + 2차 정서 강제 (`app/journal/raw-mode.tsx` + `025_raw_mode.sql`) | ⬜ |
| D-6 | 회복 추적 화면 (`app/recovery-trace/index.tsx` — 메타포 라벨 검수) | ⬜ |

---

# Phase E — 변별 타당도 + 누락 프레임워크 (구현계획 4부) ⚪

> **참조**: 구현계획 §4부
> **블로킹**: ECR-R·RRS 라이선스 + 베타 사용자 50+ 동의

| ID | 작업 |
|---|---|
| E-1 | ECR-R 단축형 12항 (라이선스 확인 후) |
| E-2 | RRS 단축형 10항 (D+30 권유) |
| E-3 | 변별 타당도 베타 검증 (κ ≥ 0.6 게이트) |
| E-4 | 누락 프레임워크 6종 — Self-Compassion/Polyvagal/ACT/DBT/Worden/Continuing Bonds |

---

# Phase F — 장기 안정화 (구현계획 5부) 🟢

| ID | 작업 |
|---|---|
| F-1 | PG-13 / TGI-SR+ (D+90·D+180) |
| F-2 | 한국 특수 페르소나 P21~P23 (가족압박·결혼직전파혼·종교갈등) |
| F-3 | LGBTQ+ 페르소나 + outing 위험 가드 |
| F-4 | 존댓말/반말 톤 옵션 (P12·P16 default 존댓말) |

---

# 횡단 (모든 페이즈에 공통)

| ID | 작업 | 상태 |
|---|---|---|
| X-1 | PIPA 컴플라이언스 (조회·삭제·반출 — `app/settings/data.tsx`) | ⬜ |
| X-2 | AI 응답 임상 면책 자동 첨부 | ⬜ |
| X-2-B | **GPT 시스템 프롬프트 페르소나 분기 (20 톤·금기)** — `gpt-response/personaPrompts.ts` | ⬜ |
| X-3 | 외부 의뢰 임계 JSON (`resources/referral-thresholds.json`) | ⬜ |
| X-4 | 텔레메트리·A/B 인프라 | ⬜ |
| X-5 | **CLAUDE.md 갱신** — 유예 알림 예외 3건 + 졸업 보류 명시 + 페르소나 라벨 노출 금지 + 핫라인 페르소나 매핑 | ⬜ |

---

# 보류 (Deferred)

> 일시 보류 항목. 매트릭스·구현계획 문서엔 보존, 코드 미적용.

| ID | 항목 | 사유 | 해제 조건 |
|---|---|---|---|
| ⏸️ G-9 | C9 졸업 트랙 페르소나 분기 (20 셀) | 졸업 트랙 자체 보류 | A-4 해제 시 |
| ⏸️ Phase4-1 | 졸업 진입 화면 전체 (`app/graduation/*`) | 사용자 요청 | 임상 재검증 후 |

---

# 지금 위치

**→ Phase A 진입.** Phase 0~5 인프라 위에 *인증·구조 재설계*를 먼저 끝낸 뒤 Phase B(안전) → C(페르소나) 순으로 진행.

## 다음 할 일 (우선순위 순)

1. **A-1** 약관 동의 화면 (정보처리방침 + 이용약관)
2. **A-2** OAuth 로그인 (Google·Apple·Kakao)
3. **A-7** users 테이블 OAuth + consent 컬럼
4. **A-3** 하단바 3탭 재구성
5. **A-4·A-5** 졸업 제거 + 분석·나침반 [나]로 이동
6. **A-6** [오늘] 페르소나 카드 슬롯 (이후 C-2-G-2가 채움)

A 완료 후 → **B-0** (라이선스·핫라인) 병행 시작 → **B-1** C-SSRS → **C-1** 페르소나 분류 → **C-2** 200셀 분기.

---

---

# Archive — 완료 / 기존 진행 항목

> 새 로드맵으로 재정렬되기 전 항목들. 코드는 모두 살아있음.

## ✅ 완료된 Phase 0~5 (기반)

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 0 | Expo + Supabase + 디자인 시스템 | ✅ |
| Phase 1 | Auth(익명) + 온보딩 + 홈 + 일기 4화면 + Zustand 6스토어 | ✅ |
| Phase 2 | 질문 풀 + 관계 분석 + 결정 나침반 | ✅ |
| Phase 3 | Edge Functions + AI 클라이언트 + SSE 스트리밍 | ✅ |
| Phase 4 | 졸업·유예·푸시 (졸업은 A-4로 보류) | ✅→⏸️ |
| Phase 5 | 오프라인 동기화 + 에러 핸들링 + 배포 | ✅ |

## ✅ Phase 6~7 심리학 V1 (기존 작업)

> 본 새 로드맵으로 흡수되기 전의 1차 심리학 작업. 대부분 완료, 일부는 새 매트릭스에 의해 *재설계 대상*.

| 항목 | 상태 | 새 위치 |
|---|---|---|
| 6-0 온보딩: 연애 기간 | 부분완료 | C-1-3에 흡수 |
| 6-1 일기 감정 다층화 | 부분완료 | C-2-G-3 (P08 공허 라벨 등) |
| 6-2 원망↔애정 수평축 | ✅ | C-2-G-3 (P11 두 마음에 활용) |
| 6-3 Day별 유예 콘텐츠 | ✅ | C-2-G-8 페르소나별 분기로 확장 |
| 6-4 체크인 GPT 응답 | ✅ | X-2-B에서 페르소나 분기 추가 |
| 6-5 떠오름 빠른 진입점 | ✅ | C-2-G-2 P03 우선 카드와 통합 |
| 6-6 분석 D+7 게이트 | ✅ | C-2-G-6 페르소나별 D+N으로 확장 |
| 6-7 진단 결과 시간성 | ✅ | C-4 나침반 재설계와 통합 |
| 6-8 시점별 장단점 | ✅ | C-2-G-6에 흡수 |
| **6-9 졸업 작별 양방향** | ✅→⏸️ | **보류** (A-4) |
| 6-10 추억 능동 정리 | ✅ | C-2-G-7 페르소나별 분기로 확장 |
| 6-11 자기 성찰 트랙 | ✅ | C-2-G-5 about-me에 흡수 |
| 7-1 일기 draft 임시저장 | ⬜ | 그대로 유지 |
| 7-2 일기 미니 모드 | ✅ | C-2-G-3 P02 default와 연결 |
| 7-3 저장 실패 재시도 UI | ⬜ | 그대로 유지 |
| 7-4 위기 신호 감지 | ✅ | B-1 C-SSRS 프로토콜로 확장 |

## 📁 참조 문서 인덱스

| 문서 | 위치 |
|---|---|
| 절대 규칙 + 컨벤션 | [CLAUDE.md](CLAUDE.md) |
| 페이즈 인덱스 (구) | [docs/phases/README.md](docs/phases/README.md) |
| 심리학 분석 원본 | [docs/psychology-analysis.md](docs/psychology-analysis.md) |
| 심리학 태스크 인덱스 (구) | [TODO(psychology).md](TODO(psychology).md) |
| **신규 SSOT** — 구현계획 | [docs/psychology-logic/구현계획.md](docs/psychology-logic/구현계획.md) |
| **신규 SSOT** — 페르소나 매트릭스 | [docs/psychology-logic/페르소나-화면-액션-매트릭스.md](docs/psychology-logic/페르소나-화면-액션-매트릭스.md) |
| **신규 SSOT** — 페르소나 정의 | [docs/psychology-logic/페르소나.md](docs/psychology-logic/페르소나.md) + `페르소나-분류체계.md` |

## 검토 체크리스트 (기존)

- [✔️] Phase 0~5 DoD 통과
- [✔️] 익명 가입 + OAuth 전환 흐름 동의 → **변경**: 이제 첫 진입부터 OAuth 강제 (A-1·A-2)
- [✔️] 일기 4화면 흐름 동의
- [✔️] 가망 진단·나침반 경계값 동의 → **변경**: C-4 재설계로 6택 verdict
- [✔️] fallback 템플릿 동의
- [✔️] 유예 reset 시 checkin 보존 동의 → 유지
- [✔️] 졸업 = 즉시 확정 금지 + 7일 유예 → **보류**: A-4

---

*이 파일은 SSOT 3종(구현계획·매트릭스·페르소나)을 통합한 실행 로드맵. Phase A부터 순차 진행.*
