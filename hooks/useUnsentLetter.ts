import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 부치지 않을 편지 보관함 — C-2-Ref-5 (참고용 §2 P02·P10·P17)
 *
 * 정책:
 *  - 작성 → 24시간 잠금 → 잠금 해제 후 *읽기만* 가능 (발송 기능 없음)
 *  - AsyncStorage local-only (디바이스 분실 시 사라짐 — 의도적)
 *  - 페르소나별 권장: P10 분노 venting / P02 빈 페이지 회피 / P17 미완의 말
 *
 * 자동 정리: 30일 이상 된 편지는 다음 진입 시 자동 삭제 (보관함 무한 누적 방지).
 */

const STORAGE_KEY = 'unsent_letters_v1';
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;
const AUTO_PURGE_AFTER_DAYS = 30;

export interface UnsentLetter {
  id: string;
  text: string;
  createdAt: string;   // ISO
  unlockAt: string;    // ISO (createdAt + 24h)
}

async function loadAll(): Promise<UnsentLetter[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(letters: UnsentLetter[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function isExpired(letter: UnsentLetter): boolean {
  const ageDays = (Date.now() - new Date(letter.createdAt).getTime()) / (24 * 60 * 60 * 1000);
  return ageDays > AUTO_PURGE_AFTER_DAYS;
}

export function useUnsentLetter() {
  const [letters, setLetters] = useState<UnsentLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await loadAll();
    // 30일 초과 자동 삭제
    const fresh = all.filter(l => !isExpired(l));
    if (fresh.length !== all.length) await saveAll(fresh);
    setLetters(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addLetter = useCallback(async (text: string): Promise<UnsentLetter | null> => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const now = new Date();
    const letter: UnsentLetter = {
      id: `letter_${now.getTime()}`,
      text: trimmed,
      createdAt: now.toISOString(),
      unlockAt: new Date(now.getTime() + LOCK_DURATION_MS).toISOString(),
    };
    const all = await loadAll();
    const next = [letter, ...all];
    await saveAll(next);
    setLetters(next);
    return letter;
  }, []);

  const deleteLetter = useCallback(async (id: string): Promise<void> => {
    const all = await loadAll();
    const next = all.filter(l => l.id !== id);
    await saveAll(next);
    setLetters(next);
  }, []);

  const now = Date.now();
  const locked = letters.filter(l => new Date(l.unlockAt).getTime() > now);
  const unlocked = letters.filter(l => new Date(l.unlockAt).getTime() <= now);

  return { loading, locked, unlocked, addLetter, deleteLetter, refresh };
}
