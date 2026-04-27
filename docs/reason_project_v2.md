# reason — 그날 이후 (v2)
> 헤어진 연인 마음 정리 앱 · 전체 기획 및 설계 문서

---

## 1. 프로젝트 개요

### 앱 이름
**reason — 그날 이후**

### 핵심 철학
> "이 앱을 지우는 날이 진짜 졸업하는 날이야."

사용자가 이별을 정리하고 앱을 떠나는 것 자체가 성공.
단, 이혼 유예기간처럼 졸업에도 냉각기를 둔다.

### 문제 정의
- 이별 직후 감정적 혼란 속에서 혼자 정리하려니 시간이 오래 걸림
- 감정은 계속 바뀜 — 잡고 싶었다가 보내고 싶었다가 반복
- 정리되지 않은 감정이 취업·일상 등 현실 집중을 방해
- 기존 설계의 한계: 트랙이 분리되어 있어서 질문이 유기적으로 연결되지 않음

### 앱이 하는 것
```
매일의 감정 기록 (이별 일기)
    ↕ 유기적 연결
공유 질문 풀 (장점/단점/이유/후회 등 복합적)
    ↕ 시간에 따른 변화 추적
결정 지원 (잡기/보내기/유보)
    ↕ 냉각 유예기간
졸업 (앱 삭제 or 다음)
```

---

## 2. 사용자 페르소나

| 항목 | 내용 |
|------|------|
| 나이 | 27세 |
| 직업 | 백수 (취업 준비 중) |
| 성별 | 남성 |
| 상태 | 이별 직후 / 감정적으로 힘듦 |
| 습관 | 인스타그램·유튜브 자주 봄 |
| 고민 | 이별 때문에 취업 준비에 집중 못 하고 있음 |
| 필요 | 감정 정리 + 현실로 돌아갈 동력 |
| 행동 패턴 | 마음이 계속 바뀜 — 잡고 싶다가 보내고 싶다가 반복 |

---

## 3. 아키텍처

### 왜 백엔드가 필요한가
1. **GPT API 프록시** — API 키를 클라이언트에 노출하면 안 됨
2. **푸시 알림** — 졸업 유예기간 알림, 일기 리마인더
3. **감정 변화 추적** — 시간에 따른 데이터 분석은 서버에서
4. **공유 질문 풀 관리** — 질문 추가/수정을 앱 업데이트 없이
5. **AI 응답 캐싱** — 같은 맥락 반복 호출 방지 (비용 절감)

### 시스템 구성

```
┌─────────────────────────────────────────────────┐
│                   클라이언트                      │
│           React Native + Expo                    │
│     (AsyncStorage: 오프라인 캐시 + 임시 저장)      │
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│                  백엔드 서버                       │
│              Supabase (BaaS)                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Database │  │ Edge Functions│   │
│  │ (회원)   │  │ (Postgres)│  │ (서버리스)    │   │
│  └──────────┘  └──────────┘  └──────┬───────┘   │
│                                      │           │
│                              ┌───────▼───────┐   │
│                              │ GPT API       │   │
│                              │ 프록시        │   │
│                              └───────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Push Notifications (Expo Push / FCM)    │    │
│  │  졸업 유예기간 알림 / 일기 리마인더        │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### DB 스키마 (Supabase Postgres)

```sql
-- 사용자
users (
  id uuid PK,
  created_at timestamp,
  breakup_date date,           -- 이별 날짜
  onboarding_completed boolean,
  graduation_requested_at timestamp NULL,  -- 졸업 신청일
  graduation_confirmed_at timestamp NULL,  -- 졸업 확정일 (유예 후)
  push_token text NULL
)

-- 이별 일기 (핵심 테이블)
journal_entries (
  id uuid PK,
  user_id uuid FK → users,
  created_at timestamp,
  mood_score int (1~10),        -- 오늘 감정 온도
  mood_label text,              -- 선택한 감정 (보고싶어, 화나, 멍해...)
  direction text,               -- 잡고싶다 / 보내고싶다 / 모르겠다
  free_text text NULL,          -- 자유 서술
  ai_response text NULL         -- AI 공감 응답
)

