import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface Props {
  /** 과거 → 현재 순서의 값 배열. 2개 미만이면 렌더하지 않음. */
  data: number[];
  width?: number;
  height?: number;
  /** 단일 저채도 색만 허용 — 적/녹 신호등 의미 부여 금지 (Tier 2-2). */
  color?: string;
  /** 데이터 도메인 고정 (감정온도 1~10처럼 절대 스케일이 의미 있을 때). 생략 시 데이터 범위. */
  min?: number;
  max?: number;
}

/**
 * 인라인 sparkline — Apple Stocks 패턴 (라벨·추세·현재값 한 줄).
 *
 * 추세의 *모양*만 전달하는 장식 요소: 축·라벨·격자 없음, 끝점 dot 하나로 "지금"을 표시.
 * 색은 데이터의 좋고 나쁨을 판단하지 않는다 — 항상 단일 색 + 낮은 불투명도 라인.
 */
export function Sparkline({
  data,
  width = 64,
  height = 24,
  color = colors.purple[400],
  min,
  max,
}: Props) {
  if (data.length < 2) return null;

  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const span = hi - lo;
  const pad = 3; // 끝점 dot 반경 + 라인 두께 여유

  const stepX = (width - pad * 2) / (data.length - 1);
  const coords = data.map((v, i) => ({
    x: pad + i * stepX,
    // 전부 같은 값이면 중앙 수평선 — 바닥에 깔리면 "최저점"으로 오독됨
    y: pad + (span === 0 ? 0.5 : 1 - (v - lo) / span) * (height - pad * 2),
  }));
  const last = coords[coords.length - 1];

  return (
    <Svg width={width} height={height} pointerEvents="none" aria-hidden>
      <Polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </Svg>
  );
}
