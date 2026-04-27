import { useEffect } from 'react';
import { useQuestionStore } from '@/store/useQuestionStore';
import { useUserStore } from '@/store/useUserStore';
import { fetchQuestionPool, fetchAnsweredQuestions } from '@/api/questions';

// 앱 루트에서 1회 호출 — 질문 풀 + 이미 답한 목록 로드
export function useQuestionPool() {
  const { setPool, answered } = useQuestionStore();
  const { userId } = useUserStore();

  useEffect(() => {
    fetchQuestionPool().then(setPool);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchAnsweredQuestions(userId).then((list) => {
      const map: typeof answered = {};
      for (const a of list) map[a.questionId] = a;
      useQuestionStore.setState({ answered: map });
    });
  }, [userId]);
}