-- 공유 질문 풀 응답 (유기적 질문)
question_responses (
  id uuid PK,
  user_id uuid FK → users,
  question_id text,             -- 질문 식별자
  response_type text,           -- pill_select / free_text / slider / choice
  response_value jsonb,         -- 유연한 응답 저장
  created_at timestamp,
  updated_at timestamp          -- 답변 변경 추적
)

-- 관계 프로필 (누적 데이터)
relationship_profile (
  id uuid PK,
  user_id uuid FK → users,
  pros jsonb,                   -- 장점 목록 [{text, source_question, added_at}]
  cons jsonb,                   -- 단점 목록
  breakup_reasons jsonb,        -- 헤어진 이유 목록
  partner_traits jsonb,         -- 상대 특성
  my_role_reflection jsonb,     -- 나의 역할 성찰
  updated_at timestamp
)

-- 결정 이력 (시간 따른 변화)
decision_history (
  id uuid PK,
  user_id uuid FK → users,
  created_at timestamp,
  direction text,               -- catch / let_go / undecided
  confidence int (1~10),        -- 확신도
  reasoning text NULL,          -- 이유
  compass_data jsonb            -- 나침반 결과 스냅샷
)

-- 졸업 유예기간
graduation_cooling (
  id uuid PK,
  user_id uuid FK → users,
  requested_at timestamp,
  cooling_ends_at timestamp,    -- requested_at + 7일
  status text,                  -- cooling / confirmed / cancelled
  checkin_responses jsonb,      -- 유예기간 중 체크인 응답
  notifications_sent int DEFAULT 0
)

-- 공유 질문 풀 (서버 관리, 앱 업데이트 없이 추가 가능)
question_pool (
  id text PK,                   -- 예: "pros_comfort", "cons_communication"
  category text,                -- pros / cons / reason / regret / lesson / future
  text_ko text,                 -- 질문 한국어
  context text[],               -- 어떤 맥락에서 노출: [analysis, compass, journal, graduation]
  display_type text,            -- pill / free_text / slider / choice
  options jsonb NULL,           -- pill/choice일 때 선택지
  order_weight int,
  is_active boolean DEFAULT true
)
```

---

## 4. 핵심 변경: 공유 질문 풀 시스템

### 기존 문제
트랙(관계 분석/결정 나침반/졸업)이 각각 독립적이라 같은 질문을 다른 맥락에서 묻지 못했음

### 새 구조: 질문이 맥락을 넘나든다

하나의 질문 풀이 있고, 각 화면은 맥락에 맞는 질문을 꺼내 쓴다.
사용자가 한 곳에서 답한 내용은 다른 곳에서도 반영된다.

```
질문 풀 예시
────────────────────────────────────────────────────
id                  | 질문                           | 노출 맥락
────────────────────────────────────────────────────
pros_comfort        | 같이 있으면 편했어              | 분석, 나침반, 졸업
pros_laugh          | 많이 웃었어                    | 분석, 나침반, 졸업
cons_communication  | 대화가 줄었어                   | 분석, 나침반, 일기
cons_effort         | 나만 노력하는 느낌               | 분석, 나침반, 일기
reason_values       | 서로 원하는 게 달랐어            | 분석, 나침반
why_stay_change     | 달라질 수 있다고 믿어            | 나침반, 일기
why_stay_love       | 아직 사랑하니까                  | 나침반, 일기
why_leave_tired     | 이미 지쳤어                     | 나침반, 일기
why_leave_growth    | 혼자 성장하고 싶어               | 나침반, 졸업
regret_best         | 최선을 다했어                   | 졸업, 일기
regret_unsaid       | 하지 못한 말이 있어              | 졸업, 일기
lesson_express      | 감정 표현의 중요함               | 졸업, 리포트
future_alone_ok     | 혼자여도 괜찮다는 것             | 졸업, 리포트
────────────────────────────────────────────────────
```

### 복합 질문 흐름 예시

**관계 분석에서:**
"왜 헤어졌어?" → 사용자가 "대화가 줄었어" 선택

**결정 나침반에서 (같은 데이터 활용):**
"대화가 줄었던 게 해결될 수 있을 것 같아?" → 새 질문 추가

**일기에서 (3일 후):**
"그때 대화가 줄었다고 했잖아. 지금도 그게 가장 큰 이유야?"
→ 답이 바뀌면 관계 프로필 자동 업데이트

**졸업에서:**
"처음에 대화 부족이 이유라고 했는데, 지금 돌아보면 어때?"
→ 시간에 따른 인식 변화 보여줌

---

## 5. 이별 일기 시스템

### 왜 필요한가
감정은 매일 바뀐다. 오늘 잡고 싶다가 내일 보내고 싶다가 반복.
이걸 기록하면 패턴이 보이고, 그 패턴이 정리를 돕는다.

### 일기 구성 (매일 또는 수시로)

#### 화면 1: 오늘의 감정 온도
- 슬라이더 (1~10)
- 감정 뱃지 멀티 선택: 보고싶어 / 화나 / 멍해 / 그리워 / 괜찮아 / 슬퍼 / 후회돼

#### 화면 2: 오늘의 방향
- 잡고 싶다 / 보내고 싶다 / 모르겠다
- (이전 선택과 비교: "어제는 잡고 싶다고 했는데, 오늘은?")

#### 화면 3: 오늘의 생각 (공유 질문 풀에서 맥락형 질문)
- 상황에 맞는 질문 1~2개 자동 추천
  예: 방향이 바뀌었으면 → "뭐가 마음을 바꿨어?"
  예: 3일 연속 같은 방향이면 → "이 마음이 꽤 단단해 보여. 왜 그런 것 같아?"
- 자유 텍스트 입력

#### 화면 4: AI 공감 응답
- 오늘 입력한 내용 + 최근 일기 맥락을 바탕으로 GPT가 2~3문장 응답
- "오늘 감정 온도가 어제보다 내려갔네. 정리가 조금씩 되고 있는 것 같아."

### 일기 데이터 활용
```
일기 기록 축적
    ↓
