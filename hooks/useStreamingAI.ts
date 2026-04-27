import { useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { JournalContext } from '@/api/ai';
import { fetchJournalResponse } from '@/api/ai';

interface StreamState {
  text: string;
  loading: boolean;
  done: boolean;
}

// 일기 응답 스트리밍 — 글자가 하나씩 나타나는 효과로 대기감 감소
export function useStreamingJournalResponse() {
  const [state, setState] = useState<StreamState>({ text: '', loading: false, done: false });

  const fetchStream = useCallback(async (ctx: JournalContext) => {
    setState({ text: '', loading: true, done: false });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const fnUrl = `${supabaseUrl}/functions/v1/ai-journal-response-stream`;

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify(ctx),
      });

      if (!res.ok) throw new Error('stream_failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (!reader) throw new Error('no_reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setState((prev) => ({ ...prev, loading: false, done: true }));
            return;
          }
          try {
            const { text } = JSON.parse(raw);
            accumulated += text;
            setState({ text: accumulated, loading: false, done: false });
          } catch {
            // 파싱 실패 무시
          }
        }
      }

      setState((prev) => ({ ...prev, loading: false, done: true }));
    } catch {
      // 스트리밍 실패 시 일반 호출로 폴백
      const text = await fetchJournalResponse(ctx);
      setState({ text, loading: false, done: true });
    }
  }, []);

  return { ...state, fetchStream };
}
