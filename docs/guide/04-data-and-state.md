# Data And State

## 상태 레이어 구조

```mermaid
graph TD
  subgraph Zustand["Zustand (클라이언트 상태)"]
    US[useUserStore\n이별날짜 · D+N · 온보딩 · 푸시토큰]
    JS[useJournalStore\n오늘일기 · 목록 · 통계]
    QS[useQuestionStore\n질문풀 · 응답 · 맥락필터]
    RS[useRelationshipStore\n장단점 · 이유 · 변화이력]
    DS[useDecisionStore\n방향변화이력]
    CS[useCoolingStore\n유예상태 · 체크인기록]
  end

  subgraph DB["Supabase Postgres (RLS 필수)"]
    JE[(journal_entries)]
    QR[(question_responses)]
    RP[(relationship_profile)]
    DH[(decision_history)]
    GC[(graduation_cooling)]
    QP[(question_pool)]
  end

  JS <--> JE
  QS <--> QR
  RS <--> RP
  DS <--> DH
  CS <--> GC
  QS <--> QP
```

## DB 정합성 규칙

```mermaid
flowchart LR
  A[question_responses 저장] --> B{"(user_id, question_id)\nunique 체크"}
  B -->|중복| C[upsert — 기존 행 업데이트]
  B -->|신규| D[insert]
  C --> E[완료]
  D --> E
```

## 핵심 저장소 (Zustand)
- `useUserStore`: 이별 날짜, D+N, 온보딩, 푸시 토큰
- `useJournalStore`: 오늘 일기, 목록, 통계
- `useQuestionStore`: 질문 풀, 응답, 맥락 필터
- `useRelationshipStore`: 장점/단점/이유 누적, 변화 이력
- `useDecisionStore`: 방향 변화 이력
- `useCoolingStore`: 유예 상태, 체크인 기록

## DB 핵심 테이블
- `journal_entries`
- `question_responses`
- `relationship_profile`
- `decision_history`
- `graduation_cooling`
- `question_pool`

## 정합성 필수 규칙
- `question_responses`: `(user_id, question_id)` unique + upsert
- direction/status enum 전역 통일
- 유예 리셋/취소 시 체크인 데이터 보존 정책 명시
