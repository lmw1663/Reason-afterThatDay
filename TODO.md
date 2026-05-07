# TODO.md — Reason 개발 로드맵

> 갱신일: 2026-05-04 (X-4-3 A/B 인프라 완료 시점)
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
심리학 V1 (Phase 6-7): ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░   99%  🔄
─────────────────────────────────────────────────────
A. 인증·구조 재설계:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (a15f8ae~898ebd5)
B. 안전·임상 (구현계획 1부): ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (1b71f61~23361fa)
C-1 페르소나 인프라:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (8a8090c~3f8923a)
C-2 화면별 분기:        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100% ✅ 완료 (단위 테스트 245 PASS, dogfood 별도)
C-2-Ref 참고용 적용:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (d614c74~1908c43)
C-3 다중 페르소나 충돌:   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  100%  ✅ 완료 (5 화면 + 59/59 단위 테스트 PASS)
X-2-B GPT 페르소나 통합: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░   85%  ⏸️ (4 ai-* 통합, 졸업·스트림 deferred — A-4 의존)
D. 검사 통합 (구현계획 3부): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜ B-0 라이선스 회신 의존
E. 베타·프레임 (구현계획 4부): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜ ECR-R/RRS 라이선스 + 베타 50명 의존
F. 매듭 트랙 부활 (졸업 재설계): ░░░░░░░░░░░░░░░░░░░░    0%  ⬜ 스펙 결정 완료 (2026-05-07), F-1 즉시 착수 가능
횡단 (X-1·X-2·X-3·X-4·X-5): ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░   95%  🔄 (X-3-잔여-4 임상 감수만 외부 의존)
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

| ID | 작업 | 상태 | 커밋 |
|---|---|---|---|
| B-0-1 | 라이선스 진행 추적 문서 (PHQ/GAD/RSE/C-SSRS/ECR-R/RRS) | ✅ | `1b71f61` |
| B-0-2 | 핫라인 페르소나 매핑 + 학대·사별·강박·트라우마 자원 추가 | ✅ | `e8d9896` |
| B-0-3 | 동의서 옵트인 (A-1과 통합) | ✅ | A-1 |
| B-1 | C-SSRS 안전 프로토콜 (DB·API·UI·CLAUDE.md, Cron 추후) | ✅ | `23361fa` |
| B-2 | P19 ROCD ERP 제거 (문서) | ✅ | `eda36d3` |
| B-3 | P10 카타르시스 보정 (문서 + 코드 가드) | ✅ | `21799ba` |
| B-4 | 라벨 비노출 lint rule (`npm run lint:persona`) | ✅ | `18461b3` |

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
| C-1-1 | P1 명칭 변경 "가스라이팅" → "자기 판단 손상형" + 임계점 강화 | ✅ | 분류기·매트릭스 적용 완료 |
| C-1-2 | P13 사별 분리 (분류기에서 P13 제외, bereavement-notice는 보류 — 도메인 어긋남) | ✅ | personaClassifier에서 P13 미반환 |
| C-1-3 | 8축 + 페르소나 분류 모듈 (DB·API·classifier) | ✅ | 022 마이그·personaClassifier·api/persona·usePersonaStore |
| C-1-4 | 재분류 cron (D+7/14/30/60/90) | ✅ | persona-reclassify-cron edge function

**산출물**:
- 마이그레이션 `022_persona_profiling.sql`
- `utils/personaClassifier.ts`, `utils/personaScoringRules.json`
- `api/persona.ts`, `store/usePersonaStore.ts`
- 온보딩 6+3 화면 (Q1~Q6 페르소나 + C-SSRS 1~3) — A-2 OAuth 직후

## C-2. 화면별 페르소나 분기 (매트릭스 §2 / 200셀, C9 제외)

> 각 서브태스크는 *화면 1개 × 20 페르소나*. 매트릭스 §2 표의 셀을 코드로 1:1 매핑.

