import { Text as RNText, TextProps } from 'react-native';

/**
 * 4단계 텍스트 위계 토큰.
 *
 *  Display  : 큰 결과/온보딩 헤드라인 (text-3xl bold)
 *  Heading  : 화면 제목 (text-2xl bold) — 가장 흔함
 *  Body     : 본문 (text-base, gray-300)
 *  Caption  : 카테고리/스텝/라벨 (text-sm, gray-400) 또는 보조 메모(text-xs, gray-600)
 *
 * 새 화면을 만들 때는 raw `<Text className="text-2xl font-bold">` 대신
 * 이 컴포넌트를 사용해 위계를 통일한다.
 */

interface Props extends TextProps {
  className?: string;
  children: React.ReactNode;
}

export function Display({ className = '', children, ...rest }: Props) {
  return (
    <RNText className={`text-white text-3xl font-bold ${className}`} {...rest}>
      {children}
    </RNText>
  );
}

export function Heading({ className = '', children, ...rest }: Props) {
  return (
    <RNText className={`text-white text-2xl font-bold ${className}`} {...rest}>
      {children}
    </RNText>
  );
}

export function Body({ className = '', children, ...rest }: Props) {
  return (
    <RNText className={`text-gray-50 text-base leading-relaxed ${className}`} {...rest}>
      {children}
    </RNText>
  );
}

interface CaptionProps extends Props {
  variant?: 'default' | 'subtle';
}

export function Caption({ className = '', variant = 'default', children, ...rest }: CaptionProps) {
  const tone = variant === 'subtle' ? 'text-gray-600 text-xs' : 'text-gray-400 text-sm';
  return (
    <RNText className={`${tone} ${className}`} {...rest}>
      {children}
    </RNText>
  );
}