감정 변화 그래프 (온도 추이, 방향 변화 타임라인)
    ↓
관계 프로필 자동 업데이트 (새 장점/단점 추가되면 반영)
    ↓
결정 나침반 재진입 시 "지난 7일간 감정 변화" 표시
    ↓
졸업 리포트에 "처음 → 지금" 변화 요약
```

### 일기 리마인더 알림
- 기본: 매일 저녁 9시 "오늘 하루 어땠어?"
- 3일 이상 미작성 시: "요즘 어떻게 지내? 잠깐이라도 들러."
- 사용자가 알림 시간/빈도 조절 가능

---

## 6. 졸업 유예기간 (냉각기) 시스템

### 왜 필요한가
이별을 받아들이고 졸업했는데 생각이 바뀔 수 있다.
감정적으로 "졸업!"했다가 다음 날 후회하면 안 된다.
이혼처럼 유예기간을 두고 정말 괜찮은지 확인한다.

### 플로우

```
졸업 화면에서 "졸업하기" 누름
    ↓
유예기간 안내: "7일의 냉각기가 시작돼. 정말 괜찮은지 확인할게."
    ↓
Day 1~6: 푸시 알림 없음 (계속 떠올리게 하지 않기 위한 무알림 정책)
    → 사용자가 원할 때만 자율 체크인 가능
    ↓
Day 7: 알림 — "7일이 지났어. 준비됐어?" (최종 알림 1회)
    → 최종 졸업 확인 화면
        ├── "네, 졸업할게" → 졸업 확정 + 삭제 안내
        ├── "아직 아니야" → 유예기간 리셋 (7일 재시작)
        └── "졸업 취소" → 앱으로 완전 복귀
```

### 유예기간 중 체크인 화면
```
화면 1: "졸업 D-N"
"졸업까지 N일 남았어. 오늘 기분은?"
감정 온도 슬라이더 (1~10)

화면 2: "마음이 바뀌진 않았어?"
- 졸업 의지 그대로야
- 좀 흔들려
- 다시 돌아가고 싶어

(흔들리거나 돌아가고 싶으면)
→ "괜찮아. 돌아가는 것도 용기야." + 앱 복귀 버튼
```

### 유예기간 후 졸업 확정
- 최종 졸업 편지 (유예기간 체크인 데이터 반영)
- "7일 동안 확인했어. 정말 괜찮은 것 같아."
- 삭제 안내 or 다음 앱 연결

---

## 7. 전체 유저 플로우 (v2)

```
앱 첫 실행
    ↓