| ID | 작업 | 매트릭스 셀 | 상태 | 커밋 |
|---|---|---|---|---|
| C-2-G-1 | C1 온보딩 — 페르소나별 사전 안내 카드 (20) | 20 | ✅ | — |
| C-2-G-2 | C2 [오늘] 우선 카드 컴포넌트 (20) | 20 | ✅ | 8fb8d05 |
| C-2-G-3a | C3 일기 모드·라벨 분기 (미니·거칠게·주어너·공허) | 20 | ✅ | c4d6562 |
| C-2-G-3b | C3 일기 프롬프트·shame≠guilt 카드 | 20 | ✅ | 527086b |
| C-2-G-4 | C4 나침반 verdict modifier (게이트·후미·deep link) | 20 | ✅ | 22ddd8c |
| C-2-G-5a | C5 about-me 카테고리 페르소나별 정렬 | 20 | ✅ | 2b7164e |
| C-2-G-5b | C5 about-me 신규 카테고리 (reality-check·body·needs·identity) | — | ✅ | 2단계 완료 |
| └ G-5b-1 | DB 마이그(024) + ReflectionCategory 타입·CATEGORIES·CATEGORY_CONFIGS·PRIORITY 4종 추가 | §2 C5 line 41·57·153·169 | ✅ | 523e05e |
| └ G-5b-2 | about-me/index C-3-H secondary 검사 + 권장 카테고리 visual highlight | — | ✅ | (본 커밋) |
| C-2-G-6 | C6 분석 pros·cons 분기 (P01·P14·P19·P20) | 20 | ✅ | eb9f93e |
| C-2-G-7a | C7 추억 미화 차단 + D+21 게이트 (P01·P10·P14·P20·P03) | 20 | ✅ | 93e9541 |
| C-2-G-7b | C7 P09 떠올랐어 카운터·추세 위젯 | — | ✅ | ee76a25 |
| C-2-G-7c | C7 추억 잔여 (P08 봉인·P15 짐 정리·P17·P18 마주침) | — | ✅ | 6단계 완료 |
| └ G-7c-1 | 페르소나 헬퍼 4종(Seal·Declutter·ContinuingBonds·EncounterPlan) + 상호 배제 잠금 | §2 C7 | ✅ | 00c30e0 |
| └ G-7c-2 | P08 봉인 화면 신규 (`app/memory/seal.tsx` · AsyncStorage `memory_seal_v1`) | line 158 | ✅ | 3ef0ad9 |
| └ G-7c-3 | P15 짐 정리 워크시트 (`app/memory/declutter.tsx` · keep/discard/share) | line 268 | ✅ | d761dee |
| └ G-7c-4 | P17 Continuing Bonds (`app/memory/continuing-bonds.tsx`) | line 300 | ✅ | 192a4f4 |
| └ G-7c-5 | P18 마주침 동선 정리 (`app/memory/encounter-plan.tsx` · work/social/place) | line 316 | ✅ | 6aa041d |
| └ G-7c-6 | 진입 통합 (`app/memories/index.tsx` 페르소나 권장 트랙 prominent 카드) | — | ✅ | (본 커밋) |
| C-2-G-8 | C8 쿨링 분기 (021 마이그레이션 + admin 탭) | 20 | ⬜ | 졸업 보류로 진입 제한 |
| ~~C-2-G-9~~ | ~~C9 졸업 분기~~ | ~~20~~ | ⏸️ **보류** (A-4) | — |
| C-2-G-10 | C10 위기/푸시 분기 (페르소나별 핫라인 매핑) | 20 | ✅ | 165c060 |
| C-2-G-11 | 200 셀 단위 테스트 (21 헬퍼 + 6 페르소나 횡단 통합 — 162/162 PASS) / dogfood 20명은 별도 | — | ✅ | (본 커밋, dogfood deferred) |

## C-2-Ref. 참고용.md 5건 적용

> 참고용 §1~§3에서 매트릭스에 없거나 약했던 통찰 5건 보강.

