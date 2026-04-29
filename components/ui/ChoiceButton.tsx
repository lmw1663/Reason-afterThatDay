import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: string;
}

export function ChoiceButton({ label, sublabel, selected = false, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        backgroundColor: selected ? 'rgba(83,74,183,0.15)' : '#1A1A22',
        borderColor: selected ? '#7F77DD' : '#2C2C38',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon && <Text style={{ fontSize: 24 }}>{icon}</Text>}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: selected ? '#A5A0F0' : '#F1EFE8' }}>
            {label}
          </Text>
          {sublabel && (
            <Text style={{ fontSize: 14, color: '#888780', marginTop: 2 }}>{sublabel}</Text>
          )}
        </View>
        {selected && (
          <View style={{
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: '#7F77DD',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
