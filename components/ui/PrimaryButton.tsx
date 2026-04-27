import { ActivityIndicator, Pressable, Text } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        'rounded-2xl py-4 px-6 items-center justify-center',
        isPrimary
          ? 'bg-purple-600 active:bg-purple-800'
          : 'border border-purple-600 active:bg-purple-800/10',
        (disabled || loading) && 'opacity-50',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#7F77DD'} />
      ) : (
        <Text
          className={[
            'text-base font-semibold',
            isPrimary ? 'text-white' : 'text-purple-400',
          ].join(' ')}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