온보딩 (이별 날짜 + 감정 + 간단 상황)
    ↓
홈 — 그날 이후 D+N
├── 오늘의 한마디
├── 이별 일기 (매일 진입점) ← 핵심
├── 관계 분석 (공유 질문 풀 기반)
├── 결정 나침반 (관계 분석 데이터 이어받음)
├── 추억 회상
└── 나의 성장 리포트
    ↓
졸업 신청
    ↓
유예기간 7일 (Day 1~6 무알림 + 자율 체크인, Day 7 최종 알림 1회)
    ↓
졸업 확정
├── 앱 삭제
└── 다음 여정
```

---

## 8. 화면별 상세 설계

### 8-1. 온보딩
- 이별한 날짜 입력 (달력 UI)
- 지금 기분 선택 (멀티): 많이 힘들어요 / 멍한 느낌 / 화가 나요 / 그리워요
- CTA: "시작하기"

### 8-2. 홈
- 상단: 앱 이름 + D+N 배지
- 오늘의 한마디 카드
- **이별 일기 CTA** (가장 눈에 띄게)
  - 미작성: "오늘 아직 안 들렀어. 잠깐 들를래?"
  - 작성 완료: "오늘 기록 완료 ✓" + 감정 온도 표시
- 4개 메뉴 (관계 분석 / 결정 나침반 / 추억 회상 / 성장 리포트)

### 8-3. 이별 일기 (매일 핵심 루틴)
위 5장 참고. 화면 4개 흐름.

### 8-4. 관계 분석 트랙

공유 질문 풀에서 category가 pros/cons/reason인 질문을 꺼내 구성.
이전에 답한 내용은 미리 채워져 있고, 변경 가능.

#### Step 1 — 헤어진 이유 (복합)
질문 풀에서 reason 카테고리 질문 표시
이미 일기에서 답한 게 있으면 자동 반영

#### Step 2 — 장점과 단점 (동시에)
한 화면에서 장점/단점 탭 전환으로 양쪽 모두 입력
pill 선택 + 자유 입력
→ relationship_profile에 누적

#### Step 3 — 왜 만나야 하는지 / 왜 안 만나야 하는지 (양쪽 동시)
"잡아야 하는 이유"와 "보내야 하는 이유"를 같은 화면에서
→ 한쪽만 많으면 자연스럽게 방향이 보임

#### Step 4 — 내 역할 + 상대 마음 (통합)
나의 역할 / 상대의 마음 / 극복 가능성을 하나의 흐름으로

#### Step 5 — 가망 진단 결과
미터 3개 + 인사이트 + "결정 나침반으로" CTA
이전 일기 데이터와 연계:
"최근 일기를 보면 감정 온도가 조금씩 내려가고 있어."

### 8-5. 결정 나침반 트랙

관계 분석 결과 + 일기 데이터를 이어받아 시작

#### Step 0 — 데이터 요약
"지금까지 파악한 내용" 카드
- 관계 분석: 장점 N개, 단점 N개, 가망 N%
- 일기: 최근 7일 감정 추이, 방향 변화
- 이미 답한 질문에서 핵심 포인트

#### Step 1 — 솔직한 마음 (+ 변화 추적)
"지금 이 순간 원하는 게 뭐야?"
이전 선택이 있으면: "저번에는 [잡고 싶다]고 했는데, 지금은?"

#### Step 2 — 공유 질문 기반 이성적 체크
why_stay / why_leave 카테고리에서 아직 안 답한 질문 추출
이미 답한 건 보여주고, 마음이 바뀌면 수정 가능

#### Step 3 — 시나리오 (기존 유지)
#### Step 4 — 나침반 결과 (기존 유지 + 일기 연계)
#### Step 5 — 행동 제안 (기존 유지)

### 8-6. 추억 회상 트랙
- 추억 타임라인 입력
- 그때 좋았던 것 / 아쉬웠던 것
- 배운 점 찾기
- 후회 없이 보내기 의식

### 8-7. 졸업 트랙

#### Step 1 — 성장 리포트 (일기 데이터 기반)
- 통계: 버텨낸 날, 일기 횟수, 감정 변화, 결정 변화
- 감정 온도 추이 그래프
- 방향 변화 타임라인 (잡기↔보내기 몇 번 바뀌었는지)
- 처음 vs 지금 비교: "처음에는 [보고싶어]였는데, 지금은 [괜찮아졌어]"
- 공유 질문에서 배운 것 요약

#### Step 2 — 나에게 쓰는 편지 (기존 유지)
#### Step 3 — 후회 확인 (공유 질문 풀 regret 카테고리)
#### Step 4 — 기억 방식 선택 (기존 유지)
#### Step 5 — 졸업 신청 → 유예기간 시작

---

## 9. API 설계

### 인증
```
POST /auth/signup          - 익명 가입 (Supabase Auth)
POST /auth/login           - 로그인
```

### 사용자
```
GET    /user/profile       - 프로필 조회 (이별 날짜, D+N)
PUT    /user/profile       - 프로필 수정
PUT    /user/push-token    - 푸시 토큰 등록
```

### 이별 일기
```
POST   /journal            - 일기 작성
GET    /journal            - 일기 목록 (페이지네이션)
GET    /journal/today      - 오늘 일기 조회
GET    /journal/stats      - 통계 (감정 추이, 방향 변화)
GET    /journal/:id        - 특정 일기 상세
```

### 공유 질문 풀
```
GET    /questions?context=analysis    - 맥락별 질문 목록
GET    /questions/responses           - 내 응답 전체
POST   /questions/respond             - 질문 응답
PUT    /questions/respond/:id         - 응답 수정 (변화 추적)
```

### 관계 프로필
```
GET    /relationship/profile          - 누적 프로필
GET    /relationship/changes          - 시간에 따른 변화 이력
```

### 결정
```
POST   /decision                      - 결정 기록
GET    /decision/history              - 결정 이력
GET    /decision/latest               - 최신 결정
```

### AI 응답 (GPT 프록시)
```
POST   /ai/comfort         - 감정 위로 응답 생성
POST   /ai/daily-quote     - 오늘의 한마디
POST   /ai/graduation-letter - 졸업 편지 생성
POST   /ai/journal-response  - 일기에 대한 AI 응답
```

### 졸업
```
POST   /graduation/request           - 졸업 신청 (유예기간 시작)
GET    /graduation/status             - 현재 상태
POST   /graduation/checkin            - 유예기간 체크인
POST   /graduation/confirm            - 졸업 확정
POST   /graduation/cancel             - 졸업 취소 (복귀)
```

---

## 10. 알림 시스템

### 알림 종류

| 종류 | 시점 | 내용 |
|------|------|------|
| 일기 리마인더 | 매일 저녁 9시 (설정 가능) | "오늘 하루 어땠어? 잠깐 들러." |
| 미작성 독촉 | 3일 미작성 시 | "요즘 어떻게 지내? 잠깐이라도." |
| 유예 Day 7 (최종 1회) | 졸업 신청 +7일 | "7일이 지났어. 준비됐어?" |
| 감정 변화 | 3일 연속 같은 방향 | "마음이 꽤 단단해 보여. 어떻게 생각해?" |
| 큰 변화 | 방향이 급변했을 때 | "마음이 바뀐 것 같아. 괜찮아?" |

※ 유예기간 Day 1~6에는 사용자의 감정 자극 최소화를 위해 모든 일반 알림(리마인더/감정 변화)을 중지하고, Day 7 최종 알림만 발송한다.

### 알림 기술 스택
- Expo Push Notifications (개발/테스트)
- Firebase Cloud Messaging (프로덕션)
- 서버 크론잡: Supabase Edge Functions + pg_cron

---

## 11. 디자인 시스템

### 컬러 팔레트

| 이름 | 주 색상 | 용도 |
|------|---------|------|
| Purple | #534AB7 | Primary, 관계 분석, 메인 액센트 |
| Teal | #1D9E75 | 긍정/성장, 감정 위로, 잡기 방향 |
| Coral | #993C1D | 경고/주의, 힘든 감정 |
| Pink | #D4537E | 감정 정리 필요, 보내기 방향 |
| Amber | #BA7517 | 판단 보류, 추억, 갈등 |
| Gray | #888780 | 중립, 보조, 미결정 |

### 컬러 상세
```
Purple: 50:#EEEDFE / 400:#7F77DD / 600:#534AB7 / 800:#3C3489
Teal:   50:#E1F5EE / 400:#1D9E75 / 600:#0F6E56 / 800:#085041
Coral:  50:#FAECE7 / 400:#D85A30 / 600:#993C1D / 800:#712B13
Pink:   50:#FBEAF0 / 400:#D4537E / 600:#993556 / 800:#72243E
Amber:  50:#FAEEDA / 400:#BA7517 / 600:#854F0B / 800:#633806
Gray:   50:#F1EFE8 / 400:#888780 / 600:#5F5E5A / 800:#444441
```

### 타이포그래피
- 큰 질문: 20~22px / weight 500
- 본문: 14px / weight 400
- 보조: 13px / color secondary
- 레이블: 11px / weight 500 / letter-spacing 0.5px

### 컴포넌트 (기존 유지)
InsightCard / ChoiceButton / Pill / MeterBar / ProgressDots / PrimaryButton / Compass

### 추가 컴포넌트
- **MoodSlider** — 감정 온도 1~10 슬라이더
- **DirectionPicker** — 잡기/보내기/모름 3버튼 (이전 선택 표시)
- **ChangeIndicator** — "어제: 잡고싶다 → 오늘: 보내고싶다" 변화 표시
- **MoodChart** — 감정 온도 추이 라인 차트 (일기 데이터)
- **CoolingTimer** — 졸업 유예기간 카운트다운

---

## 12. UX 핵심 원칙

### 반응형 화면 전환 (채팅 UI 금지)
기존과 동일

### 말투 원칙
기존과 동일

### 유기적 연결 원칙 (NEW)
- 한 곳에서 답한 내용은 다른 곳에서도 보인다
- 이전에 답한 게 있으면 "저번에 이렇게 말했는데" 프레임
- 답이 바뀌면 변화를 자연스럽게 언급: "마음이 바뀐 것 같아"
- 모든 질문은 공유 질문 풀에서 나오고, 맥락에 따라 재사용

### 시간 기반 변화 추적 (NEW)
- 일기 데이터가 쌓이면 패턴이 보인다
- "최근 3일간 감정이 내려가고 있어" 같은 인사이트
- 결정이 바뀔 때마다 기록하고, 졸업 리포트에서 변화 전체 보여줌

### 졸업 유예 원칙 (NEW)
- 즉시 졸업 불가. 반드시 7일 냉각기
- 유예기간 중 체크인으로 정말 괜찮은지 확인
- 흔들리면 편하게 복귀 가능 (절대 비난하지 않음)
- "돌아가는 것도 용기야"

---

## 13. 기술 스택 (v2)

### 프론트엔드
```
React Native + Expo (SDK 51+)
NativeWind v4 (Tailwind CSS)
Zustand (상태관리)
React Navigation v6 (Stack + Tab)
expo-notifications (푸시 알림)
react-native-chart-kit (감정 추이 차트)
AsyncStorage (오프라인 캐시)
TypeScript strict
```

### 백엔드
```
Supabase (BaaS)
├── Auth (익명 가입)
├── Database (PostgreSQL)
├── Edge Functions (Deno)
│   ├── GPT API 프록시
│   ├── 일기 AI 응답 생성
│   └── 졸업 유예 크론잡
├── Realtime (실시간 동기화, 추후)
└── Storage (추후 이미지 업로드)
```

### AI
```
OpenAI GPT API (gpt-4.1-mini)
├── 감정 위로 응답
├── 일기 AI 응답 (맥락 반영)
├── 오늘의 한마디
└── 졸업 편지 개인화
```

### 인프라
```
Expo EAS Build (앱 빌드)
Expo Push Notifications → FCM/APNS
Supabase 호스팅 (DB + Functions)
```

---

## 14. 폴더 구조 (v2)

```
reason/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # 홈
│   │   └── report.tsx             # 성장 리포트
│   ├── onboarding/
│   │   └── index.tsx
│   ├── journal/                   # 이별 일기 ← NEW
│   │   ├── index.tsx              # 오늘 일기 작성
│   │   ├── history.tsx            # 일기 목록
│   │   └── detail.tsx             # 특정 일기 상세
│   ├── analysis/                  # 관계 분석
│   │   ├── index.tsx              # 통합 분석 (공유 질문 기반)
│   │   ├── pros-cons.tsx          # 장단점 동시 입력
│   │   ├── stay-leave.tsx         # 만나야/안만나야 동시
│   │   ├── role-partner.tsx       # 내역할+상대마음 통합
│   │   └── result.tsx             # 가망 진단
│   ├── compass/                   # 결정 나침반
│   │   ├── index.tsx              # 데이터 요약
│   │   ├── want.tsx               # 솔직한 마음 (변화 추적)
│   │   ├── check.tsx              # 공유 질문 기반 체크
│   │   ├── scenario.tsx
│   │   ├── needle.tsx
│   │   └── action.tsx
│   ├── memory/                    # 추억 회상
│   ├── graduation/                # 졸업
│   │   ├── report.tsx             # 일기 기반 성장 리포트
│   │   ├── letter.tsx
│   │   ├── confirm.tsx
│   │   ├── ritual.tsx
│   │   └── request.tsx            # 졸업 신청 → 유예 시작
│   └── cooling/                   # 유예기간 ← NEW
│       ├── index.tsx              # 유예 상태 대시보드
│       ├── checkin.tsx            # 체크인
│       └── final.tsx              # 최종 확정
├── components/
│   ├── ui/
│   │   ├── ChoiceButton.tsx
│   │   ├── Pill.tsx
│   │   ├── InsightCard.tsx
│   │   ├── MeterBar.tsx
│   │   ├── ProgressDots.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── Compass.tsx
│   │   ├── MoodSlider.tsx         # NEW
│   │   ├── DirectionPicker.tsx    # NEW
│   │   ├── ChangeIndicator.tsx    # NEW
│   │   ├── MoodChart.tsx          # NEW
│   │   └── CoolingTimer.tsx       # NEW
│   └── layout/
│       ├── ScreenWrapper.tsx
│       └── StepLabel.tsx
├── store/
│   ├── useUserStore.ts
│   ├── useJournalStore.ts         # NEW
│   ├── useQuestionStore.ts        # NEW (공유 질문)
│   ├── useRelationshipStore.ts    # NEW (관계 프로필)
│   ├── useDecisionStore.ts        # NEW (결정 이력)
│   └── useCoolingStore.ts         # NEW (유예기간)
├── api/
│   ├── supabase.ts                # Supabase 클라이언트
│   ├── journal.ts                 # 일기 API
│   ├── questions.ts               # 공유 질문 API
│   ├── relationship.ts            # 관계 프로필 API
│   ├── decision.ts                # 결정 API
│   ├── graduation.ts              # 졸업 API
│   └── ai.ts                      # GPT 프록시 API
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── questionPool.ts            # 초기 질문 풀 시드 데이터
├── hooks/
│   ├── useAuth.ts
│   ├── usePushNotifications.ts    # NEW
│   └── useSmartQuestion.ts        # NEW (맥락형 질문 추천)
├── utils/
│   ├── diagnosis.ts
│   ├── dateUtils.ts
│   └── moodAnalysis.ts            # NEW (감정 추이 분석)
└── supabase/
    ├── migrations/                # DB 마이그레이션
    ├── functions/                 # Edge Functions
    │   ├── ai-comfort/
    │   ├── ai-journal-response/
    │   ├── ai-daily-quote/
    │   ├── ai-graduation-letter/
    │   ├── push-daily-reminder/
    │   └── push-cooling-checkin/
    └── seed.sql                   # 질문 풀 초기 데이터
