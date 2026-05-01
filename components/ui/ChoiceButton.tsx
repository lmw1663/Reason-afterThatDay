import { Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onPress: () => void;
  /**
   * 좌측 아이콘. Icon 컴포넌트의 IconName을 전달해 시그니처 색/스트로크로 통일된 라인 아이콘 표시.
   */
  icon?: IconName;
}

export function ChoiceButton({ label, sublabel, selected = false, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      accessibilityState={{ selected }}
      style={{
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        backgroundColor: selected ? colors.overlayPurpleSoft : colors.surface,
        borderColor: selected ? colors.purple[400] : colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon && (
          <Icon
            name={icon}
            size={22}
            color={selected ? colors.purple[400] : colors.gray[400]}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: selected ? colors.purple[400] : colors.gray[50],
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={{ fontSize: 14, color: colors.gray[400], marginTop: 2 }}>{sublabel}</Text>
          )}
        </View>
        {selected && (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.purple[400],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check" size={12} color={colors.white} strokeWidth={2.5} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
