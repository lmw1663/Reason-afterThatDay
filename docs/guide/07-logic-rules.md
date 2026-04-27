# Logic Rules

## 가망 진단 계산

```mermaid
flowchart LR
  In["입력\nrole(a/b/c)\nother(a/b/c)\nfix(a/b/c)"] --> Calc[계산 로직]
  Calc --> R1[reconnect%]
  Calc --> R2[fixPct%]
  Calc --> R3[heal%]

  Diary[최근 일기 안정 추세] -->|높으면 보정| R3

  R1 --> Screen[결과 화면\n'정답이 아니야' 문구 필수]
  R2 --> Screen
  R3 --> Screen
```

## 나침반 방향 판정

```mermaid
flowchart TD
  Input["diff = wantA(1~10) - wantB(1~10)"] --> D1{diff > 3?}
  D1 -->|Yes| Catch[잡는 방향]
  D1 -->|No| D2{diff < -3?}
  D2 -->|Yes| Let[보내는 방향]
  D2 -->|No| D3{diff == 0 또는 diff == 1?}
  D3 -->|Yes| Conflict[갈등 중]
  D3 -->|No| Pending[판단 보류]

  Catch --> Note[최근 7일 방향 변화 횟수 문구 연동]
  Let --> Note
  Conflict --> Note
  Pending --> Note
```

## 질문 상태 머신

```mermaid
stateDiagram-v2
  [*] --> unseen : 질문 생성

  unseen --> shown : 화면에 노출
  shown --> answered : 사용자 답변
  answered --> stale : 시간 경과 / 방향 급변
  stale --> re_ask : 재질문 트리거

  re_ask --> shown : 재노출 (쿨다운 통과 시)
  re_ask --> stale : 쿨다운 중 — 재노출 억제

  note right of re_ask
    트리거 조건:
    - 시간 경과
    - 방향 급변
    - Day 7 최종 확인
  end note
```

## 가망 진단
- 입력: `role(a/b/c) x other(a/b/c) x fix(a/b/c)`
- 출력: `reconnect%`, `fixPct%`, `heal%`
- 최근 일기 안정 추세가 높으면 `heal%` 보정
- 결과 화면에 "정답이 아니야" 문구 필수

## 나침반
- 입력: `diff = wantA(1~10) - wantB(1~10)`
- `diff > 3`: 잡는 방향
- `diff < -3`: 보내는 방향
- `|diff| <= 1`: 갈등 중
- 나머지: 판단 보류
- 최근 7일 방향 변화 횟수 문구 연동

## 질문 상태 머신
- `unseen → shown → answered → stale → re-ask`
- 재질문 트리거: 시간 경과, 방향 급변, Day 7 최종 확인
- 중복 노출 방지를 위한 쿨다운 적용
