-- 019_oauth.sql
-- OAuth 프로바이더 정보 — A-2
-- 한국 한정 출시. Google·Apple·Kakao 3종.
-- 익명 가입(supabase.auth.signInAnonymously)으로 시작한 사용자가 OAuth로 전환할 때
-- 동일 user.id를 유지하기 위해 provider/provider_user_id를 별도 컬럼으로 둔다.

alter table public.users
  add column if not exists provider text check (provider in ('google','apple','kakao','anonymous')) default 'anonymous',
  add column if not exists provider_user_id text;

create unique index if not exists users_provider_id_unique
  on public.users(provider, provider_user_id)
  where provider is not null and provider_user_id is not null and provider <> 'anonymous';

comment on column public.users.provider is
  'OAuth 프로바이더 — anonymous|google|apple|kakao. 익명 가입 후 OAuth 전환 시 갱신.';
comment on column public.users.provider_user_id is
  '프로바이더의 사용자 식별자(sub). 동일 사용자 식별·중복 가입 방지용.';
