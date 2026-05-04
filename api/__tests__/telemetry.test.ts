import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/store/useUserStore', () => ({
  useUserStore: { getState: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import {
  getTelemetryStatus,
  setTelemetryOptIn,
  trackEvent,
  sanitizePayload,
} from '@/api/telemetry';
import {
  applyChain,
  chainSelectMaybeSingle,
  chainUpdate,
} from '@/tests/helpers/supabaseMock';

function setUserId(userId: string | null) {
  (useUserStore.getState as Mock).mockReturnValue({ userId });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getTelemetryStatus', () => {
  it('정상 응답 — opted in', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle({
      telemetry_opted_in: true,
      telemetry_opted_in_at: '2026-05-04T12:00:00Z',
    }));
    const result = await getTelemetryStatus('user-1');
    expect(result).toEqual({ optedIn: true, optedInAt: '2026-05-04T12:00:00Z' });
  });

  it('데이터 부재 → DEFAULT', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle(null));
    const result = await getTelemetryStatus('user-1');
    expect(result).toEqual({ optedIn: false, optedInAt: null });
  });

  it('error → DEFAULT (fail-open)', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle(null, new Error('db')));
    const result = await getTelemetryStatus('user-1');
    expect(result.optedIn).toBe(false);
  });
});

describe('setTelemetryOptIn', () => {
  it('optIn=true → telemetry_opted_in=true + timestamp 갱신', async () => {
    const chain = applyChain(supabase.from as Mock, chainUpdate());
    await setTelemetryOptIn('user-1', true);
    const call = chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(call.telemetry_opted_in).toBe(true);
    expect(typeof call.telemetry_opted_in_at).toBe('string');
  });

  it('optIn=false → telemetry_opted_in=false + timestamp null', async () => {
    const chain = applyChain(supabase.from as Mock, chainUpdate());
    await setTelemetryOptIn('user-1', false);
    const call = chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(call.telemetry_opted_in).toBe(false);
    expect(call.telemetry_opted_in_at).toBeNull();
  });

  it('error → throw', async () => {
    applyChain(supabase.from as Mock, chainUpdate(new Error('rls')));
    await expect(setTelemetryOptIn('user-1', true)).rejects.toThrow();
  });
});

describe('trackEvent — silent skip 정책', () => {
  it('userId 부재 → DB 호출 0', async () => {
    setUserId(null);
    await trackEvent('screen_view', { screen: 'home' });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('옵트인 OFF → status 조회만, insert 안 함', async () => {
    setUserId('user-1');
    applyChain(supabase.from as Mock, chainSelectMaybeSingle({
      telemetry_opted_in: false,
      telemetry_opted_in_at: null,
    }));
    await trackEvent('screen_view', { screen: 'home' });
    expect((supabase.from as Mock).mock.calls.length).toBe(1);
    expect((supabase.from as Mock).mock.calls[0][0]).toBe('users');
  });

  it('옵트인 ON → events insert 호출 + payload 매핑(event_kind·payload·client_timestamp)', async () => {
    setUserId('user-1');
    let callCount = 0;
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    // 다중 테이블 분기 패턴 — users는 select 체인, events는 insert 체인
    (supabase.from as Mock).mockImplementation((table: string) => {
      callCount++;
      if (table === 'users') {
        return chainSelectMaybeSingle({
          telemetry_opted_in: true,
          telemetry_opted_in_at: '2026-05-04',
        });
      }
      return { insert: insertSpy };
    });
    await trackEvent('screen_view', { screen: 'home', persona_category: 'C_regulation' });
    expect(callCount).toBe(2);
    const insertedRow = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(insertedRow.user_id).toBe('user-1');
    expect(insertedRow.event_kind).toBe('screen_view');
    expect(insertedRow.payload).toEqual({ screen: 'home', persona_category: 'C_regulation' });
    expect(typeof insertedRow.client_timestamp).toBe('string');
  });

  it('status 조회 실패 → silent (insert 안 함, throw 안 함)', async () => {
    setUserId('user-1');
    applyChain(supabase.from as Mock, chainSelectMaybeSingle(null, new Error('db')));
    await expect(trackEvent('screen_view', { screen: 'home' })).resolves.toBeUndefined();
  });

  it('비허용 키 → silent 차단 후 insert 진행 (allowlist 적용)', async () => {
    setUserId('user-1');
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return chainSelectMaybeSingle({
          telemetry_opted_in: true,
          telemetry_opted_in_at: null,
        });
      }
      return { insert: insertSpy };
    });
    // free_text·user_email 등 PII 후보를 섞어 호출
    await trackEvent('screen_view', {
      screen: 'home',
      free_text: 'sensitive content',
      user_email: 'a@b.com',
    });
    const insertedRow = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    // payload에서 비허용 키가 제거됐는지
    expect(insertedRow.payload).toEqual({ screen: 'home' });
    expect((insertedRow.payload as Record<string, unknown>).free_text).toBeUndefined();
  });

  it('insert 실패 → silent throw 안 함', async () => {
    setUserId('user-1');
    (supabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return chainSelectMaybeSingle({
          telemetry_opted_in: true,
          telemetry_opted_in_at: null,
        });
      }
      return { insert: vi.fn().mockRejectedValue(new Error('insert failed')) };
    });
    await expect(trackEvent('screen_view', { screen: 'home' })).resolves.toBeUndefined();
  });
});

describe('sanitizePayload — EventKind별 allowlist', () => {
  it('screen_view: screen·persona_category 통과, 나머지 제거', () => {
    expect(
      sanitizePayload('screen_view', {
        screen: 'home',
        persona_category: 'baseline',
        free_text: 'leak',
      }),
    ).toEqual({ screen: 'home', persona_category: 'baseline' });
  });

  it('persona_branch_applied: secondary_emotion 포함 (raw-mode 정합)', () => {
    expect(
      sanitizePayload('persona_branch_applied', {
        screen: 'journal_raw_mode',
        branch: 'raw_mode_completed',
        persona_category: 'C_regulation',
        secondary_emotion: '슬픔',
      }),
    ).toEqual({
      screen: 'journal_raw_mode',
      branch: 'raw_mode_completed',
      persona_category: 'C_regulation',
      secondary_emotion: '슬픔',
    });
  });

  it('contact_urge_reported: 모든 키 제거 (allowlist 빈 배열)', () => {
    expect(
      sanitizePayload('contact_urge_reported', { count: 5, persona: 'P10' }),
    ).toEqual({});
  });

  it('experiment_assigned: experiment_id·variant만 통과', () => {
    expect(
      sanitizePayload('experiment_assigned', {
        experiment_id: 'me_card_emphasis',
        variant: 'highlight',
        userId: 'leak',
      }),
    ).toEqual({ experiment_id: 'me_card_emphasis', variant: 'highlight' });
  });

  it('ai_response_fallback: fn·reason 통과', () => {
    expect(
      sanitizePayload('ai_response_fallback', {
        fn: 'journal',
        reason: 'suspended',
        prompt: 'leak',
      }),
    ).toEqual({ fn: 'journal', reason: 'suspended' });
  });

  it('빈 payload → 빈 결과', () => {
    expect(sanitizePayload('crisis_modal_shown', {})).toEqual({});
  });
});
