import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { LEGAL_DOCUMENTS, type LegalDocumentSlug } from '@/constants/legal';

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: LegalDocumentSlug }>();
  const doc = LEGAL_DOCUMENTS[document];

  if (!doc) {
    return (
      <ScreenWrapper>
        <View className="px-6 pt-4">
          <BackHeader />
          <Body>요청하신 문서를 찾을 수 없어.</Body>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="px-6 pt-4">
        <BackHeader />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 }}
      >
        <Heading className="mb-1">{doc.title}</Heading>
        <Caption className="text-gray-400 mb-1">버전 {doc.version}</Caption>
        <Caption className="text-gray-400 mb-6">시행일 {doc.effectiveDate}</Caption>

        <Text style={{ color: colors.gray[50], fontSize: 14, lineHeight: 22 }}>
          {doc.body}
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
