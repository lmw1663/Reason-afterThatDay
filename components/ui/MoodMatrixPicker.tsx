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
const SIDE_LABEL_W = 52;
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

function accentFor({ direction, affectionLevel }: MoodMatrixResult): string {
  if (direction === 'undecided') return colors.gray[400];
  if (direction === 'catch') return affectionLevel <= 3 ? colors.coral[400] : colors.purple[400];
  return colors.teal[400];
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
  prevDirection?: Direction | null;
  changePrefix?: string;
  changeSuffix?: string;
}

export function MoodMatrixPicker({
  onChange,
  prevDirection = null,
  changePrefix,
  changeSuffix,
}: Props) {
  const [padSize, setPadSize] = useState(0);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(false);

  const touchedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        setActive(true);
        handle(e);
      },
      onPanResponderMove: handle,
      onPanResponderRelease: () => setActive(false),
      onPanResponderTerminate: () => setActive(false),
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

  const thumbLeft = pos.x * padSize - THUMB / 2;
  const thumbTop = pos.y * padSize - THUMB / 2;
  const thumbScale = active ? 1.18 : 1;

  return (
    <View>
      {touched && (
        <ChangeIndicator
          prev={prevDirection}
          current={result.direction}
          prefix={changePrefix}
          suffix={changeSuffix}
        />
      )}

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

      {/* 상단 축 라벨 */}
      <Text style={axisLabelStyle()}>좋아</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[sideLabelStyle(), { textAlign: 'right', paddingRight: 8 }]}>보내고{'\n'}싶어</Text>

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
            width: padSize > 0 ? padSize : undefined,
            aspectRatio: 1,
            flex: padSize > 0 ? undefined : 1,
            borderRadius: PAD_RADIUS,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {/* 사분면 틴트 */}
          <Quadrant top left color={colors.overlayTealSoft} />
          <Quadrant top right color={colors.overlayPurpleSoft} />
          <Quadrant bottom left color={colors.overlayTealSoft} />
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

          {/* 중앙 '모르겠어' 힌트 */}
          {!touched && (
            <Text
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 10,
                alignSelf: 'center',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 11,
                color: colors.gray[600],
              }}
            >
              가운데 = 모르겠어
            </Text>
          )}

          {/* thumb */}
          {padSize > 0 && (
            <>
              {touched && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: pos.x * padSize - (THUMB * thumbScale + 16) / 2,
                    top: pos.y * padSize - (THUMB * thumbScale + 16) / 2,
                    width: THUMB * thumbScale + 16,
                    height: THUMB * thumbScale + 16,
                    borderRadius: (THUMB * thumbScale + 16) / 2,
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
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: accent,
                  }}
                />
              </View>
            </>
          )}
        </View>

        <Text style={[sideLabelStyle(), { textAlign: 'left', paddingLeft: 8 }]}>잡고{'\n'}싶어</Text>
      </View>

      {/* 하단 축 라벨 */}
      <Text style={axisLabelStyle()}>미워</Text>
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

function axisLabelStyle() {
  return {
    textAlign: 'center' as const,
    fontSize: 13,
    color: colors.gray[400],
    marginVertical: 6,
  };
}

function sideLabelStyle() {
  return {
    width: SIDE_LABEL_W,
    fontSize: 13,
    lineHeight: 17,
    color: colors.gray[400],
  };
}
