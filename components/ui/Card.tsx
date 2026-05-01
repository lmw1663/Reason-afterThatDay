import { View, ViewProps } from 'react-native';
import { colors } from '@/constants/colors';

type Variant = 'default' | 'accent' | 'warning' | 'subtle';
type Accent = 'purple' | 'teal' | 'coral' | 'amber';
type Tone = 'soft' | 'weak';

interface Props extends ViewProps {
  variant?: Variant;
  accent?: Accent;
  /** subtle variant 강도. soft = 표준, weak = 더 옅고 borderColor도 800 톤. */
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}

const ACCENT_BORDER: Record<Accent, string> = {
  purple: 'border-l-purple-600',
  teal:   'border-l-teal-600',
  coral:  'border-l-coral-600',
  amber:  'border-l-amber-400',
};

const SUBTLE_BG: Record<Accent, { soft: string; weak: string }> = {
  purple: { soft: colors.overlayPurpleSoft, weak: colors.overlayPurpleWeak },
  teal:   { soft: colors.overlayTealSoft,   weak: colors.overlayTealSoft   },
  coral:  { soft: colors.overlayPurpleSoft, weak: colors.overlayPurpleWeak }, // 거의 미사용
  amber:  { soft: colors.overlayAmberSoft,  weak: colors.overlayAmberSoft  },
};

const SUBTLE_BORDER: Record<Accent, { soft: string; weak: string }> = {
  purple: { soft: colors.purple[600], weak: colors.purple[800] },
  teal:   { soft: colors.teal[400],   weak: colors.teal[400]   },
  coral:  { soft: colors.coral[600],  weak: colors.coral[600]  },
  amber:  { soft: colors.amber[400],  weak: colors.amber[400]  },
};

/**
 * 통일된 카드 컴포넌트.
 * - default : surface 배경의 일반 카드
 * - accent  : 좌측 4px accent border (accent prop으로 색 지정)
 * - warning : amber 좌측 border + surface 배경 (`참고해줘` 박스)
 * - subtle  : 반투명 배경 + 1px 테두리 (정답 아니야/면책 박스). accent + tone 조합으로 강약 표현.
 *
 * 산재한 즉석 `<View style={{ backgroundColor: colors.surface, ... }} />` 패턴을 대체.
 */
export function Card({
  variant = 'default',
  accent = 'purple',
  tone = 'soft',
  className = '',
  children,
  ...rest
}: Props) {
  if (variant === 'accent') {
    return (
      <View
        className={`bg-surface rounded-2xl p-4 border-l-4 ${ACCENT_BORDER[accent]} ${className}`}
        {...rest}
      >
        {children}
      </View>
    );
  }

  if (variant === 'warning') {
    return (
      <View
        className={`bg-surface rounded-xl px-4 py-3 border-l-[3px] ${ACCENT_BORDER.amber} ${className}`}
        {...rest}
      >
        {children}
      </View>
    );
  }

  if (variant === 'subtle') {
    return (
      <View
        className={`rounded-xl px-4 py-3 ${className}`}
        style={{
          backgroundColor: SUBTLE_BG[accent][tone],
          borderWidth: 1,
          borderColor: SUBTLE_BORDER[accent][tone],
        }}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <View className={`bg-surface rounded-2xl p-4 ${className}`} {...rest}>
      {children}
    </View>
  );
}
