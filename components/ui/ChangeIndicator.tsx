import { Text } from 'react-native';
import type { Direction } from '@/store/useJournalStore';

const LABEL: Record<Direction, string> = {
  catch: '잡고싶다',
  let_go: '보내고싶다',
  undecided: '모르겠다',
};

interface Props {
  prev: Direction | null;
  current: Direction;
  prefix?: string;
  suffix?: string;
}

export function ChangeIndicator({ prev, current, prefix = '어제는', suffix = '오늘은?' }: Props) {
  if (!prev || prev === current) return null;
  return (
    <Text className="text-gray-400 text-sm mb-4 text-center">
      {prefix}{' '}
      <Text className="text-purple-400">{LABEL[prev]}</Text>
      고 했는데, {suffix}
    </Text>
  );
}
