# Phase 5 — 오프라인 / 에러 / 배포 (원문 이관본)

## 5-1. 오프라인 캐시 + 동기화

**접근 방식**  
AsyncStorage에 당일 일기 임시 저장. 네트워크 복구 시 Supabase upsert.

**파일**
- `utils/offlineQueue.ts`

```ts
// AsyncStorage key: 'offline_journal_queue'
// 앱 포그라운드 진입 시 네트워크 상태 확인 후 큐 flush
```

**오프라인 큐 충돌 정책**
```
같은 날(date(created_at)) 일기 중복 작성 시 → "마지막 작성 우선" (last-write-wins)
근거: 이 앱은 실시간 협업 없음, 단일 사용자 단일 기기 전제
구현: journal_entries에 unique(user_id, date(created_at)) 제약 + upsert
      오프라인 큐 flush 시에도 동일 upsert 사용
병합(merge) 정책은 채택하지 않음 — 감정 기록 특성상 마지막 상태가 정답
```

```sql
-- migration 001에 unique 제약 추가
create unique index journal_entries_user_date_idx
  on public.journal_entries (user_id, date(created_at at time zone 'Asia/Seoul'));
```

---

## 5-2. 에러 핸들링 + 로딩 상태

**패턴**
- 모든 async 호출: try/catch + 에러 토스트
- AI 응답: 5초 타임아웃 → fallback 자동 표시
- GPT 실패 시 "잠깐 연결이 안 됐어. 대신 한마디 할게요" + fallback 문구

---

## 5-3. 앱스토어 배포

```bash
eas build --platform ios
eas build --platform android
eas submit
```

**체크리스트**
- [ ] `OPENAI_API_KEY` Edge Function 환경변수 확인
- [ ] 모든 테이블 RLS 활성화 확인
- [ ] 졸업 즉시 확정 로직 없는지 검증
- [ ] "정답이 아니야" 문구 진단/나침반 결과 화면 포함 확인

