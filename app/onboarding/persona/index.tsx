import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { classifyAndSavePersona } from '@/api/persona';
import { recordAssessment } from '@/api/assessments';
import { recordCrisisAssessment, type CrisisResponses } from '@/api/safety';
import type { OnboardingResponses, PsychAxes } from '@/utils/personaClassifier';
import type { DurationRange } from '@/constants/duration';
import { PERSONA_INTRO_CARDS } from '@/constants/personaIntroCards';
import { useScreenView } from '@/hooks/useScreenView';
import { shortFormScoreToAxis } from '@/utils/scoring';

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
];

const REASON_CHOICES: Choice<OnboardingResponses['q_breakup_reason']>[] = [
  { value: 'mutual', label: '점진적으로 / 합의로' },
  { value: 'sudden', label: '갑자기 / 통보로' },
  { value: 'forced', label: '가족 반대·이주 등 외부 요인' },
];

// PHQ-2 / GAD-2 단축형 — 표준 4단계 빈도 응답.
// 임상 1차 스크리닝 도구로 공중 도메인. 정식 PHQ-9/GAD-7는 D+7 이후 옵트인 검사로 제공.
type FreqLevel = '0' | '1' | '2' | '3';

const FREQ_CHOICES: Choice<FreqLevel>[] = [
  { value: '0', label: '거의 없었어' },
  { value: '1', label: '며칠 그랬어' },
  { value: '2', label: '일주일 넘게 그랬어' },
  { value: '3', label: '거의 매일 그랬어' },
];

type AssessmentKey = 'phq2_q1' | 'phq2_q2' | 'gad2_q1' | 'gad2_q2';
type AssessmentResponses = Partial<Record<AssessmentKey, FreqLevel>>;

type Step =
  | 'q1' | 'q2' | 'q3' | 'q5'
  | 'q6' | 'q_self_infidelity' | 'q_complexity' | 'q_breakup_reason'
  | 'phq2_q1' | 'phq2_q2' | 'gad2_q1' | 'gad2_q2'
  | 'crisis_q1' | 'crisis_q2' | 'crisis_q3'
  | 'classifying';

const FATIGUE_OPTION_FROM_INDEX = 4;  // 4번째 step부터 "지금은 여기까지" 노출

