# 00. 개요 + 톤 정책 + 마이그레이션 일람

> **출처**: `TODO(psychology).md` (전체 인덱스)
> **공통 참조 문서** — 모든 항목 구현 전 먼저 확인

---

## 개요

### 현황
- ✅ Phase 0-5: 기술 완성도 100% (모든 기능 구현)
- ⚠️ 심리학적 깊이: "결정 보조"에 특화, **"애도 회복(grief work)" 트랙 비어있음**

### 목표
**Kübler-Ross 5단계 애도 모델** + **Worden 4과제** + **DBT 개입**을 통합하여
사용자가 상실의 슬픔을 안전하게 통과하고 의미 있게 졸업할 수 있게 함.

### 기대 효과
- **회복 경험 품질 ↑** — "내 감정이 정상이구나"하는 안정감
- **재방문 의지 ↑** — 매일 강요가 아니라 필요 시점의 맞춤형 경험
- **위기 신호 감지율 ↑** — 3일 연속 최저 감정 → 자동 안녕 확인

---

## 메시지 톤 통일 정책 (Opus 검증 결함 11 수정)

**기본 원칙**: 기존 앱 톤 (친근한 반말) 유지. Phase 6-7 추가 메시지도 동일.

| 톤 | 사용 | 예시 |
|---|---|---|
| 반말 (기본) | 모든 사용자 메시지, AI 응답, 시스템 알림 | "지금 그 마음이 정상이야", "너는 충분히 잘했어" |
| 존댓말 (예외) | 위기 자원/핫라인 안내 (정보 전달 시 격식 필요) | "1393번으로 24시간 상담 가능합니다" |

**금지 패턴**:
- ❌ "너야 + 거예요" 한 문장 안 혼용
- ❌ "당신은" 사용 (이 앱 톤과 안 맞음)
- ✅ "너는", "너의", "~야", "~지", "~어"

**Phase 6-7 메시지 작성 시 체크리스트**:
- [ ] "당신" 표현이 없는가?
- [ ] 동일 메시지 내 반말/존댓말 혼용이 없는가?
- [ ] 단정/강요/비난이 없는가? (CLAUDE.md 절대 규칙)
- [ ] "정답이 아니야" 톤과 일관되는가?

---

## 마이그레이션 일람 (실행 순서)

CLAUDE.md 절대 규칙: "DB 변경 supabase/migrations/ SQL 파일로만 관리"

**기존 마이그레이션** (변경 불가):
- `001_initial_schema.sql`, `002_rls_policies.sql`, `003_question_pool_seed.sql`
- `005_question_pool_additions.sql` (이미 존재 — Phase 6-7과 무관)
- `004`는 deleted 상태

**Phase 6-7 신규 마이그레이션** (006부터 시작):

| 번호 | 파일명 | 변경 내용 | 항목 | 의존성 |
|------|--------|----------|------|--------|
| 006 | `006_emotion_physical_signals.sql` | journal_entries에 physical_signals JSONB 추가 (mood_label은 기존 활용) | 6-1 | 001 |
| 007 | `007_affection_level.sql` | journal_entries에 affection_level INT 추가 | 6-2 | 006 |
| 008 | `008_cooling_reflections.sql` | cooling_reflections 테이블 + RLS | 6-3 | 001 |
| 009 | `009_intrusive_memory.sql` | intrusive_memory_response 테이블 + RLS | 6-5 | 001 |
| 010 | `010_pros_cons_timeline.sql` | relationship_profile에 pros_by_date, cons_by_date JSONB | 6-8 | 001 |
| 011 | `011_journal_mini_mode.sql` | journal_entries에 is_mini_mode BOOLEAN | 7-2 | 006 |
| 012 | `012_graduation_farewell.sql` | graduation_farewell 테이블 + RLS (UPDATE/DELETE 정책 의도적 미생성) | 6-9 | 001 |
| 013 | `013_memory_organization.sql` | memory_organization 테이블 + RLS | 6-10 (P3) | 001 |
| 014 | `014_self_reflections.sql` | self_reflections 테이블 + RLS + source 컬럼 + is_current 인덱스 | 6-11 | 001 |
| 015 | `015_relationship_duration.sql` | public.users에 relationship_duration_range 추가 | 6-0 | 001 |

**모든 새 테이블 RLS 필수** (CLAUDE.md 절대 규칙) — 위 SQL에 RLS ENABLE 및 user_id 기반 정책 모두 포함.

**확인된 사실** (실제 supabase/migrations/ 검토):
- `public.users` 테이블 존재 (`auth.users.id` 참조) → ALTER 가능
- `public.journal_entries.mood_score INT` (감정 온도)
- `public.journal_entries.mood_label TEXT[]` (감정 라벨, **기존 컬럼 활용**)
- `public.journal_entries.free_text TEXT` (자유 메모)
- `public.journal_entries.direction TEXT` (잡기/보내기/모름)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 항목 인덱스
- 🎯 [PRIORITY.md](PRIORITY.md) — 우선순위 정렬
- ✅ [VALIDATION-CHECKLIST.md](VALIDATION-CHECKLIST.md) — 최종 검증 체크리스트