| ID | 작업 | 상태 | 커밋 |
|---|---|---|---|
| C-2-Ref-1 | 페르소나 4유형 분류 SSOT (`constants/personaTypology.ts`) | ✅ | d614c74 |
| C-2-Ref-2 | 다중 페르소나 우선순위 헬퍼 (유형 기반 시급도) | ✅ | a886c2c |
| C-2-Ref-3 | P03 새벽 푸시 차단 (00~04시 일반 푸시 suppress) | ✅ | 6a35a6b |
| C-2-Ref-4 | P14 자기 용서 D+60 게이트 헬퍼 + 매트릭스 코멘트 | ✅ | cc31e17 |
| C-2-Ref-5 | 부치지 않을 편지 보관함 (작성·24h 잠금·읽기) | ✅ | 1908c43 |

## C-3. 다중 페르소나 충돌 해소

| ID | 작업 | 매트릭스 § | 상태 | 커밋 |
|---|---|---|---|---|
| C-3-H | `utils/personaResolver.ts` (R0~R5 + 유형 시급도 결합) | §4-1 | ✅ | 6d60a23 |
| C-3-H-적용 | 4 핵심 화면 마이그레이션 (pros-cons·analysis _layout·me·memory) | §4-2 | ✅ | 5912578 |
| C-3-H-잔존 | journal/index.tsx 분기 마이그레이션 (R5 권장형 — effective만 검사) | — | ✅ | (본 커밋) |
| C-3-H-test | 충돌 8 케이스 + 헬퍼 4종 단위 테스트 (vitest 인프라 신설) | §4-2 | ✅ | 344304c |
| C-3-H-test+ | resolvePersonaPriority 직접 검증 + 매트릭스 미명세 잠금 (P12+P01·P15+P03) — opus 후속 3건 | §4 | ✅ | 936be16 |
| C-3-H-test++ | 라인 ref 주석 + isSelfForgivenessUnlocked D+60 게이트 + P12+P14 잠금 — opus 선택 권고 2건 | §4 + Ref-4 | ✅ | (본 커밋) |

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
| D-1 | 검사 응답 저장 인프라 (`030_assessments.sql` — 022 점유로 030, `api/assessments.ts` + `utils/scoring.ts` 메타포 매핑) | ✅ |
| D-2 | 검사 화면 컴포넌트 (`AssessmentSlider`, `app/assessments/[instrument].tsx` — 1문항 1화면 + 거부권) | ✅ |
| D-3 | 측정 시점 자동 트리거 (홈 권유 카드 D+7/14/30 — 졸업 보류 중에도 노출, 강제 X) | ✅ |
| D-4 | 자가 보고 연락 카운터 (`ContactUrgeChip` + `028_contact_urge.sql` — 023 점유로 028 채번, 홈 칩 + 7일 sparkline + telemetry) | ✅ |
| D-5 | P10 분노 모드 + 2차 정서 강제 (`app/journal/raw-mode.tsx` + `029_raw_mode.sql` — 3-step gate→vent→integrate, 1일 ≤2회, 5개 2차 정서 카드 강제) | ✅ |
| D-6 | 회복 추적 화면 (`app/recovery-trace/index.tsx` — D+0 vs 현재 메타포 비교 + 시계열 + 척도 출처 링크) | ✅ |

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

# Phase G — 홈 화면 UX 정리 (도그푸드 피드백) 🟠

> **이유**: 사용자가 첫 진입 시 "너무 난잡하다 / 뭘 먼저 해야 할지 모르겠다"고 보고. 진단 결과 시각 경쟁자 8~10개 + CTA 5개 + 탭바와 본문 진입 중복. UX 4원칙(One primary action / Progressive disclosure / Single source of navigation / Predictable layout) 위반 다수.
>
> **참조**: 본 대화 §"홈 화면 진단"

