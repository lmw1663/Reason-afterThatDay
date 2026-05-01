export type MoodTrend = 'rising' | 'falling' | 'stable' | 'volatile' | 'insufficient';

export interface MoodInsight {
  trend: MoodTrend;
  sentence: string;
}

export function analyzeMoodTrend(scores: number[]): MoodInsight {
  if (scores.length < 2) {
    return { trend: 'insufficient', sentence: '기록이 쌓이면 더 자세히 볼 수 있어.' };
  }

  const recent = scores.slice(0, 3);
  const older  = scores.slice(3, 6);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentAvg = avg(recent);
  const olderAvg  = older.length ? avg(older) : recentAvg;

  const diff = recentAvg - olderAvg;

  // 변동성 체크
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  if (max - min >= 4) {
    return {
      trend: 'volatile',
      sentence: `최근 감정이 ${min}°에서 ${max}° 사이를 오가고 있어. 마음이 많이 흔들리는 것 같아.`,
    };
  }

  if (diff >= 1.5) {
    return {
      trend: 'rising',
      sentence: `최근 3일 감정 온도가 조금씩 올라오고 있어. 그 변화가 진짜야.`,
    };
  }

  if (diff <= -1.5) {
    return {
      trend: 'falling',
      sentence: `최근 감정이 좀 가라앉고 있어. 괜찮아, 파도처럼 다시 올라올 거야.`,
    };
  }

  return {
    trend: 'stable',
    sentence: `감정이 비교적 안정적으로 유지되고 있어. 꾸준히 자신을 돌보고 있다는 뜻이야.`,
  };
}

export function moodLevelSentence(avg: number): string {
  if (avg >= 8) return '감정 온도가 꽤 높아. 힘든 시간 속에서도 회복력이 보여.';
  if (avg >= 6) return '평균 감정이 중간 위쪽이야. 조금씩 나아지고 있어.';
  if (avg >= 4) return '아직 무거운 시간이 이어지고 있는 것 같아. 그래도 버텨온 거야.';
  return '많이 힘든 시간이었던 것 같아. 그 감정을 외면하지 않고 기록한 것만으로도 대단해.';
}
