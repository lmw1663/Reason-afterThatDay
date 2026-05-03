import { Modal as RNModal, Pressable, View } from 'react-native';
import { Body, Heading } from './Typography';
import { PrimaryButton } from './PrimaryButton';
import { colors } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: React.ReactNode;
  /**
   * false면 backdrop 탭·하드웨어 백 버튼으로 닫히지 않음.
   * 위기 평가처럼 *사용자가 끝까지 답해야 하는 흐름*에서 false 사용.
   * default: true (기존 동작 유지).
   */
  dismissable?: boolean;
}

/**
 * 프로젝트 표준 다이얼로그.
 * 기본 슬롯: title / description / primary / secondary 버튼.
 * 추가 콘텐츠가 필요하면 children으로 삽입.
 *
 * Alert.alert는 OS 스타일을 따르지만 다크 테마 일관성을 위해 이 컴포넌트 사용 권장.
 */
export function Modal({
  visible,
  onClose,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
  dismissable = true,
}: Props) {
  const noop = () => {};
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissable ? onClose : noop}
      accessibilityViewIsModal
    >
      <Pressable
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.overlayBackdropDark }}
        onPress={dismissable ? onClose : noop}
      >
        <Pressable className="w-full" onPress={(e) => e.stopPropagation()}>
          <View className="bg-surface rounded-2xl p-6">
            {title && <Heading className="mb-2">{title}</Heading>}
            {description && <Body className="mb-4 text-gray-300">{description}</Body>}
            {children}
            <View className="gap-3 mt-2">
              {primaryLabel && <PrimaryButton label={primaryLabel} onPress={onPrimary ?? onClose} />}
              {secondaryLabel && (
                <PrimaryButton label={secondaryLabel} variant="ghost" onPress={onSecondary ?? onClose} />
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