| ID | 작업 | 상태 | 의존 |
|---|---|---|---|
| G-1 | **일기 CTA 단일화** — 깊게/감정온도만 두 버튼을 *통합 카드 + 모드 토글*로 (페르소나별 default 보존) | ✅ | — |
| G-2 | **탭바 중복 진입 제거** — 홈에서 "기록 보기" QuickLink + "나에 대해" 카드 삭제 | ✅ | — |
| G-3 | **D+N 헤더 격상** — 우측 작은 칩 → *메인 헤딩*으로 (이별 후 N일이 앱의 핵심 컨텍스트) | ✅ | — |
| G-4 | **메타 라벨 제거** — "진정 플로우", "자존감 트랙" 등 *내부 분류 용어* 사용자 노출 정리 | ✅ | G-1·G-2 (G-2 작업 시 같이 정리됨, grep 검증 완료) |
| G-5 | **보조 진입 chip 격하** — "갑자기 떠올랐어"는 작은 icon chip으로 (큰 카드 → 칩) | ✅ | G-2 |
| G-6 | **조건부 카드 묶음** — PHQ 권유 + ContactUrgeChip을 같은 컨테이너로 묶어 *한 단위*로 시각 인식 (Predictable layout). ContactUrgeChip 매일 노출 정책은 보존 | ✅ | — |
| G-7 | **시각 톤 위계 정리** — 1차/2차/3차 카드의 cornerRadius/배경/그림자 차등 명확화 | ✅ | G-1~G-6 (G-1~G-6 작업으로 자연스럽게 5단계 위계 잡힘 — 추가 변경 0건) |
| G-8 | **페르소나 우선 카드 dismiss 24h** — 매일 무조건 노출되던 학습 부담 ↓. AssessmentRecommendationCard 패턴 차용해 일관성 | ✅ | G-7 |
| G-9 | **별표 마크다운 잔존 정리** — me·data·EmotionalCheckModal에 남은 `*...*` 4건 (코드베이스 grep 검증). me/data는 평문화, CSSRS Q2는 inline RNText 강조 유지(passive/active 표준 구분 필수) | ✅ | — |
| G-10 | **별표 마크다운 sweep 완성** — journal(index/raw-mode/unsent-letter) 3건 + opus 추가 발견 5건(data·pros-cons·memory) 모두 inline RNText 강조 또는 평문화. 코드베이스 전체 잔존 0건 확인 | ✅ | G-9 |
| G-11 | **journal/question CTA 단일화** — 두 PrimaryButton(다음·건너뛸게 ghost)이 동등 무게로 박혀있던 것을 단일 primary + 텍스트 링크로 격하. 홈 G-1 패턴 재적용 | ✅ | — |
| G-12 | **about-me 카드 그리드 축소** — 10개 카드 동시 노출 → 권장 1개(큰 카드) + 미완 우선 4개(그리드) + "전체 보기" 토글. 시각 경쟁자 10 → 6. 홈 G-1·G-2 패턴 재적용 | ✅ | — |
| G-13 | **journal/index.tsx 시각 경쟁자 9→7** — 거칠게 chip 격하(P10) + "정상적인 단계야" 박스 강조 + 신체 신호 collapsible(기본 접힘, 입력시 자동 펼침). 한 화면 8+ 룰 충족 | ✅ | — |
| G-14 | **임상 어휘 노출 제거** — direction·compass/want·compass/needle·CoolingOffWarningModal 4 파일에서 "미해결 애착·상호의존 신호·건강한 수용 진입·분노 단계 통과 중" 등 진단명-유사 어휘 제거. label(상태 묘사)은 유지, "지금 너의 마음:" 단정 톤도 가능성 톤("지금 이 마음은")으로 완화 | ✅ | — |
| G-15 | **journal CTA 다중 정리** — response.tsx 추천 Card 2 PrimaryButton(+버그: ghost no-op이라 dismiss 안 되던 것까지 fix) → primary 1 + 텍스트 링크. mini.tsx 저장 후 2 PrimaryButton → primary 1("홈으로") + 텍스트 링크 | ✅ | — |
| G-16 | **IntrusiveMemoryModal 정리** — step 2 침투 사고 진정 핵심 메시지를 Body → Heading 격상(시각 무게 강화). step 4 PrimaryButton 2개 → primary 1 + 텍스트 링크(모달 dismiss는 백드롭으로 충분) | ✅ | — |
| G-17 | **assessments 디스클레이머·메타 어휘** — "정답이 아니야" 디스클레이머 매 문항 반복 → 첫·마지막 문항만 노출(시선 빠짐 방지). "내부에서 메타포로" → "부드러운 비유로"(메타 어휘 평이화) | ✅ | — |

