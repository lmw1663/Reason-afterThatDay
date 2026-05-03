import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { classifyAndSavePersona } from '@/api/persona';
import { recordCrisisAssessment, type CrisisResponses } from '@/api/safety';
import type { OnboardingResponses, PsychAxes } from '@/utils/personaClassifier';
import { PERSONA_INTRO_CARDS } from '@/constants/personaIntroCards';

/**
 * 페르소나 온보딩 — C-1-3
 *
 * Q1~Q6 (페르소나 식별) + C-SSRS 3항 (위기 평가). 단일 화면에서 step state로 전환.
 * "지금은 여기까지" 옵션은 4번째 step부터 노출 (검증 §2-10 회피형 피로 차단).
 *
 * 사별 옵션 없음 (C-1-2). C-SSRS 양성 시 위기 모드 진입.
 */

type Choice<V extends string> = { value: V; label: string };

const Q1_CHOICES: Choice<OnboardingResponses['q1_initiator']>[] = [
  { value: 'self',    label: '내가 끝냈어' },
  { value: 'partner', label: '상대가 끝냈어' },
  { value: 'mutual',  label: '합의로 끝났어' },
  { value: 'ghosted', label: '잘 모르겠어 / 잠수당했어' },
];

const Q2_CHOICES: Choice<OnboardingResponses['q2_thought']>[] = [
  { value: 'too_sensitive',     label: '"내가 너무 예민한 건가?"' },
  { value: 'alone_better',      label: '"혼자가 더 편했을지도"' },
  { value: 'cant_live_without', label: '"이 사람 없으면 못 살아"' },
  { value: 'why_repeat',        label: '"왜 자꾸 같은 일이 반복되지"' },
  { value: 'none',              label: '해당 없음' },
];

const Q3_CHOICES: Choice<OnboardingResponses['q3_count']>[] = [
  { value: 'first',                label: '처음이야' },
  { value: 'second_or_third',      label: '두세 번째' },
  { value: 'same_person_multiple', label: '같은 사람과 여러 번' },
  { value: 'multiple_different',   label: '여러 번이지만 다 다른 사람' },
];

const Q4_CHOICES: Choice<OnboardingResponses['q4_duration_range']>[] = [
  { value: '<6m',   label: '6개월 미만' },
  { value: '6m-2y', label: '6개월 ~ 2년' },
  { value: '2y-5y', label: '2년 ~ 5년' },
  { value: '5y+',   label: '5년 이상' },
];

const Q5_CHOICES: Choice<OnboardingResponses['q5_emotion']>[] = [
  { value: 'anger',   label: '화가 나 / 분해' },
  { value: 'empty',   label: '멍하고 비어 있어' },
  { value: 'longing', label: '보고 싶고 매달리고 싶어' },
  { value: 'guilt',   label: '미안해 / 죄책감이 들어' },
  { value: 'unsure',  label: '사실 잘 모르겠어' },
];

const COMPLEXITY_CHOICES: Choice<OnboardingResponses['q_complexity']>[] = [
  { value: 'none',          label: '없어' },
  { value: 'shared_circle', label: '같은 직장·동아리·친구 그룹이야' },
  { value: 'cohabitation',  label: '함께 살던 집·짐을 정리해야 해' },
  { value: 'marriage',      label: '결혼 관계였어' },
];

const REASON_CHOICES: Choice<OnboardingResponses['q_breakup_reason']>[] = [
  { value: 'mutual', label: '점진적으로 / 합의로' },
  { value: 'sudden', label: '갑자기 / 통보로' },
  { value: 'forced', label: '가족 반대·이주 등 외부 요인' },
];

type Step =
  | 'q1' | 'q2' | 'q3' | 'q4_duration' | 'q4_married' | 'q5'
  | 'q6' | 'q_self_infidelity' | 'q_complexity' | 'q_breakup_reason'
  | 'crisis_q1' | 'crisis_q2' | 'crisis_q3'
  | 'classifying';

const FATIGUE_OPTION_FROM_INDEX = 4;  // 4번째 step부터 "지금은 여기까지" 노출

