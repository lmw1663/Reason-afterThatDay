import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Body, Caption, Heading } from './ui/Typography';

interface BreathingGuideProps {
  pattern: 'quick' | 'deep';
  onComplete?: () => void;
}

const PATTERNS = {
  // 떠오름 진정용 — 1회 (6-5)
  quick: { cycles: 1, inhale: 3, hold: 2, exhale: 3, totalDuration: 8 },
  // Day 1 안정용 — 3회 반복 (6-3)
  deep: { cycles: 3, inhale: 4, hold: 4, exhale: 4, totalDuration: 36 },
};

type Phase = 'inhale' | 'hold' | 'exhale' | 'done';

const PHASE_LABELS: Record<Exclude<Phase, 'done'>, string> = {
  inhale: '천천히 들이쉬어',
  hold: '잠깐 멈춰',
  exhale: '천천히 내쉬어',
};

export function BreathingGuide({ pattern, onComplete }: BreathingGuideProps) {
  const cfg = PATTERNS[pattern];
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(1);
  const [remaining, setRemaining] = useState(cfg.inhale);

  useEffect(() => {
    if (phase === 'done') {
      onComplete?.();
      return;
    }

    const duration =
      phase === 'inhale' ? cfg.inhale : phase === 'hold' ? cfg.hold : cfg.exhale;

    setRemaining(duration);

    const tick = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    const advance = setTimeout(() => {
      clearInterval(tick);
      if (phase === 'inhale') {
        setPhase('hold');
      } else if (phase === 'hold') {
        setPhase('exhale');
      } else {
        if (cycle < cfg.cycles) {
          setCycle((c) => c + 1);
          setPhase('inhale');
        } else {
          setPhase('done');
        }
      }
    }, duration * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [phase, cycle]);

  if (phase === 'done') return null;

  return (
    <View className="items-center py-8">
      <Heading className="text-purple-400 mb-2">{PHASE_LABELS[phase]}</Heading>
      <Caption className="text-gray-400 mb-4">{remaining}초</Caption>
      {cfg.cycles > 1 && (
        <Caption className="text-gray-600">
          {cycle} / {cfg.cycles}
        </Caption>
      )}
      <View className="mt-6">
        <Body className="text-gray-500 text-center text-sm">
          {phase === 'inhale'
            ? '코로 천천히 숨을 들이쉬어'
            : phase === 'hold'
            ? '그 상태로 잠깐 멈춰봐'
            : '입으로 천천히 내쉬어'}
        </Body>
      </View>
    </View>
  );
}
