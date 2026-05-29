import { useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  Text,
  View,
} from 'react-native';
import { colors } from '@/constants/colors';
import { ChangeIndicator } from './ChangeIndicator';
import type { Direction } from '@/store/useJournalStore';

/**
 * 마음 매트릭스 — 2D 드래그 패드.
 *
 * 가로축: 보내고 싶어(왼쪽) ↔ 잡고 싶어(오른쪽)
 * 세로축: 좋아(위) ↔ 미워(아래)
 *
 * 점(thumb)을 끌어 자기 마음 위치에 놓는다. 슬라이더 + 3지선다를 하나의 평면 선택으로 통합.
 * 저장은 기존 스키마 그대로 분해(B안): 위치 → { direction, affectionLevel }.
 *   - direction: x 위치로 보내고/잡고/모르겠어(중앙 밴드) 결정
 *   - affectionLevel: y 위치로 0~10 연속 (위=10 좋아, 아래=0 미워)
 *     → compassVerdictWithAffection 임계값(≥7, ≤3, |diff|≤1)에 그대로 물려 verdict 분화 유지.
 *
 * 시작 위치는 중앙(=모르겠어). 결정을 강요하지 않는 기본값 — P03·P11 안전 정책 부합.
 */

export interface MoodMatrixResult {
  direction: Direction;
  affectionLevel: number;
}

const PAD_RADIUS = 24;
const THUMB = 34;
const UNDECIDED_BAND = 0.24; // 중앙 ±12% 폭 = 모르겠어
const A11Y_STEP = 0.1; // VoiceOver 액션당 이동량

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function deriveDirection(x: number): Direction {
  if (x < 0.5 - UNDECIDED_BAND / 2) return 'let_go';
  if (x > 0.5 + UNDECIDED_BAND / 2) return 'catch';
  return 'undecided';
}

function deriveResult(x: number, y: number): MoodMatrixResult {
  return {
    direction: deriveDirection(x),
    affectionLevel: Math.round((1 - y) * 10),
  };
}

// 편집 화면 초기값 — { direction, affectionLevel } → 패드 좌표 역산
function resultToPos(r: MoodMatrixResult): { x: number; y: number } {
  const x = r.direction === 'let_go' ? 0.22 : r.direction === 'catch' ? 0.78 : 0.5;
  return { x, y: clamp01(1 - r.affectionLevel / 10) };
}

// 사분면(=방향×애정)별 시그니처 색 — 4색 구분
function accentFor({ direction, affectionLevel }: MoodMatrixResult): string {
  if (direction === 'undecided') return colors.gray[400];
  if (direction === 'catch') return affectionLevel < 5 ? colors.coral[400] : colors.purple[400];
  return affectionLevel < 5 ? colors.amber[400] : colors.teal[400];
}

function readingLines(r: MoodMatrixResult): [string, string] {
  if (r.direction === 'undecided') return ['아직 잘 모르겠어', '어느 쪽인지 모르겠어'];
  const dir = r.direction === 'catch' ? '잡고 싶어' : '보내고 싶어';
  const aff =
    r.affectionLevel >= 7 ? '여전히 좋아' : r.affectionLevel <= 3 ? '밉기도 해' : '마음이 반반이야';
  return [dir, aff];
}

interface Props {
  onChange: (result: MoodMatrixResult | null) => void;
  /** 활성(드래그 중) 상태 변화 — 부모 ScrollView 스크롤 잠금용 */
  onActiveChange?: (active: boolean) => void;
  /** 편집 화면용 초기값 — 주면 해당 위치에서 시작하고 선택된 상태로 표시 */
  initial?: MoodMatrixResult | null;
  prevDirection?: Direction | null;
  changePrefix?: string;
  changeSuffix?: string;
}

