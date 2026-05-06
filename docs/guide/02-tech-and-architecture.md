# Tech And Architecture

## 시스템 아키텍처

```mermaid
graph TB
  subgraph Client["클라이언트 (React Native + Expo)"]
    UI[화면 / 컴포넌트]
    NW[NativeWind v4]
    ZS[Zustand Store · 7개]
    RN[Expo Router]
  end

  subgraph Supabase["Supabase"]
    Auth[Auth · 익명 + OAuth]
    DB[Postgres + RLS · 30+ 테이블]
    EF[Edge Functions · 11개]
  end

  subgraph External["외부 서비스"]
    GPT[GPT API\ngpt-4.1-mini · gpt-4o]
    Push[Expo Push / FCM]
  end

  UI --> Auth
  UI --> DB
  UI --> EF
  EF -->|프록시| GPT
  EF --> Push

  style Client fill:#1e293b,stroke:#334155,color:#e2e8f0
  style Supabase fill:#163a2d,stroke:#1a5c42,color:#e2e8f0
  style External fill:#2d1b4e,stroke:#4c2d7a,color:#e2e8f0
```

> **GPT API는 반드시 Edge Function을 통해서만 호출. 클라이언트 직접 호출 금지.**

## 프론트엔드
- React Native + Expo (SDK 54+)
- iOS bare workflow — Expo prebuild 적용 (`ios/` 디렉터리, Podfile, `.xcodeproj` 포함)
- NativeWind v4
- Zustand (7개 스토어: User · Journal · Question · Relationship · Decision · Cooling · **Persona**)
- Expo Router (파일 기반 라우팅)
- expo-notifications
- react-native-chart-kit
- AsyncStorage
- TypeScript strict

## 백엔드
- Supabase (Auth + Postgres + Edge Functions)
- 마이그레이션: 001~031 (현재 적용된 SQL 파일 30+개)
- Edge Functions 11개:
  - AI 응답 6개: `ai-journal-response` · `ai-journal-response-stream` · `ai-comfort` · `ai-daily-quote` · `ai-graduation-letter` · `cooling-checkin-response` · `graduation-farewell-response`
  - 운영 4개: `account-delete` · `persona-reclassify-cron` · `push-cooling-day7` · `push-daily-reminder`
- AI 모델: 기본 `gpt-4.1-mini`, 졸업 편지만 `gpt-4o`
- Push: Expo Push / FCM

## 보안 원칙
- 클라이언트에서 GPT API 직접 호출 금지
- `OPENAI_API_KEY`는 Edge Function 환경변수로만 보관
- 모든 테이블 RLS 필수 (`user_id` 기준)
- DB 변경은 `supabase/migrations/` SQL로 관리
- 처리정지권 (PIPA §37) — `processing_suspension` 토글로 알림·AI 분석 클라/서버 dual gate
