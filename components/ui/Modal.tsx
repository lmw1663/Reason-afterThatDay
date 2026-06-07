import { useEffect } from 'react';
import { Modal as RNModal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Body, Heading } from './Typography';
import { PrimaryButton } from './PrimaryButton';
import { Icon } from './Icon';
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
  /**
   * 'crisis' — 위기 모달 전용 시각 처리 (Tier 1-2).
   * 범용 다이얼로그와 외형이 같으면 위기 신호가 둔감화되므로
   * 솔리드 coral 헤더 아이콘 + coral 보더 + Warning 햅틱으로 구분한다.
   * default: 'default' (기존 외형 그대로).
   */
  variant?: 'default' | 'crisis';
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
  variant = 'default',
}: Props) {
  const isCrisis = variant === 'crisis';

  // 위기 모달이 열릴 때 Warning 햅틱 1회 — 시각과 함께 촉각으로도 "다른 종류의 모달"임을 전달.
  // 햅틱 미지원 기기/시뮬레이터에서는 silent (안전 흐름을 막으면 안 됨).
  useEffect(() => {
    if (visible && isCrisis) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [visible, isCrisis]);

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
          {/* 다이얼로그는 L2(상승) 서피스 — 페이지 카드(L1 surface)보다 한 단계 밝은 톤으로 부유감 */}
          <View
            className="bg-surface-elevated rounded-2xl p-6"
            style={isCrisis ? { borderWidth: 1, borderColor: colors.coral[600] } : undefined}
          >
            {isCrisis && (
              // 장식용 아이콘 — 스크린리더에서 완전히 숨김 (iOS/Android 모두)
              <View
                className="items-center mb-4"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.coral[600] }}
                >
                  <Icon name="heart-handshake" size={24} color={colors.white} strokeWidth={2} />
                </View>
              </View>
            )}
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
