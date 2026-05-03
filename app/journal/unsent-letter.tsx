import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUnsentLetter, type UnsentLetter } from '@/hooks/useUnsentLetter';

/**
 * 부치지 않을 편지 보관함 — C-2-Ref-5 (참고용 §2 P02·P10·P17)
 *
 * 단일 화면:
 *  - 상단: 새 편지 작성 (TextInput + "잠가두기" 버튼)
 *  - 중간: 잠금 중 편지 (시각만 표시, 본문 숨김, N시간 후 해제 안내)
 *  - 하단: 잠금 해제된 편지 (펼쳐서 읽기, 사용자 명시 삭제 가능)
 *
 * 정책: 발송 기능 없음. AsyncStorage local-only. 30일 후 자동 삭제.
 */
export default function UnsentLetterScreen() {
  const { loading, locked, unlocked, addLetter, deleteLetter } = useUnsentLetter();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSave() {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      await addLetter(draft);
      setDraft('');
      Alert.alert(
        '잠가두었어',
        '24시간 후에 다시 읽을 수 있어. 그때까지 마음이 자연스럽게 가라앉을 거야.',
        [{ text: '응' }],
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(id: string) {
    Alert.alert(
      '편지를 지울까?',
      '한 번 지우면 되돌릴 수 없어.',
      [
        { text: '아니야', style: 'cancel' },
        { text: '지울게', style: 'destructive', onPress: () => deleteLetter(id) },
      ],
    );
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      >
        <View className="mb-2">
          <BackHeader />
        </View>
        <Caption className="mb-2">부치지 않을 편지</Caption>
        <Display className="mb-2">잠가두자</Display>
        <Body className="text-gray-400 mb-6 leading-6">
          쓰고 싶은 말을 적어두면 24시간 동안 잠가둘게. 그 시간이 지나면 다시 읽을 수 있어.{'\n'}
          *발송 기능은 없어*. 충동을 잠재우는 데만 쓰는 곳이야.
        </Body>

        {/* 새 편지 작성 */}
        <Card className="p-4 mb-6">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="여기 적어봐. 욕설·후회·미완의 말 — 무엇이든."
            placeholderTextColor={colors.gray[600]}
            multiline
            accessibilityLabel="편지 작성"
            className="text-white text-base leading-relaxed"
            style={{ minHeight: 120 }}
          />
          <View className="mt-4">
            <PrimaryButton
              label="24시간 잠가두기"
              onPress={handleSave}
              loading={submitting}
              disabled={!draft.trim() || submitting}
            />
          </View>
        </Card>

        {/* 잠금 중 편지 */}
        {!loading && locked.length > 0 && (
          <View className="mb-6">
            <Heading className="mb-3 text-base">잠금 중 ({locked.length})</Heading>
            <View className="gap-2">
              {locked.map(l => (
                <LockedCard key={l.id} letter={l} />
              ))}
            </View>
          </View>
        )}

        {/* 잠금 해제된 편지 */}
        {!loading && unlocked.length > 0 && (
          <View>
            <Heading className="mb-3 text-base">읽기 가능 ({unlocked.length})</Heading>
            <View className="gap-2">
              {unlocked.map(l => (
                <UnlockedCard
                  key={l.id}
                  letter={l}
                  expanded={expandedId === l.id}
                  onToggle={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  onDelete={() => handleDelete(l.id)}
                />
              ))}
            </View>
          </View>
        )}

        {!loading && locked.length === 0 && unlocked.length === 0 && (
          <Caption className="text-gray-500 text-center mt-4">
            아직 편지가 없어. 위에서 첫 편지를 적어봐.
          </Caption>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function LockedCard({ letter }: { letter: UnsentLetter }) {
  const hoursLeft = Math.max(
    0,
    Math.ceil((new Date(letter.unlockAt).getTime() - Date.now()) / (60 * 60 * 1000)),
  );
  return (
    <Card className="p-4">
      <View className="flex-row items-start gap-3">
        <Icon name="hourglass" size={18} color={colors.purple[400]} />
        <View className="flex-1">
          <Body className="text-gray-300 text-sm">
            {formatDate(letter.createdAt)} 작성
          </Body>
          <Caption className="text-gray-500 mt-1">
            {hoursLeft > 0 ? `약 ${hoursLeft}시간 후 잠금 해제` : '곧 해제돼'}
          </Caption>
        </View>
      </View>
    </Card>
  );
}

function UnlockedCard({
  letter,
  expanded,
  onToggle,
  onDelete,
}: {
  letter: UnsentLetter;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${formatDate(letter.createdAt)} 편지 ${expanded ? '접기' : '펼치기'}`}
        className="flex-row items-center gap-3 active:opacity-80"
      >
        <Icon name="feather" size={18} color={colors.purple[400]} />
        <View className="flex-1">
          <Body className="text-gray-200 text-sm">
            {formatDate(letter.createdAt)} 작성
          </Body>
          {!expanded && (
            <Caption className="text-gray-500 mt-1">탭해서 읽기</Caption>
          )}
        </View>
        <Icon
          name={expanded ? 'chevron-left' : 'chevron-right'}
          size={18}
          color={colors.gray[600]}
        />
      </Pressable>

      {expanded && (
        <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Body className="text-gray-200 leading-7">{letter.text}</Body>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="편지 지우기"
            hitSlop={8}
            className="mt-3 self-start active:opacity-60"
          >
            <Caption className="text-gray-500">지우기 ›</Caption>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}시`;
}