**검증**: G-1·G-2·G-3 완료 후 시뮬레이터에서 신규 익명 user 진입 → 시각 경쟁자 ≤ 5개, primary CTA 1개로 줄었는지 확인.

---

# 횡단 (모든 페이즈에 공통)

| ID | 작업 | 상태 |
|---|---|---|
| X-1 | PIPA 컴플라이언스 (§35 열람·§36 삭제·GDPR Art.20 반출) — `api/userData.ts` + `app/settings/data.tsx` + me.tsx 진입 + 안전 잠금 가드 + 민감정보 사전 경고 | ✅ | (본 커밋) |
| X-1-잔여 | (전체) Share file·§37·계정 삭제 Edge Function — 출시 전 PIPA 트랙 완성. 단위 테스트만 후속 | ✅ | (본 커밋으로 마감) |
| └ X-1-잔여-Account | account-delete Edge Function + 026 CASCADE 마이그 + UI 통합 | ✅ | (본 커밋) |
| └ X-1-잔여-Share | Share message → expo-file-system + expo-sharing file URL 모드 + cleanup (PIPA §29) | ✅ | bfddf14 |
| └ X-1-잔여-§37-의사 | DB 컬럼(025) + api/processingSuspension + UI 토글 (의사 저장만) | ✅ | (본 커밋) |
| └ X-1-잔여-§37-적용-1 | server-side 게이트 — `_shared/processingSuspension` + ai-daily-quote · push-daily-reminder · push-cooling-day7 | ✅ | 812ee08 |
| └ X-1-잔여-§37-적용-2 | client-side 게이트 — api/ai.ts wrapper 6 함수 (매 호출 DB query, fail-open) | ✅ | (본 커밋) |
| └ X-1-잔여-§37-test | processingSuspension 단위 테스트 (supabase mock 인프라 신설) | ✅ | (본 커밋) |
| X-2 | AI 응답 임상 면책 자동 첨부 (X-2-B-1 buildSystemPrompt에 통합 완료) | ✅ |
| X-2-B-1 | `_shared/personaPrompts.ts` 19 페르소나 톤·금기·프레이밍 + lint 헬퍼 | ✅ fbcd106 |
| X-2-B-2 | 4 ai-* 함수 통합 (journal·comfort·daily-quote·cooling-checkin) + violation fallback | ✅ 92a5f7b |
| X-2-B-3 | 잔여 ai-* 통합 (graduation-letter·graduation-farewell·journal-response-stream) | ⏸️ 졸업·스트림 별도 작업 |
| X-3 | 외부 의뢰 임계 JSON + 헬퍼 + 단위 테스트 — 8 트리거 (구현계획 §6-3) · enabled 가드 · 189 PASS | ✅ |
| X-3-잔여 | 임계 발동 → UI 노출 통합 (3단계 완료, 임상 감수만 잔존) | ✅ |
| └ X-3-잔여-1 | 순수 평가 함수 `referralEvaluator.ts` (5 트리거 + priority 정렬) + 26 테스트 | ✅ 7cecabb |
| └ X-3-잔여-2 | DB snapshot 조회 wrapper `api/referrals.ts` (14일/30일 SQL 윈도우 + personas active) | ✅ (본 커밋) |
| └ X-3-잔여-3 | EmotionalCheckModal 통합 — 119 prominent + dedup된 추가 자원 + fail-safe | ✅ (본 커밋) |
| └ X-3-잔여-4 | verified_by 임상 감수자 채움 + women_emergency 트리거 추론 위험 검토 | ⬜ 외부 임상 자문 |
| X-4 | 텔레메트리·A/B 인프라 (3단계 분해) | 🔄 |
| └ X-4-1 | events 테이블 + RLS + 옵트인 컬럼 + telemetry API + UI 토글 (default OFF) | ✅ | (본 커밋) |
| └ X-4-2 | 인스트루멘테이션 1차 — useScreenView hook + anonymizePersona + me·about_me·journal·EmotionalCheckModal·fetchJournalResponse 시범 적용 | ✅ | (본 커밋) |
| └ X-4-2-2 | 잔여 화면(home·records·memories) + 5 ai wrapper(daily_quote·comfort 등) + persona_branch_applied 3건 + preference_toggled 3건 일괄 적용 | ✅ | (본 커밋) |
| └ X-4-2-3 | 의식 트랙 4 화면(seal·declutter·continuing-bonds·encounter-plan) + safety/release + cooling/index useScreenView | ✅ | (본 커밋) |
| └ X-4-2-4 | onboarding funnel 5 + persona/intro + cooling/checkin useScreenView (cooling/final은 Redirect 미적용) | ✅ | (본 커밋) |
| └ X-4-3 | A/B 실험 인프라 — assignVariant 순수 함수 + useExperiment 훅 + experiment_assigned 이벤트 (DB 무변경, payload 활용) | ✅ | (본 커밋) |
| └ X-4-test | telemetry API 단위 테스트 + payload 매핑 검증 (allowlist runtime은 후속) | ✅ | (본 커밋) |
| X-5 | **CLAUDE.md 갱신** — 유예 알림 예외 + 졸업 보류 + 페르소나 라벨 비노출 + 핫라인 페르소나 매핑 | ✅ |

