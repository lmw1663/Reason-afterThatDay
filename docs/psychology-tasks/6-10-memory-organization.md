# 6-10. 추억의 능동적 정리 트랙 (사진/메시지/장소) 🔵 P3

> **Phase**: 6 — 감정 회복 강화
> **우선순위**: P3 (출시 후 점진적 추가)
> **마이그레이션**: 013
> **출처**: `TODO(psychology).md` 라인 2199-2273

---

**심리학 근거**
- psychology-analysis §7 미커버 영역
- 6-5(떠오름)는 *수동적 트리거 처리*만 다룸 → *능동적 정리*는 별도 필요
- **통제감(sense of control) 회복**: 사용자가 "기다리는 입장"이 아닌 "정리하는 입장"으로 전환
- 임상적으로 물리적/상징적 마무리 행위가 회복에 결정적

**현재 상태**
- 추억(사진, 메시지, 장소 등)을 다루는 트랙 0개
- 사용자가 떠올랐을 때 "처리"는 가능하지만, 떠올림 자체를 *예방*할 능동 행위 없음

**개선 방향**

새 화면 `/memories` (탭은 아님 — 졸업 트랙에서 진입):

```
졸업 신청 시 또는 유예 Day 5에 옵션 제공:
"기억할 가치는 보존하고, 나머지는 정리해볼까?"

[추억 정리 시작]
   ↓
3가지 카테고리 (선택사항, 건너뛰기 가능):

📷 사진 정리
   - "추억 폴더로 옮기기" 가이드 (직접 사진앱에서)
   - 앱이 사진을 보거나 저장하지 않음 (개인정보 보호)
   - 단지 가이드 + "정리 완료 체크" 만

💬 메시지 정리
   - 메시지/카톡 백업 가이드 링크
   - "차단" 결정 지원 메시지 (강제 X)

📍 장소 리스트
   - "함께 갔던 장소" 텍스트 입력 (선택)
   - "당분간 피하고 싶은 장소" 표시
   - 데이터는 사용자 일기처럼 본인만 조회
```

**중요한 설계 원칙**:
- 앱이 사진/메시지에 *접근하지 않음* — 사용자가 직접 본인 기기에서 정리
- 앱은 *가이드*와 *체크리스트*만 제공
- "정리 완료" 체크는 *심리적 의식*의 의미 (실제로 뭘 했는지 검증 X)

**저장 데이터** (마이그레이션 013, 출시 후 점진적 추가):
```sql
-- migrations/013_memory_organization.sql
CREATE TABLE public.memory_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('photos', 'messages', 'places')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,  -- 사용자 메모 (장소 리스트 등)
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_organization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_memory_org" ON public.memory_organization
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_memory_org" ON public.memory_organization
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_memory_org" ON public.memory_organization
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_memory_org" ON public.memory_organization
  FOR DELETE USING (auth.uid() = user_id);
```

**우선순위가 P3인 이유**:
- 출시 직후에는 6-1 ~ 6-9, 7-1 ~ 7-4가 더 본질적
- 추억 정리는 *옵션 트랙*이지 *필수 트랙*이 아님
- 출시 후 사용자 피드백을 보고 정교화

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람
- 🔗 보완 트랙: [6-5](6-5-intrusive-memory.md) (수동적 떠오름 vs 능동적 정리)
