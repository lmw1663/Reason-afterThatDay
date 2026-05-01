import type { Question } from '@/store/useQuestionStore';

// 오프라인/초기 로드 대비 번들 폴백 — 서버 question_pool과 동일한 데이터
export const OFFLINE_QUESTION_POOL: Question[] = [
  { id: 'j_direction_change',  text: '뭐가 마음을 바꿨어?',                              context: ['journal'],               isActive: true, weight: 10 },
  { id: 'j_direction_steady',  text: '이 마음이 꽤 단단해 보여. 어디서 온 걸까?',            context: ['journal'],               isActive: true, weight: 8  },
  { id: 'j_today_mood',        text: '오늘 하루 어떤 순간이 제일 기억에 남아?',               context: ['journal'],               isActive: true, weight: 5  },
  { id: 'j_miss_what',         text: '지금 가장 그리운 게 뭐야?',                          context: ['journal'],               isActive: true, weight: 5  },
  { id: 'j_body_feeling',      text: '지금 몸은 어때? 잘 자고 잘 먹고 있어?',               context: ['journal'],               isActive: true, weight: 4  },
  { id: 'j_tomorrow',          text: '내일은 어떻게 보내고 싶어?',                         context: ['journal'],               isActive: true, weight: 4  },
  { id: 'a_breakup_reason',    text: '헤어진 이유 중 제일 마음에 걸리는 게 뭐야?',            context: ['analysis'],              isActive: true, weight: 7  },
  { id: 'a_best_memory',       text: '같이 있을 때 제일 좋았던 순간은?',                    context: ['analysis'],              isActive: true, weight: 6  },
  { id: 'a_changed_you',       text: '이 관계가 너를 어떻게 바꿨어?',                      context: ['analysis'],              isActive: true, weight: 6  },
  { id: 'a_their_feeling',     text: '지금 상대방은 어떤 마음일 것 같아?',                  context: ['analysis'],              isActive: true, weight: 5  },
  { id: 'a_fix_possible',      text: '둘 사이에서 고칠 수 있는 게 있다고 생각해?',            context: ['analysis'],              isActive: true, weight: 5  },
  { id: 'c_honest_want',       text: '솔직하게, 지금 뭘 원해?',                           context: ['compass'],               isActive: true, weight: 9  },
  { id: 'c_fear_catch',        text: '다시 잡으려 할 때 제일 두려운 게 뭐야?',               context: ['compass'],               isActive: true, weight: 7  },
  { id: 'c_fear_letgo',        text: '보내주기로 했을 때 제일 두려운 게 뭐야?',              context: ['compass'],               isActive: true, weight: 7  },
  { id: 'c_6month_later',      text: '6개월 뒤 어떤 모습이고 싶어?',                       context: ['compass'],               isActive: true, weight: 6  },
  { id: 'c_friend_advice',     text: '친한 친구가 이 상황이라면 뭐라고 할 것 같아?',          context: ['compass'],               isActive: true, weight: 5  },
  { id: 'g_learned',           text: '이 이별에서 배운 게 있다면?',                         context: ['graduation'],            isActive: true, weight: 8  },
  { id: 'g_forgive',           text: '스스로 용서하고 싶은 게 있어?',                       context: ['graduation'],            isActive: true, weight: 7  },
  { id: 'g_letter_self',       text: '1년 전 나에게 한마디 한다면?',                        context: ['graduation'],            isActive: true, weight: 6  },
  { id: 'g_next_chapter',      text: '다음 챕터에서 가장 원하는 게 뭐야?',                   context: ['graduation'],            isActive: true, weight: 6  },
  { id: 'x_right_now',         text: '지금 이 순간 가장 필요한 게 뭐야?',                   context: ['journal', 'compass'],    isActive: true, weight: 6  },
  { id: 'x_support',           text: '지금 곁에 있어줬으면 하는 사람이 있어?',               context: ['journal', 'analysis'],   isActive: true, weight: 5  },
  { id: 'x_self_care',         text: '요즘 자신을 위해 하고 있는 게 있어?',                  context: ['journal', 'graduation'], isActive: true, weight: 5  },
  // 나침반 체크 질문 (migration 005)
  { id: 'c_check_past',        text: '6개월 전으로 돌아가도 같은 선택을 할 것 같아?',         context: ['compass'],               isActive: true, weight: 7  },
  { id: 'c_check_change',      text: '상대방이 바뀔 수 있다고 진심으로 믿어?',                context: ['compass'],               isActive: true, weight: 7  },
  { id: 'c_check_harder',      text: '혼자인 지금이 같이였을 때보다 더 힘들어?',               context: ['compass'],               isActive: true, weight: 6  },
  { id: 'c_check_free',        text: '상대 없이 내 삶을 상상하면 자유롭다는 느낌이 들어?',     context: ['compass'],               isActive: true, weight: 6  },
  { id: 'c_check_fear',        text: '지금 이 결정이 두려움에서 온 게 아니라고 할 수 있어?',   context: ['compass'],               isActive: true, weight: 7  },
  // 졸업 회한 질문 (migration 005)
  { id: 'g_regret_best',       text: '이 관계에서 제일 아쉬웠던 기억이 뭐야?',               context: ['graduation'],            isActive: true, weight: 8  },
  { id: 'g_regret_unsaid',     text: '아직 전하지 못한 말이 있어?',                          context: ['graduation'],            isActive: true, weight: 8  },
];