---

# Phase F — 매듭 트랙 부활 (졸업 재설계)

> **스펙**: [docs/psychology-logic/redesign-graduation.md](docs/psychology-logic/redesign-graduation.md)
> **결정 (2026-05-07)**: "졸업" → "매듭" 어휘 교체 / 평소 UI 비노출 / 시간+안전 6조건 충족 시 권유 모달 1회 → 승낙 시 하단 탭 제일 오른쪽에 동적 추가 / P03·P11·P16·P19 비허용 / P20 단절 30일 최초 1회만 / `/knot/*` alias 추가
> **외부 의존 (선행 권장)**: §9 임상 재검증 5개 항목 — 단, 매트릭스 SSOT 충실하므로 코드 분기 작업과 병렬 진행 가능

| ID | 작업 | 상태 | 의존 |
|---|---|---|---|
| F-1 | 마이그레이션 `032_cooling_persona.sql` (`cooling_period_days`·`knot_label`·`cycle_index`·`persona_codes`) + `033_relationship_cycle.sql` (`knot_archive`) + `034_revisit_rituals.sql` (`knot_revisit_schedule`) | ⬜ | — |
| F-2 | `utils/knotPolicy.ts` 신규 (페르소나 → cooling_days·label·트리거 가능 여부) + `personaResolver.ts` R5 보강 (비허용 페르소나 충돌 시 *전체 비허용*) | ⬜ | F-1 |
| F-3 | `store/useKnotStore.ts` 신규 (`knotTabVisible`·`lastPromptAt`·`lastTriggerCycle`) + 7일 쿨다운 정책 | ⬜ | F-2 |
| F-4 | `app/(tabs)/_layout.tsx`에 `<Tabs.Screen name="knot" href={knotTabVisible ? '/knot' : null}>` 추가 — 제일 오른쪽 위치 | ⬜ | F-3 |
| F-5 | `app/knot/prompt.tsx` 신규 — 풀스크린 권유 모달 ("매듭 짓기 시작할까?") + 페르소나별 본문 톤 분기 | ⬜ | F-3 |
| F-6 | 트리거 평가 — 홈 진입 시 §4-3 6조건(시간·mood·위기·C-SSRS·페르소나·재발화방지) AND 평가 → 모달 발화 | ⬜ | F-2·F-3 |
| F-7 | `app/(tabs)/knot.tsx` 진입점 신규 + 기존 `app/graduation/*.tsx` 어휘 교체 + `/knot/*` alias 라우팅 | ⬜ | F-2 |
| F-8 | 가역성 — 일기 작성 시 *기존 cycle 이어쓰기 vs 새 cycle 시작* 1회 prompt + `cycle_index` 증가 + archive 트리거 | ⬜ | F-1 |
| F-9 | 회상 의식 스케줄러 (P05·P14 D+30/60, P06 D+7 사이클 회고) — `knot_revisit_schedule` 기반 | ⬜ | F-1·푸시 인프라 |
| F-10 | `knot_archive` view → [기록] 탭에 사이클 타임라인 노출 | ⬜ | F-1 |
| F-11 | `lint:persona` 어휘 룰 확장 — "재발/실패/복귀/졸업" 차단 (예외: `app/resources/`·`app/legal/`) | ⬜ | — |
| F-12 | 통합 테스트 + opus agent 임상 검증 (PASS 또는 PASS-WITH-CAVEATS 시 진행) | ⬜ | F-1~F-11 |
| F-13 | A-4 해제 + CLAUDE.md 절대 규칙 표 갱신 ("매듭" 어휘·페르소나 비허용 정책 명문화) | ⬜ | F-12 |