export default function PersonaOnboardingScreen() {
  const { userId, relationshipDuration, setOnboardingCompleted } = useUserStore();
  const setPersona = usePersonaStore(s => s.setPersona);

  useScreenView('onboarding_persona');

  const [step, setStep] = useState<Step>('q1');
  const [r, setR] = useState<Partial<OnboardingResponses>>({});
  const [crisis, setCrisis] = useState<CrisisResponses>({
    q1: false, q2: false, q3: false, q4: false, q5: false, q6: false,
  });
  const [includeAssessment, setIncludeAssessment] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResponses>({});
  const [submitting, setSubmitting] = useState(false);

  // 정밀 검사 토글에 따라 step 순서가 달라짐 — q_breakup_reason 후 PHQ-2/GAD-2 4문항 끼워넣음.
  const stepOrder = useMemo<Step[]>(() => (
    includeAssessment
      ? [...STEP_ORDER_BASE, ...STEP_ORDER_ASSESSMENT, ...STEP_ORDER_CRISIS]
      : [...STEP_ORDER_BASE, ...STEP_ORDER_CRISIS]
  ), [includeAssessment]);

  const stepIndex = useMemo(() => stepOrder.indexOf(step), [stepOrder, step]);
  // C-SSRS·classifying 단계에선 fatigue option 비노출 — 안전 평가 우회 차단.
  const showFatigueOption =
    stepIndex >= FATIGUE_OPTION_FROM_INDEX &&
    step !== 'classifying' &&
    !step.startsWith('crisis_');

  function pick<K extends keyof OnboardingResponses>(key: K, value: OnboardingResponses[K]) {
    const updatedR = { ...r, [key]: value };
    setR(updatedR);
    advance(updatedR, crisis, assessment);
  }

  function pickCrisis<K extends keyof CrisisResponses>(key: K, value: boolean) {
    const updatedCrisis = { ...crisis, [key]: value };
    setCrisis(updatedCrisis);
    advance(r, updatedCrisis, assessment);
  }

  function pickAssessment(key: AssessmentKey, value: FreqLevel) {
    const updated = { ...assessment, [key]: value };
    setAssessment(updated);
    advance(r, crisis, updated);
  }

  // setR/setCrisis/setAssessment가 비동기라 closure가 stale한 값을 잡지 않도록 *최신 응답을 명시 전달*.
  // 특히 C-SSRS는 마지막 응답이 누락되면 위험도 평가가 틀어져 안전 잠금까지 영향받음.
  // assessment도 마지막 GAD-2 응답이 axes 계산에 포함돼야 분류 정확 — Phase H.
  // includeAssessment는 q1 단계에서만 변경되므로 stale 문제 없음.
  function advance(
    currentR: Partial<OnboardingResponses>,
    currentCrisis: CrisisResponses,
    currentAssessment: AssessmentResponses,
  ) {
    const next = nextStep(step, currentR, currentCrisis, includeAssessment);
    setStep(next);
    if (next === 'classifying') void runClassification(currentR, currentCrisis, currentAssessment);
  }

  async function runClassification(
    currentR: Partial<OnboardingResponses>,
    currentCrisis: CrisisResponses,
    currentAssessment: AssessmentResponses,
  ) {
    if (!userId) return;
    setSubmitting(true);
    try {
      // 정밀 검사 옵트인 응답을 axes에 통합 (a9/a10) + psych_assessments에 raw 저장 (Phase H).
      // raw 저장은 fire-and-forget — 실패해도 분류 진행 (시계열 추적·D+7 권유 트리거용 보조 데이터).
      // PHQ/GAD 점수는 민감 정보 — production 번들에 누출되지 않도록 __DEV__ 가드 필수.
      if (includeAssessment) {
        if (__DEV__) {
          const phqScore = scoreFreq(currentAssessment.phq2_q1) + scoreFreq(currentAssessment.phq2_q2);
          const gadScore = scoreFreq(currentAssessment.gad2_q1) + scoreFreq(currentAssessment.gad2_q2);
          console.log('[onboarding] assessment scores — PHQ-2:', phqScore, 'GAD-2:', gadScore);
        }
        void persistShortFormAssessments(userId, currentAssessment);
      }

      // C-SSRS 응답 기록 — severity가 high/urgent면 잠금 자동 생성 (B-1)
      const crisisResult = await recordCrisisAssessment(userId, { source: 'onboarding', responses: currentCrisis });

      const responses = buildResponses(currentR, relationshipDuration);
      const axes = inferAxes(responses, currentCrisis, includeAssessment ? currentAssessment : undefined);

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
        <Caption className="mb-2">너에 대해 — {stepIndex + 1} / {stepOrder.length}</Caption>
        {step === 'q1' && (
          <>
            <SingleChoice title="이번 이별은 누가 결정했어?" choices={Q1_CHOICES} onPick={v => pick('q1_initiator', v)} />
            <Pressable
              onPress={() => setIncludeAssessment(v => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeAssessment }}
              accessibilityLabel="정밀 검사 함께 받기"
              className="mt-6 py-3"
            >
              <Caption className={includeAssessment ? 'text-center text-purple-400' : 'text-center text-gray-500'}>
                {includeAssessment
                  ? '정밀 검사 4문항 추가됨 — 다시 누르면 해제'
                  : '정밀 검사도 함께 받을래 (4문항 추가)'}
              </Caption>
            </Pressable>
          </>
        )}
        {step === 'q2' && (
          <SingleChoice title="사귀는 도중에 자주 들었거나 떠올랐던 말은?" choices={Q2_CHOICES} onPick={v => pick('q2_thought', v)} />
        )}
        {step === 'q3' && (
          <SingleChoice title="이번이 몇 번째 진지한 이별이야?" choices={Q3_CHOICES} onPick={v => pick('q3_count', v)} />
        )}
        {step === 'q5' && (
          <SingleChoice title="지금 가장 가까운 마음은?" choices={Q5_CHOICES} onPick={v => pick('q5_emotion', v)} />
        )}
        {step === 'q6' && (
          <SingleChoice
            title={
              <>
                혹시 관계 중에{' '}
                <RNText className="text-purple-400">내 기억과 상대 말이 자주 달랐던</RNText>
                {' '}경험이 있어?
              </>
            }
            choices={[{ value: 'no', label: '아니야 / 가끔' }, { value: 'yes', label: '응, 자주 그랬어' }]}
            onPick={v => pick('q6_memory_diverged', v === 'yes')}
          />
        )}
        {step === 'q_self_infidelity' && (
          <SingleChoice
            title="이별의 원인 중 내가 바람피운 부분이 있었어?"
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

        {step === 'phq2_q1' && (
          <SingleChoice
            title="지난 2주 동안, 일이나 활동에 대한 흥미나 재미를 거의 느끼지 못했어?"
            choices={FREQ_CHOICES}
            onPick={v => pickAssessment('phq2_q1', v)}
          />
        )}
        {step === 'phq2_q2' && (
          <SingleChoice
            title="지난 2주 동안, 가라앉거나 우울하거나 희망이 없다고 느꼈어?"
            choices={FREQ_CHOICES}
            onPick={v => pickAssessment('phq2_q2', v)}
          />
        )}
        {step === 'gad2_q1' && (
          <SingleChoice
            title="지난 2주 동안, 초조하거나 불안하거나 조마조마하게 느꼈어?"
            choices={FREQ_CHOICES}
            onPick={v => pickAssessment('gad2_q1', v)}
          />
        )}
        {step === 'gad2_q2' && (
          <SingleChoice
            title="지난 2주 동안, 걱정을 멈추거나 조절하기 어려웠어?"
            choices={FREQ_CHOICES}
            onPick={v => pickAssessment('gad2_q2', v)}
          />
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
            title={
              <>
                자해나 자살에 대해{' '}
                <RNText className="text-purple-400">적극적으로</RNText>
                {' '}생각해본 적 있어?
              </>
            }
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
  title: ReactNode;
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

// STEP_ORDER를 셋으로 쪼갠 이유: q1 토글에 따라 ASSESSMENT 4문항을 BASE와 CRISIS *사이에* 끼워넣기 위함.
// classifying은 항상 마지막 — CRISIS 묶음 끝에 둠.
const STEP_ORDER_BASE: Step[] = [
  'q1', 'q2', 'q3', 'q5',
  'q6', 'q_self_infidelity', 'q_complexity', 'q_breakup_reason',
];
const STEP_ORDER_ASSESSMENT: Step[] = ['phq2_q1', 'phq2_q2', 'gad2_q1', 'gad2_q2'];
const STEP_ORDER_CRISIS: Step[] = ['crisis_q1', 'crisis_q2', 'crisis_q3', 'classifying'];

function nextStep(
  current: Step,
  r: Partial<OnboardingResponses>,
  crisis: CrisisResponses,
  includeAssessment: boolean,
): Step {
  switch (current) {
    case 'q1': return 'q2';
    case 'q2': return 'q3';
    case 'q3': return 'q5';
    case 'q5':
      // Q2 ① 양성 시만 Q6 묻기, 아니면 건너뛰기
      return r.q2_thought === 'too_sensitive' ? 'q6' : 'q_self_infidelity';
    case 'q6': return 'q_self_infidelity';
    case 'q_self_infidelity': return 'q_complexity';
    case 'q_complexity': return 'q_breakup_reason';
    // 정밀 검사 옵트인 시 PHQ-2/GAD-2 4문항 후 C-SSRS — 안전 평가는 항상 마지막에 위치.
    case 'q_breakup_reason': return includeAssessment ? 'phq2_q1' : 'crisis_q1';
    case 'phq2_q1': return 'phq2_q2';
    case 'phq2_q2': return 'gad2_q1';
    case 'gad2_q1': return 'gad2_q2';
    case 'gad2_q2': return 'crisis_q1';
    case 'crisis_q1': return 'crisis_q2';
    // C-SSRS 표준: 적극적 자살 사고가 음성이면 구체적 방법 질문은 skip — 사용자 부담 완화 + 의미 없는 질문 회피.
    case 'crisis_q2': return crisis.q2 ? 'crisis_q3' : 'classifying';
    case 'crisis_q3': return 'classifying';
    default: return current;
  }
}

function scoreFreq(v: FreqLevel | undefined): number {
  return v ? Number(v) : 0;
}

/**
 * Phase H-6 — PHQ-2/GAD-2 raw 응답을 psych_assessments에 저장.
 * fire-and-forget: 실패해도 분류 진행. 시계열 추적·D+7 PHQ-9/GAD-7 권유 트리거용 보조 데이터.
 * 두 문항 모두 응답한 검사만 저장 — 부분 응답은 임상 신뢰도 낮음.
 */
async function persistShortFormAssessments(userId: string, a: AssessmentResponses): Promise<void> {
  try {
    if (a.phq2_q1 !== undefined && a.phq2_q2 !== undefined) {
      await recordAssessment(userId, 'PHQ2', {
        item1: Number(a.phq2_q1),
        item2: Number(a.phq2_q2),
      }, 'onboarding');
    }
    if (a.gad2_q1 !== undefined && a.gad2_q2 !== undefined) {
      await recordAssessment(userId, 'GAD2', {
        item1: Number(a.gad2_q1),
        item2: Number(a.gad2_q2),
      }, 'onboarding');
    }
  } catch (e) {
    console.warn('[onboarding] PHQ-2/GAD-2 raw 저장 실패 — 분류는 계속:', e);
  }
}

/**
 * 메인 온보딩의 DurationRange → 페르소나 분류용 q4_duration_range 매핑.
 *
 * 두 화면이 묻는 옵션 구간이 달라 정확한 1:1 매핑이 안 되니 *평균값 기준*으로 결정:
 *  · under_1y(평균 6개월) → '6m-2y' (1년 미만 다수가 6개월 이상)
 *  · 1_to_3y(평균 2년)    → '2y-5y' (1~3년 평균은 2년, 더 긴 그룹에 가까움)
 *  · 3_to_5y(평균 4년)    → '2y-5y' (정확 매핑)
 *  · over_5y              → '5y+' (정확 매핑)
 *  · skip / null          → '6m-2y' (안전 기본값)
 *
 * 결과: a4_duration 축은 0(`<6m`)이 더 이상 트리거되지 않음. 이는 의도적 — duration 화면에
 * "6개월 미만" 선택지가 없으므로, 페르소나 분류에서도 해당 카테고리는 비활성.
 */
function durationToRange(d: DurationRange | null): OnboardingResponses['q4_duration_range'] {
  switch (d) {
    case 'under_1y': return '6m-2y';
    case '1_to_3y':  return '2y-5y';
    case '3_to_5y':  return '2y-5y';
    case 'over_5y':  return '5y+';
    default:         return '6m-2y';
  }
}

function buildResponses(
  r: Partial<OnboardingResponses>,
  duration: DurationRange | null,
): OnboardingResponses {
  return {
    q1_initiator: r.q1_initiator ?? 'mutual',
    q2_thought: r.q2_thought ?? 'none',
    q3_count: r.q3_count ?? 'second_or_third',
    q4_duration_range: durationToRange(duration),
    q4_married: r.q4_married ?? false,
    q5_emotion: r.q5_emotion ?? 'unsure',
    q6_memory_diverged: r.q6_memory_diverged,
    q_self_infidelity: r.q_self_infidelity ?? false,
    q_complexity: r.q_complexity ?? 'none',
    q_breakup_reason: r.q_breakup_reason ?? 'mutual',
  };
}

/**
 * 10축 추정 (응답 기반). ECR-R/RRS 라이선스 미확인 상태라 a1_attachment는 q5/q2에서 휴리스틱 추정.
 * 라이선스 회신 후 본 함수에서 ECR-R 점수로 a1 정확화.
 *
 * a9/a10은 PHQ-2/GAD-2 옵트인 사용자만 계산 — assessment 미전달 시 undefined로 두어
 * 기존 분류 결과 동일성 보장 (Phase H).
 */
function inferAxes(
  r: OnboardingResponses,
  crisis: CrisisResponses,
  assessment?: AssessmentResponses,
): PsychAxes {
  const a8 = (crisis.q4 || crisis.q5 || crisis.q6) ? 3 : (crisis.q2 || crisis.q3) ? 2 : crisis.q1 ? 1 : 0;

  // a9/a10: 옵트인 + 두 문항 모두 응답 완료 시에만 계산. 부분 응답은 미측정 처리.
  let a9_depression: 0 | 1 | 2 | 3 | undefined;
  let a10_anxiety: 0 | 1 | 2 | 3 | undefined;
  if (assessment) {
    const phq1 = assessment.phq2_q1, phq2 = assessment.phq2_q2;
    const gad1 = assessment.gad2_q1, gad2 = assessment.gad2_q2;
    if (phq1 !== undefined && phq2 !== undefined) {
      a9_depression = shortFormScoreToAxis(Number(phq1) + Number(phq2));
    }
    if (gad1 !== undefined && gad2 !== undefined) {
      a10_anxiety = shortFormScoreToAxis(Number(gad1) + Number(gad2));
    }
  }

  return {
    a1_attachment: r.q2_thought === 'cant_live_without' ? 1 : r.q2_thought === 'alone_better' ? 2 : 0,
    a2_initiator: r.q1_initiator === 'mutual' ? 0 : r.q1_initiator === 'self' ? 1 : r.q1_initiator === 'partner' ? 2 : 3,
    a3_breakup_mode: r.q_breakup_reason === 'sudden' ? 2 : r.q_breakup_reason === 'forced' ? 3 : 0,
    a4_duration: r.q4_duration_range === '<6m' ? 0 : r.q4_duration_range === '6m-2y' ? 1 : r.q4_duration_range === '2y-5y' ? 2 : 3,
    a5_health: r.q2_thought === 'too_sensitive' && r.q6_memory_diverged ? 3 : r.q_self_infidelity ? 2 : 0,
    a6_complexity: r.q_complexity === 'marriage' || r.q4_married ? 3 : r.q_complexity === 'cohabitation' ? 2 : r.q_complexity === 'shared_circle' ? 1 : 0,
    a7_dominant_emotion: r.q5_emotion === 'anger' ? 1 : r.q5_emotion === 'guilt' ? 2 : r.q5_emotion === 'empty' ? 3 : r.q5_emotion === 'unsure' ? 4 : 0,
    a8_crisis: a8 as 0 | 1 | 2 | 3,
    a9_depression,
    a10_anxiety,
  };
}