```

---

## 15. 개발 우선순위 (v2)

### Phase 0 — 인프라
1. Expo 프로젝트 세팅
2. Supabase 프로젝트 생성 + DB 스키마
3. 디자인 시스템 (colors, 공통 컴포넌트)

### Phase 1 — 핵심 루프
4. 온보딩 + 홈
5. **이별 일기** (핵심 매일 루틴)
6. Supabase Auth + 일기 CRUD

### Phase 2 — 분석
7. 공유 질문 풀 시스템
8. 관계 분석 트랙 (공유 질문 기반)
9. 결정 나침반 트랙

### Phase 3 — AI 연동
10. GPT API Edge Function (프록시)
11. 일기 AI 응답
12. 오늘의 한마디

### Phase 4 — 졸업
13. 성장 리포트 (일기 데이터 기반 차트)
14. 졸업 화면 + 유예기간 시스템
15. 푸시 알림 (일기 리마인더 + 유예 체크인)

### Phase 5 — 다듬기
16. 오프라인 캐시 + 동기화
17. 감정 변화 감지 알림
18. 에러 핸들링 + 로딩 상태
19. 앱스토어 배포 준비

---

## 16. 주요 결정 사항 및 설계 근거

| 결정 | 이유 |
|------|------|
| 백엔드 추가 (Supabase) | API키 보호, 푸시 알림, 질문 풀 동적 관리 |
| 공유 질문 풀 | 트랙 간 유기적 연결, 같은 질문을 다른 맥락에서 재사용 |
| 이별 일기 | 감정은 매일 바뀜, 기록하면 패턴이 보임, 졸업 리포트 근거 |
| 졸업 유예 7일 | 감정적 결정 방지, 이혼 냉각기 개념, 진짜 괜찮은지 확인 |
| 장단점 동시 표시 | 한쪽만 보면 편향됨, 양쪽 비교가 이성적 판단 도움 |
| 방향 변화 추적 | "잡기↔보내기" 몇 번 바뀌었는지 보면 현 상태 이해에 도움 |
| Supabase 선택 | 빠른 MVP 개발, Auth/DB/Functions/Push 올인원 |

---

## 17. 핵심 리스크/누락 보완 항목 (필수)

### A. 로직 명세 보강
1. 가망 진단 점수표 고정
   - role/other/fix 각 값(a/b/c)의 가중치 정의
   - reconnect%, fixPct%, heal% 산식 및 보정 규칙 명시
2. 나침반 경계값 규칙 고정
   - diff 경계값(-3, -1, 1, 3) 판정 기준 명시
3. 미완 단계 상세화
   - 나침반 Step 3~5, 졸업 Step 2/4 질문-입력-출력 명세 작성

### B. 공유 질문 풀 운영 규칙
1. 질문 상태 머신 도입
   - unseen → shown → answered → stale → re-ask
2. 재노출 정책 수립
   - 동일 질문 재노출 쿨다운(예: 72시간)
   - 방향 급변/유예 Day 7 최종 확인에서 조건부 재질문 허용
3. 질문 선택 점수화
   - score = relevance + novelty + stability + emotional_safety

### C. 데이터/스키마 정합성
1. question_responses 중복 방지
   - unique(user_id, question_id) + upsert
   - response_value JSON schema validation 추가
2. enum 통일
   - direction: catch | let_go | undecided
   - graduation status: cooling | confirmed | cancelled
   - UI 문구는 i18n 레이어에서 변환
3. 유예 데이터 정책
   - reset/cancel 시 checkin 데이터 보존 여부와 리포트 반영 기준 명시

### D. AI 안전장치/장애 대응
1. 실패 fallback
   - GPT 실패 시 템플릿 응답으로 대체(공감 + 선택권 + 비단정)
2. 타임아웃 UX
   - 로딩 지연 시 재시도/건너뛰기 버튼 제공
3. 프롬프트 안전 규칙
   - 단정 금지, 비난 금지, 결정 강요 금지 문구를 시스템 프롬프트에 고정

### E. 운영 지표 및 QA
1. KPI
   - 일기 7일 유지율, 유예 완주율, 유예 중 복귀율, 졸업 확정률
2. 알림 품질
   - 클릭률/무응답률/차단율 기반 빈도 조정 기준 마련
3. E2E 테스트
   - 방향 급변, 3일 연속 동일 방향, 유예 리셋/취소/재신청 시나리오 필수 검증

*v2 업데이트: 백엔드, 공유 질문 풀, 이별 일기, 졸업 유예기간 추가*
*다음 단계: Supabase 세팅 + React Native 개발 시작*
