import { Text, View } from 'react-native';

interface Props {
  title?: string;
  body: string;
  tag?: string;
  accent?: 'purple' | 'teal' | 'coral';
}

const accentMap = {
  purple: { border: 'border-l-purple-600', tag: 'text-purple-400' },
  teal:   { border: 'border-l-teal-600',   tag: 'text-teal-400'   },
  coral:  { border: 'border-l-coral-600',  tag: 'text-coral-400'  },
};

export function InsightCard({ title, body, tag, accent = 'purple' }: Props) {
  const a = accentMap[accent];
  return (
    <View className={['bg-surface rounded-2xl p-4 border-l-4', a.border].join(' ')}>
      {tag && <Text className={['text-xs font-medium mb-1', a.tag].join(' ')}>{tag}</Text>}
      {title && <Text className="text-white font-semibold text-base mb-2">{title}</Text>}
      <Text className="text-gray-400 text-sm leading-relaxed">{body}</Text>
    </View>
  );
}
