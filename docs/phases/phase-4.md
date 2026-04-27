# Phase 4 — 졸업 / 유예기간 / 푸시 알림 (원문 이관본)

## 4-1. 졸업 트랙

**파일**
- `app/graduation/report.tsx` — 성장 리포트 (차트 포함)
- `app/graduation/letter.tsx` — 나에게 쓰는 편지
- `app/graduation/confirm.tsx` — 후회 확인
- `app/graduation/ritual.tsx` — 기억 방식 선택
- `app/graduation/request.tsx` — 졸업 신청 → 유예 시작
- `components/ui/MoodChart.tsx`

**MoodChart 스니펫**
```tsx
// components/ui/MoodChart.tsx
import { LineChart } from 'react-native-chart-kit';
// mood_score 배열 → 7일 추이 라인 차트
// 색상: teal.400 (#1D9E75)
```

---

## 4-2. 유예기간 시스템

**파일**
- `app/cooling/index.tsx` — 유예 대시보드 (D-N 카운트다운)
- `app/cooling/checkin.tsx` — 자율 체크인
- `app/cooling/final.tsx` — Day 7 최종 확인
- `components/ui/CoolingTimer.tsx`
- `store/useCoolingStore.ts`
- `api/graduation.ts`

**CoolingTimer 스니펫**
```tsx
// components/ui/CoolingTimer.tsx
// cooling_ends_at - now() = 남은 초 → 일 단위 표시
// "졸업까지 D-3"
```

**유예 상태 전환**
```
졸업신청 → status: 'cooling'
  Day 7 알림 수신 후 확정 → status: 'confirmed'
  "아직 아니야" → cooling_ends_at 7일 연장 (리셋)
  "취소" → status: 'cancelled', 앱 복귀
```

**중요 정책**
- `cooling` 상태에서 Day 1~6: 일기 리마인더, 감정변화 알림 **전면 중지**
- Day 7 최종 알림 **1회만** 발송
- reset/cancel 시 `checkin_responses` 데이터 **보존** (졸업 리포트 반영)

---

## 4-3. 푸시 알림

**파일**
- `hooks/usePushNotifications.ts`
- `supabase/functions/push-daily-reminder/index.ts`
- `supabase/functions/push-cooling-day7/index.ts`  ← ⚠️ 이름 변경 (push-cooling-checkin은 Day1/3/5 의미를 남겨 혼선 유발)

**알림 발송 로직 (Edge Function)**
```ts
// push-daily-reminder: pg_cron으로 매일 21:00 KST 실행
// 1. graduation_cooling.status = 'cooling' 인 user_id → 알림 전면 중지 (Day 1~6)
// 2. 그 외 → 3일 미작성이면 독촉 문구, 아니면 기본 리마인더
// 3. expo_push_token으로 Expo Push API 호출

// push-cooling-day7: pg_cron으로 매일 실행
// 1. graduation_cooling 조회: status='cooling' AND cooling_ends_at <= now()
// 2. notifications_sent = 0 인 경우만 발송 (중복 방지)
// 3. 발송 후 notifications_sent = 1 업데이트
// 책임: Day 7 최종 알림 1회 전용 — 체크인 독촉과 혼용 금지
```

**트레이드오프**
- pg_cron vs 외부 크론(Vercel Cron, etc.): Supabase 내 pg_cron이 DB 상태 직접 조회 가능, 외부 의존성 없음 → pg_cron 선택.

