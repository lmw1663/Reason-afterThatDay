-- 018_consent.sql
-- 약관 동의 버전 관리 — A-1
-- 본 마이그레이션은 PIPA 준수를 위해 동의 이력을 사용자별 JSONB로 보관한다.
-- 약관/방침 갱신 시 CONSENT_VERSION을 올려 재동의를 강제할 수 있다.

alter table public.users
  add column if not exists consent_versions jsonb not null default '{}'::jsonb,
  add column if not exists consent_accepted_at timestamptz;

comment on column public.users.consent_versions is
  '약관 버전별 동의 timestamp. 예: {"terms":"v1.0.0","privacy":"v1.0.0","sensitive":"v1.0.0"}';

comment on column public.users.consent_accepted_at is
  '가장 최근 동의 시각. CONSENT_VERSION 갱신 시 null로 리셋되어 재동의 트리거.';
