# Notification Policy

## 알림 발송 결정 트리

```mermaid
flowchart TD
  Event([이벤트 발생]) --> IsCooling{유예기간 중?}

  IsCooling -->|Yes| IsD7{Day 7?}
  IsD7 -->|Yes| FinalPush[최종 확인 푸시 1회 발송]
  IsD7 -->|No| Suppress[알림 억제\nDay 1~6 무알림]

  IsCooling -->|No| CheckDaily{오늘 이미\n알림 발송?}
  CheckDaily -->|Yes| Skip[발송 안 함\n하루 최대 1개 원칙]
  CheckDaily -->|No| Type{이벤트 유형}

  Type -->|저녁 9시| Reminder[일기 리마인더]
  Type -->|3일 미작성| Nudge[미작성 독촉 1회]
  Type -->|방향 급변| Change[감정 변화 알림 1회]

  FinalPush --> Monitor[클릭률 · 무응답률 · 차단율 기록]
  Reminder --> Monitor
  Nudge --> Monitor
  Change --> Monitor
```

## 기본 알림
- 일기 리마인더: 매일 저녁 9시 (사용자 설정 가능)
- 미작성 독촉: 3일 미작성 시 1회
- 감정 큰 변화: 방향 급변 시 1회

## 유예기간 알림 (중요)
- Day 1~6: 알림 없음
- Day 7: 최종 확인 알림 1회 (`push-cooling-day7` Edge Function이 09:00 UTC cron으로 처리)
- 유예기간 중 일반 알림(리마인더/감정변화) 전면 중지

## 유예 중 예외: C-SSRS 양성 사용자 (B-1)
- 유예 신청 시점 또는 유예 기간 중 C-SSRS urgent/high 양성 감지 시:
  - 일반 알림 차단은 유지
  - 24시간마다 안부 재확인 푸시 1회 발송 (Day 1~7 전체)
  - 무응답·거부 시 `/safety/release` 자동 안내 (24h 경과 + 4문항 통과 필수)
- 핫라인 정보는 `resources/crisis-hotlines.json`에서만 로드 (하드코딩 금지)

## 위기 신호 재감지 (유예와 무관하게 항시)
- 3일 연속 mood_score 1~2점 또는 새벽(00:00~04:59) 진입 감지 시:
  - `EmotionalCheckModal` 표시 (이전 표시와 3일 침묵 윈도우로 중복 방지)
  - 페르소나별 우선 핫라인 매핑 적용
  - C-SSRS 양성 시 결정 트랙 자동 잠금

## 페르소나별 알림 차단
- 불안형(P03)·헌신 소진(P09) 사용자: 새벽 푸시 차단 (`hooks/usePushNotifications.ts`)

## 과다 발송 방지
- 하루 최대 1개 원칙
- 알림 피로 지표(클릭률/무응답률/차단율) 기반 튜닝