**연계 보류 항목**: G-9·G-8·Phase4-1·X-2-B-3은 본 Phase F 진행 중 단계별로 흡수·해제. 자세한 매핑은 § 보류 표 참조.

**임상 재검증 (외부, 병렬 진행)**: 스펙 §9 5개 항목 — P02·P11·P19·P16 비허용 정책 / P20 단절 30일 안전성 / P05 D+30·60 회상 재트라우마화 / "매듭" 어휘 사용자 테스트(n≥10) / C-SSRS 양성 매듭 잠금.

---

# 보류 (Deferred)

> 일시 보류 항목. 매트릭스·구현계획 문서엔 보존, 코드 미적용.

| ID | 항목 | 사유 | 해제 조건 |
|---|---|---|---|
| ⏸️ G-9 | C9 졸업 트랙 페르소나 분기 (20 셀) | 졸업 트랙 자체 보류 | **Phase F로 흡수** ([redesign-graduation.md](docs/psychology-logic/redesign-graduation.md)) |
| ⏸️ G-8 | C8 쿨링 페르소나별 일수 (021 마이그레이션 + admin 탭) | 졸업 보류로 진입 제한 | **Phase F-1 마이그레이션 032에 흡수** |
| ⏸️ Phase4-1 | 졸업 진입 화면 전체 (`app/graduation/*`) | 사용자 요청 | **Phase F-7 (어휘 교체 + alias)** |
| ⏸️ X-2-B-3 | 졸업·스트림 ai-* 함수 페르소나 통합 | 졸업 보류 + 스트림 구조 별도 | **Phase F-2 knotPolicy 연결 후 진행** |
| ❌ bereavement-notice | 사별(P13) 옵션 | 이별 앱 도메인 어긋남 — 분류기에서도 P13 제외 | 폐기 |

---

# 지금 위치

**→ C-2 + 횡단(X-1·X-3·X-4) 인프라 모두 마감.** 245 테스트 PASS. 잔존은 모두 외부 의존 (X-3-잔여-4 임상 감수, D Phase 라이선스, dogfood 베타).

## 누적 커밋 (최근 30개)

