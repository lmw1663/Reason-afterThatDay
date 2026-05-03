import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Modal } from './ui/Modal';
import { Body, Caption, Heading } from './ui/Typography';
import { PrimaryButton } from './ui/PrimaryButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import {
  recordCrisisAssessment,
  type CrisisResponses,
  type CrisisSeverity,
} from '@/api/safety';
import { getHotlinesForPersona, type Hotline } from '@/utils/crisisHotlines';
import { usePersonaStore } from '@/store/usePersonaStore';

/**
 * 위기 모달 트리거 타입.
 *
 * - consecutive_low: 3일 연속 mood_score 1~2점 (기존 안전장치 7-4)
 * - late_night: 새벽(00~04시) 진입 (기존 안전장치 7-4)
 * - crisis_screen: C-SSRS 6항 평가 4단계 흐름 (B-1)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO C-1-2 후속: 사별 키워드 감지 안전망 (별도 task)
 * ─────────────────────────────────────────────────────────────────────────
 * 본 앱은 이별 회복 도메인이라 사별(P13)을 페르소나로 분류하지 않지만,
 * *우연 진입한 사별 사용자*가 일기에 사망 관련 표현을 적을 때 안전망이 필요.
 *
 * 구현 단계:
 *  1. EmotionalCheckType union에 'bereavement_keyword_in_journal' 추가
 *  2. utils/journalNlp.ts (신규) — checkBereavementKeywords(text: string): boolean
 *     키워드 후보(한국어): "사망", "돌아가셨", "장례", "장례식", "기일", "유서", "추모", "고인"
 *     (false positive 최소화 위해 *문맥 보정* 필요 — 예: "장례문화" 등 일반 단어 제외)
 *  3. hooks/useEmotionalSafety.ts에 checkBereavementKeyword 추가 — 일기 저장 직후 호출
 *  4. 본 모달의 SIMPLE_MESSAGES에 'bereavement_keyword_in_journal' 케이스 추가 —
 *     "사별의 슬픔은 결이 달라" + `crisis-hotlines.json`의 `grief_clinic_referral` 자원 1탭 안내
 *  5. CrisisScreenFlow와 분리 — 키워드 트리거는 *안내*만, C-SSRS 평가는 강제하지 않음
 *
 * 우선순위: P2 (C-1-2가 도메인 정책만 정리, 안전망 구현은 별도). Phase D 또는 E에서 일정.
 */
export type EmotionalCheckType = 'consecutive_low' | 'late_night' | 'crisis_screen';

interface EmotionalCheckModalProps {
  type: EmotionalCheckType;
  visible: boolean;
  onClose: () => void;
}

const SIMPLE_MESSAGES = {
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
} as const;

