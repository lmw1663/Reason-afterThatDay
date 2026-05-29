import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

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
 *
 * 폰트: Pretendard Variable — 한국 모던 앱 표준 (Toss/당근 등). app/_layout.tsx에서
 * useFonts로 로드. 호출자가 style로 fontFamily를 override하면 그 값을 따른다.
 */

const FONT_FAMILY = 'Pretendard';
const baseStyle: TextStyle = { fontFamily: FONT_FAMILY };

interface Props extends TextProps {
  className?: string;
  children: React.ReactNode;
}

export function Display({ className = '', children, style, ...rest }: Props) {
  return (
    <RNText
      className={`text-white text-3xl font-bold ${className}`}
      style={[baseStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export function Heading({ className = '', children, style, ...rest }: Props) {
  return (
    <RNText
      className={`text-white text-2xl font-bold ${className}`}
      style={[baseStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export function Body({ className = '', children, style, ...rest }: Props) {
  return (
    <RNText
      className={`text-gray-50 text-base leading-relaxed ${className}`}
      style={[baseStyle, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/**
 * `*강조*` 표기를 브랜드 컬러 인라인 스팬으로 렌더링한다.
 *
 * 질문 프롬프트("오늘 떠오른 상대의 *장점* 한 가지가 있다면?")처럼 한 단어를
 * 도드라지게 하려고 별표로 감싼 문자열을 받는다. 마크다운 렌더러를 따로 두지 않고,
 * `<Heading>` 등 Text 컴포넌트의 children으로 바로 넣을 수 있도록 노드 배열을 반환한다.
 *
 * 사용: <Heading>{renderEmphasis('상대의 *장점* 한 가지')}</Heading>
 * 접근성 라벨 등 평문이 필요하면 stripEmphasis()로 별표만 제거한다.
 */
export function renderEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <RNText key={i} style={{ color: colors.purple[400] }}>
          {part.slice(1, -1)}
        </RNText>
      );
    }
    return part;
  });
}

/** `*강조*` 표기에서 별표만 제거해 평문으로 만든다 (접근성 라벨 등). */
export function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1');
}

interface CaptionProps extends Props {
  variant?: 'default' | 'subtle';
}

export function Caption({
  className = '',
  variant = 'default',
  children,
  style,
  ...rest
}: CaptionProps) {
  const tone = variant === 'subtle' ? 'text-gray-600 text-xs' : 'text-gray-400 text-sm';
  return (
    <RNText className={`${tone} ${className}`} style={[baseStyle, style]} {...rest}>
      {children}
    </RNText>
  );
}
