-- ============================================================
-- Migration 003 — 초기 질문 풀 시드
-- ============================================================

insert into public.question_pool (id, text, context, weight) values
  -- 일기 공통
  ('j_direction_change',  '뭐가 마음을 바꿨어?',                              '{"journal"}',                    10),
  ('j_direction_steady',  '이 마음이 꽤 단단해 보여. 어디서 온 걸까?',            '{"journal"}',                    8),
  ('j_today_mood',        '오늘 하루 어떤 순간이 제일 기억에 남아?',               '{"journal"}',                    5),
  ('j_miss_what',         '지금 가장 그리운 게 뭐야?',                          '{"journal"}',                    5),
  ('j_body_feeling',      '지금 몸은 어때? 잘 자고 잘 먹고 있어?',               '{"journal"}',                    4),
  ('j_tomorrow',          '내일은 어떻게 보내고 싶어?',                         '{"journal"}',                    4),

  -- 관계 분석
  ('a_breakup_reason',    '헤어진 이유 중 제일 마음에 걸리는 게 뭐야?',            '{"analysis"}',                   7),
  ('a_best_memory',       '같이 있을 때 제일 좋았던 순간은?',                    '{"analysis"}',                   6),
  ('a_changed_you',       '이 관계가 너를 어떻게 바꿨어?',                      '{"analysis"}',                   6),
  ('a_their_feeling',     '지금 상대방은 어떤 마음일 것 같아?',                  '{"analysis"}',                   5),
  ('a_fix_possible',      '둘 사이에서 고칠 수 있는 게 있다고 생각해?',            '{"analysis"}',                   5),

  -- 나침반
  ('c_honest_want',       '솔직하게, 지금 뭘 원해?',                           '{"compass"}',                    9),
  ('c_fear_catch',        '다시 잡으려 할 때 제일 두려운 게 뭐야?',               '{"compass"}',                    7),
  ('c_fear_letgo',        '보내주기로 했을 때 제일 두려운 게 뭐야?',              '{"compass"}',                    7),
  ('c_6month_later',      '6개월 뒤 어떤 모습이고 싶어?',                       '{"compass"}',                    6),
  ('c_friend_advice',     '친한 친구가 이 상황이라면 뭐라고 할 것 같아?',          '{"compass"}',                    5),

  -- 졸업
  ('g_learned',           '이 이별에서 배운 게 있다면?',                         '{"graduation"}',                 8),
  ('g_forgive',           '스스로 용서하고 싶은 게 있어?',                       '{"graduation"}',                 7),
  ('g_letter_self',       '1년 전 나에게 한마디 한다면?',                        '{"graduation"}',                 6),
  ('g_next_chapter',      '다음 챕터에서 가장 원하는 게 뭐야?',                   '{"graduation"}',                 6),

  -- 공통 (여러 트랙)
  ('x_right_now',         '지금 이 순간 가장 필요한 게 뭐야?',                   '{"journal","compass"}',          6),
  ('x_support',           '지금 곁에 있어줬으면 하는 사람이 있어?',               '{"journal","analysis"}',         5),
  ('x_self_care',         '요즘 자신을 위해 하고 있는 게 있어?',                  '{"journal","graduation"}',       5);
