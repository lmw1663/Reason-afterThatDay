# 배포 체크리스트

## Supabase 설정

- [ ] `OPENAI_API_KEY` Edge Function 환경변수 설정
  ```
  supabase secrets set OPENAI_API_KEY=sk-...
  ```
- [ ] 모든 마이그레이션 실행 (`001 ~ 004`)
  ```bash
  supabase db push
  ```
- [ ] 모든 테이블 RLS 활성화 + WITH CHECK 확인
- [ ] Edge Functions 배포 (6개)
  ```bash
  supabase functions deploy ai-journal-response
  supabase functions deploy ai-journal-response-stream
  supabase functions deploy ai-daily-quote
  supabase functions deploy ai-comfort
  supabase functions deploy ai-graduation-letter
  supabase functions deploy push-daily-reminder
  supabase functions deploy push-cooling-day7
  ```
- [ ] pg_cron 확장 활성화 → `004_pg_cron_setup.sql` 실행
- [ ] Supabase Auth → Google Provider 활성화 (Google OAuth 클라이언트 ID/Secret)

## 앱 설정

- [ ] `.env` 파일 생성 (`.env.example` 참고)
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```
- [ ] `app.json` → `ios.bundleIdentifier`, `android.package` 확인
- [ ] `assets/notification-icon.png` (96x96 PNG) 추가

## 절대 규칙 최종 검증

- [ ] 채팅 UI 없음 — 화면 전환형 질문 UX만 존재
- [ ] `OPENAI_API_KEY` 클라이언트 번들에 없음 (`process.env.EXPO_PUBLIC_*`에 없음)
- [ ] 졸업 즉시 확정 로직 없음 — `graduation_cooling` 생성 후 7일 대기
- [ ] 진단/나침반 결과 화면에 "정답이 아니야" 문구 포함 (`analysis/result.tsx`, `compass/needle.tsx`)
- [ ] 유예 중 Day 1~6 일반 알림 중지 확인 (`push-daily-reminder`)
- [ ] Day 7 알림 `notifications_sent` 중복 방지 확인
- [ ] D+N 항상 표시 (`HomeScreen`)

## EAS 빌드

```bash
# EAS CLI 설치
npm install -g eas-cli
eas login

# iOS 빌드
eas build --platform ios --profile production

# Android 빌드
eas build --platform android --profile production

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

## eas.json 참고 구조

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```
