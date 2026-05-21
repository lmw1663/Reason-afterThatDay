import { Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '@/constants/colors';

interface Props {
  title?: string;
  body: string;
  tag?: string;
  accent?: 'purple' | 'teal' | 'coral';
}

const accentMap = {
  purple: { dot: colors.purple[400], tag: colors.purple[400], border: 'rgba(127,119,221,0.18)' },
  teal:   { dot: colors.teal[400],   tag: colors.teal[400],   border: 'rgba(29,158,117,0.20)' },
  coral:  { dot: colors.coral[400],  tag: colors.coral[400],  border: 'rgba(216,90,48,0.20)' },
};

/**
 * 인사이트 카드 — 좌측 4px 띠 제거(2024~2026 트렌드는 보더리스).
 *
 * 상단 메타 라인에 [dot · tag · sparkle] 배치. dot은 4px → 8px 격상으로
 * 시각 무게 부여. 본문은 gray-300 / leading-7로 가독성 ↑.
 */
export function InsightCard({ title, body, tag, accent = 'purple' }: Props) {
  const a = accentMap[accent];
  return (
    <View
      className="rounded-3xl p-5"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: a.border,
      }}
    >
      {tag && (
        <View className="flex-row items-center gap-2 mb-3">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: a.dot }} />
          <Text
            style={{
              fontFamily: 'Pretendard',
              color: a.tag,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}
          >
            {tag}
          </Text>
          <View className="flex-1" />
          <Icon name="sparkles" size={14} color={a.tag} />
        </View>
      )}
      {title && (
        <Text
          className="text-white font-semibold text-base mb-2"
          style={{ fontFamily: 'Pretendard' }}
        >
          {title}
        </Text>
      )}
      <Text
        className="text-gray-300"
        style={{ fontFamily: 'Pretendard', fontSize: 15, lineHeight: 26 }}
      >
        {body}
      </Text>
    </View>
  );
}