export default function PersonaOnboardingScreen() {
  const { userId, setOnboardingCompleted } = useUserStore();
  const setPersona = usePersonaStore(s => s.setPersona);

  const [step, setStep] = useState<Step>('q1');
  const [r, setR] = useState<Partial<OnboardingResponses>>({});
  const [crisis, setCrisis] = useState<CrisisResponses>({
    q1: false, q2: false, q3: false, q4: false, q5: false, q6: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = useMemo(() => STEP_ORDER.indexOf(step), [step]);
  // C-SSRS·classifying 단계에선 fatigue option 비노출 — 안전 평가 우회 차단.
  const showFatigueOption =
    stepIndex >= FATIGUE_OPTION_FROM_INDEX &&
    step !== 'classifying' &&
    !step.startsWith('crisis_');

  function pick<K extends keyof OnboardingResponses>(key: K, value: OnboardingResponses[K]) {
    setR(prev => ({ ...prev, [key]: value }));
    advance();
  }

  function pickCrisis<K extends keyof CrisisResponses>(key: K, value: boolean) {
    setCrisis(prev => ({ ...prev, [key]: value }));
    advance();
  }

  function advance() {
    const next = nextStep(step, { ...r });
    setStep(next);
    if (next === 'classifying') void runClassification();
  }

  async function runClassification() {
    if (!userId) return;
    setSubmitting(true);
    try {
      // C-SSRS 응답 기록 — severity가 high/urgent면 잠금 자동 생성 (B-1)
      const crisisResult = await recordCrisisAssessment(userId, { source: 'onboarding', responses: crisis });

      const responses = buildResponses(r);
      const axes = inferAxes(responses, crisis);

      const result = await classifyAndSavePersona(userId, { responses, axes }, 'onboarding');
      if (result.mode === 'standard') {
        setPersona({ primary: result.primary, secondary: result.secondary, estimatedAt: new Date() });
      }
      setOnboardingCompleted(true);

      // 위기 사용자는 홈 대신 안전 해제 흐름으로 직행 — CLAUDE.md 위기 신호 절대 규칙.
      // /safety/release 화면이 24h 경과 + 안전 4문항 통과 시까지 사용자를 안전 자원에 머물게 함.
      if (crisisResult.severity === 'urgent' || crisisResult.severity === 'high') {
        router.replace('/safety/release' as never);
        return;
      }

      // C-2-G-1: 페르소나에 사전 안내 카드가 있으면 1화면 강제 노출 후 홈으로.
      // baseline(P02·P12 등)은 안내 카드 없음 → 홈 직진.
      if (result.mode === 'standard' && PERSONA_INTRO_CARDS[result.primary]) {
        router.replace('/onboarding/persona/intro' as never);
      } else {
        router.replace('/(tabs)' as never);
      }
    } catch (e) {
      console.warn('[persona-onboarding] classify failed:', e);
      Alert.alert('잠시 후 다시 시도해줘', '분류 중 문제가 생겼어');
      setStep('q1');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFatigueOption() {
    // C-SSRS 우회 차단 — 페르소나 질문은 건너뛸 수 있어도 안전 평가는 *반드시* 통과해야 함.
    // 일반 질문 단계(q5~q_breakup_reason)에서 fatigue 누르면 → C-SSRS로 점프 → 통과 후 분류·종료.
    Alert.alert(
      '지금은 여기까지',
      '나머지 페르소나 질문은 다음에 다시 만나서 물어볼게.\n다만 안전 확인 3개만 마저 부탁할게.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '안전 확인만 마저 할게',
          onPress: () => setStep('crisis_q1'),
        },
      ],
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">너에 대해 — {stepIndex + 1} / {STEP_ORDER.length}</Caption>
        {step === 'q1' && (
          <SingleChoice title="이번 이별은 누가 결정했어?" choices={Q1_CHOICES} onPick={v => pick('q1_initiator', v)} />
        )}
        {step === 'q2' && (
          <SingleChoice title="관계 중에 자주 들었거나 떠올랐던 말은?" choices={Q2_CHOICES} onPick={v => pick('q2_thought', v)} />
        )}
        {step === 'q3' && (
          <SingleChoice title="이번이 몇 번째 진지한 이별이야?" choices={Q3_CHOICES} onPick={v => pick('q3_count', v)} />
        )}
        {step === 'q4_duration' && (
          <SingleChoice title="관계는 얼마나 지속됐어?" choices={Q4_CHOICES} onPick={v => pick('q4_duration_range', v)} />
        )}
        {step === 'q4_married' && (
          <SingleChoice
            title="혹시 결혼한 사이였어?"
            choices={[{ value: 'no', label: '아니야' }, { value: 'yes', label: '응' }]}
            onPick={v => pick('q4_married', v === 'yes')}
          />
        )}
        {step === 'q5' && (
          <SingleChoice title="지금 가장 가까운 마음은?" choices={Q5_CHOICES} onPick={v => pick('q5_emotion', v)} />
        )}
        {step === 'q6' && (
          <SingleChoice
            title="혹시 관계 중에 *내 기억과 상대 말이 자주 달랐던* 경험이 있어?"
            choices={[{ value: 'no', label: '아니야 / 가끔' }, { value: 'yes', label: '응, 자주 그랬어' }]}
            onPick={v => pick('q6_memory_diverged', v === 'yes')}
          />
        )}
        {step === 'q_self_infidelity' && (
          <SingleChoice
            title="이별의 원인 중 *내가 외도한* 부분이 있었어?"
            choices={[{ value: 'no', label: '없어' }, { value: 'yes', label: '있어' }]}
            onPick={v => pick('q_self_infidelity', v === 'yes')}
          />
        )}
        {step === 'q_complexity' && (
          <SingleChoice title="너희 관계는 외부적으로 얽힘이 있었어?" choices={COMPLEXITY_CHOICES} onPick={v => pick('q_complexity', v)} />
        )}
        {step === 'q_breakup_reason' && (
          <SingleChoice title="이별의 결은 어땠어?" choices={REASON_CHOICES} onPick={v => pick('q_breakup_reason', v)} />
        )}

        {step === 'crisis_q1' && (
          <SingleChoice
            title='최근에 "차라리 사라졌으면 좋겠다" 같은 생각이 들었어?'
            choices={[{ value: 'no', label: '아니야' }, { value: 'yes', label: '응' }]}
            onPick={v => pickCrisis('q1', v === 'yes')}
          />
        )}
        {step === 'crisis_q2' && (
          <SingleChoice
            title='자해나 자살에 대해 *적극적으로* 생각해본 적 있어?'
            choices={[{ value: 'no', label: '아니야' }, { value: 'yes', label: '응' }]}
            onPick={v => pickCrisis('q2', v === 'yes')}
          />
        )}
        {step === 'crisis_q3' && (
          <SingleChoice
            title='구체적인 방법까지 떠올려봤어?'
            choices={[{ value: 'no', label: '아니야' }, { value: 'yes', label: '응' }]}
            onPick={v => pickCrisis('q3', v === 'yes')}
          />
        )}

        {step === 'classifying' && (
          <View>
            <Display className="mb-2">너에 대해 정리하는 중</Display>
            <Body className="text-gray-400">잠깐만 기다려줘</Body>
          </View>
        )}

        {showFatigueOption && (
          <Pressable
            onPress={handleFatigueOption}
            accessibilityRole="button"
            accessibilityLabel="지금은 여기까지"
            className="mt-6"
          >
            <Caption className="text-center text-gray-500 py-3">지금은 여기까지 ›</Caption>
          </Pressable>
        )}
      </ScrollView>

      {submitting && (
        <View className="px-6 pb-10">
          <PrimaryButton label="처리 중…" onPress={() => {}} loading />
        </View>
      )}
    </ScreenWrapper>
  );
}

interface SingleChoiceProps<V extends string> {
  title: string;
  choices: Choice<V>[];
  onPick: (v: V) => void;
}

function SingleChoice<V extends string>({ title, choices, onPick }: SingleChoiceProps<V>) {
  return (
    <View>
      <Display className="mb-6">{title}</Display>
      <View className="gap-2">
        {choices.map(c => (
          <Pressable
            key={c.value}
            onPress={() => onPick(c.value)}
            accessibilityRole="button"
            accessibilityLabel={c.label}
            className="active:opacity-80"
          >
            <Card className="p-4 flex-row items-center">
              <Body className="flex-1">{c.label}</Body>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ──────────── 흐름 제어 ──────────── */

const STEP_ORDER: Step[] = [
  'q1', 'q2', 'q3', 'q4_duration', 'q4_married', 'q5',
  'q6', 'q_self_infidelity', 'q_complexity', 'q_breakup_reason',
  'crisis_q1', 'crisis_q2', 'crisis_q3', 'classifying',
];

function nextStep(current: Step, r: Partial<OnboardingResponses>): Step {
  switch (current) {
    case 'q1': return 'q2';
    case 'q2': return 'q3';
    case 'q3': return 'q4_duration';
    case 'q4_duration': return 'q4_married';
    case 'q4_married': return 'q5';
    case 'q5':
      // Q2 ① 양성 시만 Q6 묻기, 아니면 건너뛰기
      return r.q2_thought === 'too_sensitive' ? 'q6' : 'q_self_infidelity';
    case 'q6': return 'q_self_infidelity';
    case 'q_self_infidelity': return 'q_complexity';
    case 'q_complexity': return 'q_breakup_reason';
    case 'q_breakup_reason': return 'crisis_q1';
    case 'crisis_q1': return 'crisis_q2';
    case 'crisis_q2': return 'crisis_q3';
    case 'crisis_q3': return 'classifying';
    default: return current;
  }
}

function buildResponses(r: Partial<OnboardingResponses>): OnboardingResponses {
  return {
    q1_initiator: r.q1_initiator ?? 'mutual',
    q2_thought: r.q2_thought ?? 'none',
    q3_count: r.q3_count ?? 'second_or_third',
    q4_duration_range: r.q4_duration_range ?? '6m-2y',
    q4_married: r.q4_married ?? false,
    q5_emotion: r.q5_emotion ?? 'unsure',
    q6_memory_diverged: r.q6_memory_diverged,
    q_self_infidelity: r.q_self_infidelity ?? false,
    q_complexity: r.q_complexity ?? 'none',
    q_breakup_reason: r.q_breakup_reason ?? 'mutual',
  };
}

/**
 * 8축 추정 (응답 기반). ECR-R/RRS 라이선스 미확인 상태라 a1_attachment는 q5/q2에서 휴리스틱 추정.
 * 라이선스 회신 후 본 함수에서 ECR-R 점수로 a1 정확화.
 */
function inferAxes(r: OnboardingResponses, crisis: CrisisResponses): PsychAxes {
  const a8 = (crisis.q4 || crisis.q5 || crisis.q6) ? 3 : (crisis.q2 || crisis.q3) ? 2 : crisis.q1 ? 1 : 0;
  return {
    a1_attachment: r.q2_thought === 'cant_live_without' ? 1 : r.q2_thought === 'alone_better' ? 2 : 0,
    a2_initiator: r.q1_initiator === 'mutual' ? 0 : r.q1_initiator === 'self' ? 1 : r.q1_initiator === 'partner' ? 2 : 3,
    a3_breakup_mode: r.q_breakup_reason === 'sudden' ? 2 : r.q_breakup_reason === 'forced' ? 3 : 0,
    a4_duration: r.q4_duration_range === '<6m' ? 0 : r.q4_duration_range === '6m-2y' ? 1 : r.q4_duration_range === '2y-5y' ? 2 : 3,
    a5_health: r.q2_thought === 'too_sensitive' && r.q6_memory_diverged ? 3 : r.q_self_infidelity ? 2 : 0,
    a6_complexity: r.q_complexity === 'marriage' || r.q4_married ? 3 : r.q_complexity === 'cohabitation' ? 2 : r.q_complexity === 'shared_circle' ? 1 : 0,
    a7_dominant_emotion: r.q5_emotion === 'anger' ? 1 : r.q5_emotion === 'guilt' ? 2 : r.q5_emotion === 'empty' ? 3 : r.q5_emotion === 'unsure' ? 4 : 0,
    a8_crisis: a8 as 0 | 1 | 2 | 3,
  };
}