export function EmotionalCheckModal({ type, visible, onClose }: EmotionalCheckModalProps) {
  if (type === 'crisis_screen') {
    return <CrisisScreenFlow visible={visible} onClose={onClose} />;
  }

  const config = SIMPLE_MESSAGES[type];

  function handlePrimary() {
    onClose();
    if (type === 'consecutive_low') {
      router.push('/resources/hotline' as never);
    } else {
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

/* ─────────────────────────────────────────────────────────────────────────
 * crisis_screen 4단계 흐름 — B-1
 *
 * step1: C-SSRS 1~3항 묻기 (수동·능동·수단)
 * step2: (양성 시) 4~6항 묻기 (의도·계획·최근 시도)
 * step3: 현재 안전 확인 (옆에 사람 / 안전한 장소)
 * step4: severity별 자원 노출 (urgent → 원터치 1393, high → 핫라인+알림, caution → 자원 카드)
 *
 * 모달은 *닫기*로 종료되지 않는다 (충동적 닫기 방지).
 * urgent/high는 잠금이 별도로 생성되어 acknowledgeLockout 화면(/safety/release)에서만 해제.
 * ───────────────────────────────────────────────────────────────────────── */

type Step = 1 | 2 | 3 | 4;

function CrisisScreenFlow({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { userId } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const [step, setStep] = useState<Step>(1);
  const [responses, setResponses] = useState<CrisisResponses>({
    q1: false, q2: false, q3: false, q4: false, q5: false, q6: false,
  });
  const [severity, setSeverity] = useState<CrisisSeverity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);

  useEffect(() => {
    if (visible) {
      // 모달 열릴 때마다 초기화
      setStep(1);
      setResponses({ q1: false, q2: false, q3: false, q4: false, q5: false, q6: false });
      setSeverity(null);
    }
  }, [visible]);

  function setResponse<K extends keyof CrisisResponses>(key: K, value: boolean) {
    setResponses(prev => ({ ...prev, [key]: value }));
  }

  async function handleNextFromStep1() {
    // q1·q2·q3 중 하나라도 양성이면 step2로, 모두 음성이면 step3로 (step2 건너뛰기)
    if (responses.q1 || responses.q2 || responses.q3) {
      setStep(2);
    } else {
      setStep(3);
    }
  }

  async function handleNextFromStep2() {
    setStep(3);
  }

  async function handleNextFromStep3() {
    if (!userId) return;
    setSubmitting(true);
    try {
      const result = await recordCrisisAssessment(userId, {
        source: 'modal_trigger',
        responses,
      });
      setSeverity(result.severity);
      // C-2-G-10: 페르소나별 우선 핫라인 매핑 적용. 페르소나 미정 시 baseline.
      setHotlines(getHotlinesForPersona(personaPrimary));
      setStep(4);
    } catch (e) {
      // 잠금 생성 실패 등 안전 인프라 장애 — silent 금지. 사용자에게 즉시 안내 + 직접 전화 옵션.
      console.error('[crisis] assessment/lockout failed:', e);
      const message = e instanceof Error ? e.message : '안전 처리 중 문제가 생겼어.';
      Alert.alert(
        '잠시만, 직접 연결해줄게',
        `${message}\n\n지금 바로 1393에 전화해줘. 24시간 가능하고 비밀이 보장돼.`,
        [
          { text: '1393 전화', onPress: () => Linking.openURL('tel:1393') },
          { text: '닫기', style: 'cancel', onPress: onClose },
        ],
        { cancelable: false },
      );
    } finally {
      setSubmitting(false);
    }
  }

  function callHotline(number: string) {
    Linking.openURL(`tel:${number}`);
  }

  // step 1~3 동안에는 backdrop·하드백으로 닫히지 않음 (충동적 회피 차단).
  // step 4(자원 노출)에서는 닫기 허용 — 이미 평가/잠금이 기록됐고 release 화면 안내 후라.
  const dismissable = step === 4;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={undefined}
      description={undefined}
      dismissable={dismissable}
    >
      {step === 1 && (
        <View>
          <Heading className="mb-2">잠시 너의 마음을 확인할게</Heading>
          <Body className="text-gray-300 mb-4 leading-6">
            정말 솔직하게 답해줘.{'\n'}
            대답에 따라 옆에 있어줄 사람을 안내해줄게.
          </Body>
          <YesNoQuestion
            label='최근에 "차라리 사라졌으면 좋겠다" 같은 생각이 들었어?'
            value={responses.q1}
            onChange={v => setResponse('q1', v)}
          />
          <YesNoQuestion
            label="자해나 자살에 대해 *적극적으로* 생각해본 적 있어?"
            value={responses.q2}
            onChange={v => setResponse('q2', v)}
          />
          <YesNoQuestion
            label="구체적인 방법까지 떠올려봤어?"
            value={responses.q3}
            onChange={v => setResponse('q3', v)}
          />
          <PrimaryButton label="다음" onPress={handleNextFromStep1} />
        </View>
      )}

      {step === 2 && (
        <View>
          <Heading className="mb-2">조금만 더 물어볼게</Heading>
          <Body className="text-gray-300 mb-4 leading-6">
            힘들겠지만 안전을 위해 필요한 질문이야.
          </Body>
          <YesNoQuestion
            label="실제로 실행할 의도가 있었어?"
            value={responses.q4}
            onChange={v => setResponse('q4', v)}
          />
          <YesNoQuestion
            label="시간·장소·방법까지 구체적으로 계획해본 적 있어?"
            value={responses.q5}
            onChange={v => setResponse('q5', v)}
          />
          <YesNoQuestion
            label="지난 3개월 안에 시도한 적 있어?"
            value={responses.q6}
            onChange={v => setResponse('q6', v)}
          />
          <PrimaryButton label="다음" onPress={handleNextFromStep2} />
        </View>
      )}

      {step === 3 && (
        <View>
          <Heading className="mb-2">지금 안전해?</Heading>
          <Body className="text-gray-300 mb-4 leading-6">
            지금 옆에 사람이 있거나 안전한 장소에 있어?{'\n'}
            네 답을 듣고 도움을 안내할게.
          </Body>
          <PrimaryButton
            label={submitting ? '잠시만…' : '안내받기'}
            onPress={handleNextFromStep3}
            loading={submitting}
          />
        </View>
      )}

      {step === 4 && severity && (
        <View>
          <Heading className="mb-2">
            {severity === 'urgent' || severity === 'high' ? '지금 바로 연결해줄게' : '필요할 때 여기로'}
          </Heading>
          <Body className="text-gray-300 mb-4 leading-6">
            {severity === 'urgent'
              ? '지금 바로 1393에 전화해줘. 24시간 가능하고 비밀이 보장돼.'
              : severity === 'high'
                ? '아래 전화로 바로 연결돼. 통화가 어려우면 누군가에게 옆에 있어달라 말해도 돼.'
                : '아래 자원이 필요할 때 도움이 될 거야. 지금이 아니어도 괜찮아.'}
          </Body>

          <View className="gap-2 mb-4">
            {hotlines.map(h => (
              <Card key={h.id} className="p-3">
                <Body className="font-semibold mb-1">{h.name}</Body>
                {h.number && (
                  <Pressable
                    onPress={() => callHotline(h.number!)}
                    accessibilityRole="button"
                    accessibilityLabel={`${h.name} 전화 걸기 ${h.number}`}
                    className="active:opacity-70 flex-row items-center gap-2"
                  >
                    <Icon name="bell" size={16} color={colors.purple[400]} />
                    <Body className="text-purple-400 font-bold">{h.number}</Body>
                  </Pressable>
                )}
                <Caption className="text-gray-500 mt-1">{h.description}</Caption>
              </Card>
            ))}
          </View>

          {(severity === 'urgent' || severity === 'high') ? (
            <View>
              <PrimaryButton
                label="해제 절차로 가기"
                onPress={() => {
                  onClose();
                  router.push('/safety/release' as never);
                }}
              />
              <Caption className="text-center text-gray-500 mt-2 leading-5">
                안전한 마음이 들 때, 해제 절차에서 다시 만나자.
              </Caption>
            </View>
          ) : (
            <PrimaryButton label="알겠어" onPress={onClose} />
          )}
        </View>
      )}
    </Modal>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="mb-4">
      <Body className="text-gray-200 mb-2 leading-6">{label}</Body>
      <View className="flex-row gap-2">
        <ToggleButton label="응" selected={value} onPress={() => onChange(true)} />
        <ToggleButton label="아니야" selected={!value} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

function ToggleButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-1 rounded-xl py-2.5 active:opacity-80"
      style={{
        backgroundColor: selected ? colors.purple[400] : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.purple[400] : colors.border,
      }}
    >
      <Body className="text-center font-medium" style={{ color: selected ? colors.white : colors.gray[400] }}>
        {label}
      </Body>
    </Pressable>
  );
}
