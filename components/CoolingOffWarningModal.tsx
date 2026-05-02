import { View } from 'react-native';
import { Modal } from './ui/Modal';
import { Caption } from './ui/Typography';

export interface CoolingOffWarningModalProps {
  visible: boolean;
  day: number;
  context: 'analysis' | 'self_reflection';
  onProceed: () => void;
  onCancel: () => void;
}

const MESSAGES: Record<'analysis' | 'self_reflection', Record<number, string>> = {
  analysis: {
    1: '지금은 감정이 가장 출렁이는 시점이야. 분석보다 휴식이 필요할 수도 있어. 그래도 할래?',
    2: '아직 결정이 흔들리는 시점인 것 같아. 일주일 정도 더 기다린 후 분석하는 게 정확할 거야.',
    3: '분노 단계일 수도 있는 시점이야. 지금의 분석이 나중에 다르게 보일 수 있어. 혹시 미뤄볼까?',
    4: '슬픔이 가장 깊은 시점이야. 객관적인 분석이 어려울 수 있어. 기다려줄 수 있어?',
    5: '거의 다 왔어. 아직 3일 남았으니 이 분석은 나중에 해도 좋아.',
    6: '내일이면 일주일이야. 내일 확인한 후 분석해도 늦지 않아.',
    7: '오늘이 마지막 날이야. 유예가 끝난 후 분석해도 충분해.',
  },
  self_reflection: {
    1: '아직 너 자신을 깊이 묻기엔 일러. 첫 24시간은 그냥 지나가도 돼. 그래도 둘러볼래?',
    2: '감정이 출렁이는 시점이야. 자기 인식은 좀 더 안정된 후가 좋아. 그래도 들어갈래?',
    3: '분노 단계일 수 있는 시점이야. 지금 자신에 대한 답이 나중에 다르게 보일 수 있어.',
    4: '슬픔이 깊은 시점이야. 자기 비난으로 흐를 수 있어. 일주일 후가 더 좋아.',
    5: '거의 다 왔어. 3일만 더 기다려봐.',
    6: '내일이면 일주일이야. 내일부터 자기 성찰 가능해.',
    7: '오늘이 마지막 날이야. 내일부터 정상 진입.',
  },
};

export function CoolingOffWarningModal({
  visible,
  day,
  context,
  onProceed,
  onCancel,
}: CoolingOffWarningModalProps) {
  const clampedDay = Math.min(7, Math.max(1, day)) as keyof typeof MESSAGES.analysis;
  const message = MESSAGES[context][clampedDay];

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title="혹시 너무 서둘렀나?"
      description={message}
      primaryLabel="계속할게"
      onPrimary={onProceed}
      secondaryLabel="잠깐, 돌아갈게"
      onSecondary={onCancel}
    >
      <View className="mb-2">
        <Caption className="text-purple-400">
          ✓ 이 분석은 7일째에 정확해질 거야.
        </Caption>
      </View>
    </Modal>
  );
}
