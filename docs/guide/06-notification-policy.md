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
- Day 7: 최종 확인 알림 1회
- 유예기간 중 일반 알림(리마인더/감정변화) 일시 중지

## 과다 발송 방지
- 하루 최대 1개 원칙
- 알림 피로 지표(클릭률/무응답률/차단율) 기반 튜닝
