# Reason · 그날 이후

이별을 겪은 사람이 **재결합·헤어짐 결정을 충동이 아닌 데이터로** 내리고, 결정 후의 회복까지 동행하는 React Native + Supabase 앱.

핵심 자산 4가지:
1. **D+N (이별 경과일)** — 모든 화면·정책·프롬프트의 시간 축
2. **20개 페르소나 (P01~P20, P13 결번)** — 사용자 유형별로 화면·질문·톤이 분기
3. **3트랙 결정 지원** — 일기(감정 추적) / 관계 분석(이별 이유) / 나침반(잡기 vs 보내기 판정)
4. **졸업 + 7일 유예** — 결정 확정을 강제로 지연시켜 후회 방지

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버
npx expo start --ios          # iOS 시뮬레이터
npx expo start --android      # Android 에뮬레이터

# 검증
npx tsc --noEmit              # 타입 체크
npm run lint:persona          # 페르소나 라벨 비노출 lint
npx vitest                    # 단위 테스트
```

## 신규 개발자 진입점

| 목적 | 문서 |
|---|---|
| 단계별 학습 가이드 (Phase 1~6, 사용자 플로우, E2E 트레이스) | [`STUDY_GUIDE.md`](./STUDY_GUIDE.md) |
| 폴더·파일별 1줄 인덱스 | [`FILE_STRUCTURE.md`](./FILE_STRUCTURE.md) |
| 절대 규칙 14개 + 아키텍처 + 컨벤션 | [`CLAUDE.md`](./CLAUDE.md) |
| 진행 상황 및 할 일 | [`TODO.md`](./TODO.md) |

## 기술 스택

- **프론트엔드**: Expo SDK 54+, React Native, NativeWind v4, Zustand, Expo Router, TypeScript strict
- **백엔드**: Supabase (Auth + Postgres + Edge Functions), GPT는 Edge Function 프록시로만
- **iOS**: bare workflow (Expo prebuild 적용, `ios/` 디렉터리 포함)
- **AI 모델**: 기본 `gpt-4.1-mini`, 졸업 편지만 `gpt-4o`

## 절대 규칙 (위반 불가)

코드 만지기 전에 반드시 [`CLAUDE.md`](./CLAUDE.md)의 절대 규칙 14개를 확인. 핵심:
- 채팅 UI 금지 — 화면 전환형 UX만
- GPT는 Edge Function에서만, 클라 직접 호출 금지
- 모든 테이블 RLS 필수 (`user_id` 기준)
- 졸업 즉시 확정 금지 — 7일 유예 필수
- 페르소나 코드(P01~P20)·진단명 어휘 사용자 노출 금지 (`npm run lint:persona`로 강제)

## 라이선스

Apache License 2.0