export function MoodMatrixPicker({
  onChange,
  onActiveChange,
  initial = null,
  prevDirection = null,
  changePrefix,
  changeSuffix,
}: Props) {
  const [padSize, setPadSize] = useState(0);
  const [pos, setPos] = useState(() => (initial ? resultToPos(initial) : { x: 0.5, y: 0.5 }));
  const [touched, setTouched] = useState(!!initial);
  const [active, setActive] = useState(false);

  const touchedRef = useRef(!!initial);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const result = deriveResult(pos.x, pos.y);
  const accent = accentFor(result);
  const [line1, line2] = readingLines(result);

  const panResponder = useMemo(() => {
    const handle = (e: GestureResponderEvent) => {
      if (padSize === 0) return;
      const nx = clamp01(e.nativeEvent.locationX / padSize);
      const ny = clamp01(e.nativeEvent.locationY / padSize);
      setPos({ x: nx, y: ny });
      if (!touchedRef.current) {
        touchedRef.current = true;
        setTouched(true);
      }
      onChangeRef.current(deriveResult(nx, ny));
    };
    const end = () => {
      setActive(false);
      onActiveChangeRef.current?.(false);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        setActive(true);
        onActiveChangeRef.current?.(true);
        handle(e);
      },
      onPanResponderMove: handle,
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  }, [padSize]);

  function onPadLayout(e: LayoutChangeEvent) {
    setPadSize(e.nativeEvent.layout.width);
  }

  // VoiceOver 등 보조기술용 — 패드를 직접 끌 수 없는 사용자를 위한 4방향 이동
  function nudge(dx: number, dy: number) {
    const nx = clamp01(pos.x + dx);
    const ny = clamp01(pos.y + dy);
    setPos({ x: nx, y: ny });
    if (!touchedRef.current) {
      touchedRef.current = true;
      setTouched(true);
    }
    onChangeRef.current(deriveResult(nx, ny));
  }

  const thumbScale = active ? 1.18 : 1;
  const thumbLeft = pos.x * padSize - THUMB / 2;
  const thumbTop = pos.y * padSize - THUMB / 2;
  const glowSize = THUMB * thumbScale + 16;

  return (
    <View>
      {/* 어제와의 변화 — 어떤 선택이든(또는 미선택이든) 항상 상단 노출 */}
      <ChangeIndicator
        prev={prevDirection}
        current={result.direction}
        prefix={changePrefix}
        suffix={changeSuffix}
        alwaysShow
      />

      {/* 현재 읽기 — 끌면 실시간으로 바뀜 */}
      <View style={{ alignItems: 'center', marginBottom: 14, minHeight: 52 }}>
        {touched ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: accent, letterSpacing: -0.3 }}>
              {line1}
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[400], marginTop: 3 }}>{line2}</Text>
          </>
        ) : (
          <Text style={{ fontSize: 15, color: colors.gray[400], marginTop: 12 }}>
            점을 끌어 지금 네 마음을 놓아봐
          </Text>
        )}
      </View>

      <View
        onLayout={onPadLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={
          touched ? `${line1}, ${line2}` : '마음 위치 선택 패드. 끌어서 위치를 정해봐'
        }
        accessibilityActions={[
          { name: 'decrement', label: '보내고 싶어 쪽으로' },
          { name: 'increment', label: '잡고 싶어 쪽으로' },
          { name: 'up', label: '좋은 마음 쪽으로' },
          { name: 'down', label: '미운 마음 쪽으로' },
        ]}
        onAccessibilityAction={(e) => {
          switch (e.nativeEvent.actionName) {
            case 'decrement':
              nudge(-A11Y_STEP, 0);
              break;
            case 'increment':
              nudge(A11Y_STEP, 0);
              break;
            case 'up':
              nudge(0, -A11Y_STEP);
              break;
            case 'down':
              nudge(0, A11Y_STEP);
              break;
          }
        }}
        style={{
          aspectRatio: 1,
          borderRadius: PAD_RADIUS,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        {/* 사분면 틴트 — 4색 구분 */}
        <Quadrant top left color={colors.overlayTealSoft} />
        <Quadrant top right color={colors.overlayPurpleSoft} />
        <Quadrant bottom left color={colors.overlayAmberSoft} />
        <Quadrant bottom right color={colors.overlayCoralSoft} />

        {/* 중앙 모르겠어 밴드 */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(0.5 - UNDECIDED_BAND / 2) * 100}%`,
            width: `${UNDECIDED_BAND * 100}%`,
            backgroundColor: colors.overlayGrayMuted,
          }}
        />

        {/* 십자 가이드 */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: colors.border }}
        />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.border }}
        />

        {/* 사분면 라벨 */}
        <QuadrantLabel position="tl" lines={['좋은데', '보내고 싶어']} />
        <QuadrantLabel position="tr" lines={['잡고 싶고', '좋아']} />
        <QuadrantLabel position="bl" lines={['밉고', '보내고 싶어']} />
        <QuadrantLabel position="br" lines={['미운데', '잡고 싶어']} />

        {/* 중앙 '모르겠어' 라벨 */}
        <Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 11,
            color: colors.gray[400],
          }}
        >
          모르겠어
        </Text>

        {/* thumb */}
        {padSize > 0 && (
          <>
            {touched && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: pos.x * padSize - glowSize / 2,
                  top: pos.y * padSize - glowSize / 2,
                  width: glowSize,
                  height: glowSize,
                  borderRadius: glowSize / 2,
                  backgroundColor: accent,
                  opacity: 0.18,
                }}
              />
            )}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: thumbLeft,
                top: thumbTop,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                transform: [{ scale: thumbScale }],
                backgroundColor: colors.white,
                borderWidth: 3,
                borderColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 6,
                opacity: touched ? 1 : 0.55,
              }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: accent }} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Quadrant({
  top,
  bottom,
  left,
  right,
  color,
}: {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  color: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: '50%',
        height: '50%',
        top: top ? 0 : undefined,
        bottom: bottom ? 0 : undefined,
        left: left ? 0 : undefined,
        right: right ? 0 : undefined,
        backgroundColor: color,
      }}
    />
  );
}

function QuadrantLabel({
  position,
  lines,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  lines: [string, string];
}) {
  const isRight = position === 'tr' || position === 'br';
  const isBottom = position === 'bl' || position === 'br';
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: isBottom ? undefined : 28,
        bottom: isBottom ? 14 : undefined,
        left: isRight ? undefined : 14,
        right: isRight ? 14 : undefined,
        alignItems: isRight ? 'flex-end' : 'flex-start',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[400] }}>{lines[0]}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[400] }}>{lines[1]}</Text>
    </View>
  );
}
