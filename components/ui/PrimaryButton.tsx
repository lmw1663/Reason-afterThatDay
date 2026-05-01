import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  /** 라벨 좌측에 표시할 아이콘. 시그니처 색은 자동 (primary=white / ghost=purple-400). */
  leftIcon?: IconName;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  leftIcon,
}: Props) {
  const isPrimary = variant === 'primary';
  const iconColor = isPrimary ? colors.white : colors.purple[400];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={[
        'rounded-2xl py-4 px-6 items-center justify-center',
        isPrimary
          ? 'bg-purple-600 active:bg-purple-800'
          : 'border border-purple-600 active:bg-purple-800/10',
        (disabled || loading) && 'opacity-50',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon && <Icon name={leftIcon} size={18} color={iconColor} strokeWidth={2} />}
          <Text
            className={[
              'text-base font-semibold',
              isPrimary ? 'text-white' : 'text-purple-400',
            ].join(' ')}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
