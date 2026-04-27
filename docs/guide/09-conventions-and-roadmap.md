# Conventions And Roadmap

## 파일 네이밍
- 화면: PascalCase (`HomeScreen.tsx`)
- 컴포넌트: PascalCase (`InsightCard.tsx`)
- 훅: `use` prefix camelCase (`useSmartQuestion.ts`)
- API: camelCase (`journal.ts`)
- Edge Functions: kebab-case 폴더

## 개발 순서
- Phase 0: 인프라/DB/디자인 시스템
- Phase 1: 온보딩/홈/일기/Auth
- Phase 2: 질문 풀/관계 분석/나침반
- Phase 3: GPT Edge Function/AI 응답
- Phase 4: 졸업/유예/푸시
- Phase 5: 오프라인/에러/배포

## 비가역 원칙
- API 키 클라이언트 노출 금지
- 졸업 즉시 확정 금지 (7일 유예 필수)
- 방향 변화 비난 금지
- D+N 전역 표시 유지