- A 인증·구조: `a15f8ae~898ebd5`
- B 안전·임상 (B-0·B-1): `1b71f61~23361fa`
- C-1 페르소나 인프라: `8a8090c~3f8923a`
- C-2 G 시리즈: `8fb8d05` G-2 → `c4d6562` G-3a → `527086b` G-3b → `22ddd8c` G-4 → `2b7164e` G-5a → `eb9f93e` G-6 → `93e9541` G-7a → `ee76a25` G-7b → `165c060` G-10
- C-2-Ref 참고용: `d614c74` Ref-1 → `a886c2c` Ref-2/4/5 헬퍼 → `6a35a6b` Ref-3 → `cc31e17` Ref-4 → `1908c43` Ref-5
- C-3 + X-2-B: `fbcd106` X-2-B-1 → `6d60a23` C-3-H → `92a5f7b` X-2-B-2 → `5912578` C-3-H 4 화면 적용 → `8781196` C-3-H journal 잔존 → `344304c` C-3-H-test vitest 26 PASS → `936be16` C-3-H-test+ 51 PASS (opus 후속 3건) → `5c38c77` C-3-H-test++ 59 PASS (선택 권고 2건)
- C-2-G-7c: `00c30e0` G-7c-1 헬퍼 4종 → `3ef0ad9` G-7c-2 P08 봉인 → `d761dee` G-7c-3 P15 짐 정리 → `192a4f4` G-7c-4 P17 Continuing Bonds → `6aa041d` G-7c-5 P18 마주침 동선 → `c6102f6` G-7c-6 진입 통합
- C-2-G-5b: `523e05e` G-5b-1 카테고리 4종 인프라 → `a6a1483` G-5b-2 secondary 검사 + visual highlight
- C-2-G-11: `6cef8c9` screenHelpers.test.ts — 14 헬퍼 + 통합 6 페르소나 (162 PASS) → `87f38b0` 시간 boundary 통일
- X-1 PIPA: `05d553b` 열람·삭제·반출 → `bfddf14` Share file URL → `b92e8cc` §37 의사 → `812ee08` §37 server gate → `c2b1384` §37 client gate → `1fb9033` 계정 삭제 Edge Function + 026 CASCADE
- X-3 외부 의뢰: `e482d97` 임계 JSON + 헬퍼 (189 PASS) → `7cecabb` 평가 함수 (215 PASS) → `a7194ec` modal 통합
- X-4 텔레메트리: `073bfdf` events + 옵트인 (X-4-1) → `d61d357` 인스트루멘테이션 1차 → `d2f2c32` 잔여 wrapper·branch·preference → `ef6aec5` 의식 트랙 → `650b546` onboarding funnel → `185fe7f` mock test 인프라 (235 PASS) → `76ba4a7` X-4-3 A/B 인프라 (245 PASS)

## 다음 할 일 (우선순위 순)

### 외부 의존 (자동 진행 불가)
1. **X-3-잔여-4** verified_by 임상 감수
2. ~~**D-1·D-2·D-3·D-6** 검사 통합~~ — Pfizer/UMD 공식 퍼블릭 허가로 회신 불필요 ([라이선스 정리](docs/legal/scales-license.md)), 모두 ✅ 완료
3. **C-2 dogfood 20명** — 베타 사용자 모집

### 내부 진행 가능 (라이선스 무관)
1. **Phase F-1** — 마이그레이션 032~034 작성·적용 (cooling_period_days·knot_label·cycle_index + knot_archive + knot_revisit_schedule)
2. **Phase F-2** — `utils/knotPolicy.ts` + `personaResolver.ts` R5 보강
3. **Phase F-3·F-4** — `useKnotStore` + 동적 탭 노출 (`href` 토글)
4. **Phase F-5·F-6** — 권유 모달 + 트리거 평가 (홈 진입 시 6조건 AND)

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
| 7-1 일기 draft 임시저장 | ✅ | useJournalDraft hook 구현, journal/index에서 사용 |
| 7-2 일기 미니 모드 | ✅ | C-2-G-3 P02 default와 연결 |
| 7-3 저장 실패 재시도 UI | ✅ | ErrorToast.action='재시도' — today·analysis/result·compass/needle·about-me 4 화면 적용. mini는 silent + 로컬 우선 (의도된 패턴) |
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
