import { TextInput, TextInputProps, View } from 'react-native';
import { colors } from '@/constants/colors';
import { Body, Caption } from './Typography';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
}

/**
 * 폼 입력 표준 컴포넌트.
 * label / error / helper text 슬롯 제공.
 * 기본적으로 surface 배경 + rounded.
 *
 * multiline 입력에는 minHeight를 직접 주거나 style로 추가.
 */
export function Input({ label, error, helper, containerClassName = '', style, ...rest }: Props) {
  return (
    <View className={containerClassName}>
      {label && <Body className="mb-2 text-gray-300">{label}</Body>}
      <TextInput
        placeholderTextColor={colors.gray[600]}
        accessibilityLabel={label ?? rest.placeholder}
        className="text-white text-base px-4 py-3 rounded-xl"
        style={[{ backgroundColor: colors.surface }, style]}
        {...rest}
      />
      {error ? (
        <Caption className="mt-2 text-coral-400">{error}</Caption>
      ) : helper ? (
        <Caption variant="subtle" className="mt-2">
          {helper}
        </Caption>
      ) : null}
    </View>
  );
}
