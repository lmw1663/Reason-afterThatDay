import { Modal } from './ui/Modal';
import { router } from 'expo-router';

interface EmotionalCheckModalProps {
  type: 'consecutive_low' | 'late_night';
  visible: boolean;
  onClose: () => void;
}

const MESSAGES = {
  consecutive_low: {
    title: '요즘 정말 힘들어 보여',
    description:
      '3일 연속 마음이 1~2점 정도였어.\n정말 괜찮아?\n혼자가 아니야. 함께할 수 있어.',
    primaryLabel: '전문 상담 알아보기',
    secondaryLabel: '지금은 괜찮아, 닫기',
  },
  late_night: {
    title: '너무 늦었어',
    description:
      '새벽엔 이런 마음들이 커지곤 해.\n잠시 휴식을 취해볼까?\n내일 아침이 훨씬 다를 거야.',
    primaryLabel: '호흡하기',
    secondaryLabel: '괜찮아, 계속할게',
  },
};

export function EmotionalCheckModal({
  type,
  visible,
  onClose,
}: EmotionalCheckModalProps) {
  const config = MESSAGES[type];

  function handlePrimary() {
    onClose();
    if (type === 'consecutive_low') {
      router.push('/resources/hotline' as never);
    } else {
      // late_night: 호흡하기 → 홈 화면 (🫧 떠오름 진입점)으로 이동
      router.replace('/(tabs)' as never);
    }
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={config.title}
      description={config.description}
      primaryLabel={config.primaryLabel}
      onPrimary={handlePrimary}
      secondaryLabel={config.secondaryLabel}
      onSecondary={onClose}
    />
  );
}
