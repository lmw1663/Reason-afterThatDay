import { View } from 'react-native';
import { ChoiceButton } from './ChoiceButton';
import { ChangeIndicator } from './ChangeIndicator';
import type { Direction } from '@/store/useJournalStore';
import type { IconName } from './Icon';

const OPTIONS: { value: Direction; label: string; sublabel: string; icon: IconName }[] = [
  { value: 'catch',     label: '잡고 싶어',     sublabel: '다시 함께하고 싶은 마음이 있어',   icon: 'heart'   },
  { value: 'let_go',    label: '보내고 싶어',   sublabel: '이제 내 길을 가고 싶어',           icon: 'feather' },
  { value: 'undecided', label: '아직 모르겠어', sublabel: '어느 쪽인지 잘 모르겠어',          icon: 'fog'     },
];

interface Props {
  value: Direction | null;
  onChange: (direction: Direction) => void;
  prevDirection?: Direction | null;
  changePrefix?: string;
  changeSuffix?: string;
}

export function DirectionPicker({
  value,
  onChange,
  prevDirection = null,
  changePrefix,
  changeSuffix,
}: Props) {
  return (
    <View>
      <ChangeIndicator
        prev={prevDirection}
        current={value ?? 'undecided'}
        prefix={changePrefix}
        suffix={changeSuffix}
      />
      <View className="gap-1">
        {OPTIONS.map((opt) => (
          <ChoiceButton
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}
