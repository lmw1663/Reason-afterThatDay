import { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Caption, Heading } from './ui/Typography';
import { PrimaryButton } from './ui/PrimaryButton';
import { MoodSlider } from './ui/MoodSlider';
import { BreathingGuide } from './BreathingGuide';
import { addIntrusiveMemoryResponse } from '@/api/intrusiveMemory';
import { useUserStore } from '@/store/useUserStore';
import { colors } from '@/constants/colors';

interface IntrusiveMemoryModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function IntrusiveMemoryModal({ visible, onClose }: IntrusiveMemoryModalProps) {
  const { userId } = useUserStore();
  const [step, setStep] = useState<Step>(1);
  const [moodScore, setMoodScore] = useState(5);
  const [thoughtText, setThoughtText] = useState('');
  const [saving, setSaving] = useState(false);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!visible) {
      setStep(1);
      setMoodScore(5);
      setThoughtText('');
    }
  }, [visible]);

  // step 2: 마인드풀니스 문장 2초 후 step 3으로
  useEffect(() => {
    if (step !== 2) return;
    const timer = setTimeout(() => setStep(3), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  async function handleSave() {
    setSaving(true);
    try {
      if (userId) {
        await addIntrusiveMemoryResponse({
          userId,
          moodScore,
          thoughtText: thoughtText.trim() || undefined,
        });
      }
    } catch {
      // 저장 실패 시 UX 차단 없이 진행
    } finally {
      setSaving(false);
      setStep(4);
    }
  }

  function handleGoJournal() {
    onClose();
    router.push('/journal');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.overlayBackdropDark }}
        onPress={step === 4 ? onClose : undefined}
      >
        <Pressable
          className="w-full rounded-2xl p-6"
          style={{ backgroundColor: colors.surface }}
          onPress={(e) => e.stopPropagation()}
        >
          {step === 1 && (
            <>
              <Heading className="mb-6 text-center">잠깐, 숨 한 번만</Heading>
              <BreathingGuide pattern="quick" onComplete={() => setStep(2)} />
            </>
          )}

          {step === 2 && (
            <View className="py-8 items-center">
              <Body className="text-gray-200 text-center leading-relaxed">
                그 기억은 사실이지만,{'\n'}
                지금의 너는 그 기억 속이 아니야.
              </Body>
            </View>
          )}

          {step === 3 && (
            <>
              <Heading className="mb-4">잠깐, 기록해볼게</Heading>
              <Caption className="text-gray-500 mb-4">선택사항이야, 건너뛰어도 돼</Caption>

              <Body className="text-gray-300 mb-2">어떤 생각이 떠올랐어?</Body>
              <TextInput
                value={thoughtText}
                onChangeText={setThoughtText}
                placeholder="예: 같이 갔던 카페, 마지막으로 했던 말..."
                placeholderTextColor={colors.gray[600]}
                multiline
                className="text-white text-sm leading-relaxed mb-4"
                style={{
                  minHeight: 60,
                  backgroundColor: colors.bg ?? '#0A0A0B',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                }}
              />

              <Body className="text-gray-300 mb-2">지금 기분이 어때?</Body>
              <MoodSlider value={moodScore} onChange={setMoodScore} />
              <View className="mt-6">
                <PrimaryButton
                  label="기록하기"
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </>
          )}

          {step === 4 && (
            <View className="py-4">
              <Heading className="mb-2 text-center">기록됐어.</Heading>
              <Caption className="text-gray-400 text-center mb-6">고마워.</Caption>
              <View className="gap-3">
                <PrimaryButton label="일기 쓰러 가기" onPress={handleGoJournal} />
                <PrimaryButton label="뒤로 가기" variant="ghost" onPress={onClose} />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
