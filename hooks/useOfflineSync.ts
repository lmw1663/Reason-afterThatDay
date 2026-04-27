import { useEffect } from 'react';
import { AppState } from 'react-native';
import { flushOfflineQueue } from '@/utils/offlineQueue';

// 앱 포그라운드 진입 시마다 오프라인 큐 flush
export function useOfflineSync() {
  useEffect(() => {
    flushOfflineQueue();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') flushOfflineQueue();
    });
    return () => sub.remove();
  }, []);
}
