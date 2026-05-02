-- 013_memory_organization.sql
-- 추억 능동 정리 트랙 (Worden Task IV: 재배치).
-- 앱이 사진/메시지에 직접 접근하지 않음 — 가이드 + 체크리스트만 제공.
-- "정리 완료" 체크는 심리적 의식이지 실제 검증이 아님.

CREATE TABLE public.memory_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('photos', 'messages', 'places')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 한 사용자당 카테고리는 단일 row 유지(upsert 키)
CREATE UNIQUE INDEX idx_memory_org_user_category
  ON public.memory_organization(user_id, category);

ALTER TABLE public.memory_organization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_memory_org" ON public.memory_organization
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_memory_org" ON public.memory_organization
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_memory_org" ON public.memory_organization
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_memory_org" ON public.memory_organization
  FOR DELETE USING (auth.uid() = user_id);
