import { useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { elevation } from '@/constants/layout';
import { ChangeIndicator } from './ChangeIndicator';
import type { Direction } from '@/store/useJournalStore';

/**
 * 마음 매트릭스 — 2D 드래그 패드.
 *
 * 가로축: 보내고 싶어(왼쪽) ↔ 잡고 싶어(오른쪽)
 * 세로축: 좋아(위) ↔ 미워(아래)
 *
 * 점(thumb)을 끌어 자기 마음 위치에 놓는다. 슬라이더 + 3지선다를 하나의 평면 선택으로 통합.
 *
 * 입력 채널 3중화 (Tier 2-3):
 *  - 드래그: 연속 이동. 사분면/모르겠어 경계를 넘을 때 selection 햅틱 1틱.
 *  - 탭 폴백: 패드 아무 곳이나 한 번 탭하면 그 자리에 점이 놓임 (grant→handle 경로).
 *  - 보조기술: accessibilityActions 4방향 nudge.
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

// 사분면 = 방향(가로) × 애정(세로). 라벨·읽기 문구·색의 단일 출처(SSOT).
type QuadKey = 'tl' | 'tr' | 'bl' | 'br' | 'undecided';

const QUAD_PHRASE: Record<QuadKey, [string, string]> = {
  tl: ['좋은데', '보내고 싶어'],
  tr: ['잡고 싶고', '좋아'],
  bl: ['밉고', '보내고 싶어'],
  br: ['미운데', '잡고 싶어'],
  undecided: ['아직 잘 모르겠어', '어느 쪽인지 모르겠어'],
};

// 시그니처 색 RGB (rgba 조합용) — teal / purple / amber / coral
const QUAD_RGB: Record<Exclude<QuadKey, 'undecided'>, string> = {
  tl: '29,158,117', // teal
  tr: '127,119,221', // purple
  bl: '186,117,23', // amber
  br: '216,90,48', // coral
};

function quadrantOf({ direction, affectionLevel }: MoodMatrixResult): QuadKey {
  if (direction === 'undecided') return 'undecided';
  const love = affectionLevel >= 5;
  if (direction === 'catch') return love ? 'tr' : 'br';
  return love ? 'tl' : 'bl';
}

function accentFor(r: MoodMatrixResult): string {
  const q = quadrantOf(r);
  return q === 'undecided' ? colors.gray[400] : `rgb(${QUAD_RGB[q]})`;
}

function readingLines(r: MoodMatrixResult): [string, string] {
  return QUAD_PHRASE[quadrantOf(r)];
}

// 사분면 채움색. 선택된 사분면은 진하게, 나머지는 은은하게 — 평소에도 4색이 또렷이 구분되도록.
function quadFill(key: Exclude<QuadKey, 'undecided'>, active: QuadKey | null): string {
  return `rgba(${QUAD_RGB[key]},${active === key ? 0.46 : 0.22})`;
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
  // 마지막 사분면 — 경계를 넘는 순간에만 햅틱 1틱 (연속 진동 금지, Calm UI)
  const lastQuadRef = useRef<QuadKey | null>(initial ? quadrantOf(initial) : null);

  function tickIfQuadChanged(r: MoodMatrixResult) {
    const q = quadrantOf(r);
    if (lastQuadRef.current !== null && q !== lastQuadRef.current) {
      Haptics.selectionAsync().catch(() => {});
    }
    lastQuadRef.current = q;
  }

  const result = deriveResult(pos.x, pos.y);
  const accent = accentFor(result);
  const [line1, line2] = readingLines(result);
  // 선택된(=thumb가 올라간) 사분면만 강조. 미터치/모르겠어면 강조 없음.
  const activeQuad = touched ? quadrantOf(result) : null;

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
      const next = deriveResult(nx, ny);
      tickIfQuadChanged(next); // ref만 사용 — memo 클로저의 stale 식별자와 무관하게 안전
      onChangeRef.current(next);
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
        // 탭 폴백 포함 — 잡는 순간 가볍게 1틱 (점이 손에 잡혔다는 촉각 확인)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    const next = deriveResult(nx, ny);
    tickIfQuadChanged(next);
    onChangeRef.current(next);
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
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[50], marginTop: 3 }}>
              {line2}
            </Text>
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
        {/* 사분면 틴트 — 4색 구분, 선택 사분면 진하게 */}
        <Quadrant top left color={quadFill('tl', activeQuad)} />
        <Quadrant top right color={quadFill('tr', activeQuad)} />
        <Quadrant bottom left color={quadFill('bl', activeQuad)} />
        <Quadrant bottom right color={quadFill('br', activeQuad)} />

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

        {/* 사분면 라벨 — 점진공개: 미터치 땐 은은한 지형도, 선택 후엔 현재 사분면만 또렷 */}
        <QuadrantLabel position="tl" active={activeQuad === 'tl'} touched={touched} />
        <QuadrantLabel position="tr" active={activeQuad === 'tr'} touched={touched} />
        <QuadrantLabel position="bl" active={activeQuad === 'bl'} touched={touched} />
        <QuadrantLabel position="br" active={activeQuad === 'br'} touched={touched} />

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
            fontWeight: '600',
            // 점진공개 — 모르겠어 밴드 위에 있을 때만 또렷, 다른 사분면 선택 중엔 한 단계 후퇴
            color:
              activeQuad === null && touched
                ? colors.white
                : touched
                  ? 'rgba(255,255,255,0.45)' /* 0.46 틴트 위에서도 3:1 유지 */
                  : 'rgba(255,255,255,0.55)',
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
                ...elevation.thumb,
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
  active,
  touched,
}: {
  position: Exclude<QuadKey, 'undecided'>;
  active: boolean;
  touched: boolean;
}) {
  const isRight = position === 'tr' || position === 'br';
  const isBottom = position === 'bl' || position === 'br';
  const [a, b] = QUAD_PHRASE[position];
  // 점진공개 3단계: 미터치(전체 은은) → 선택 사분면(흰색 700) → 비선택 사분면(후퇴)
  const color = active
    ? colors.white
    : touched
      ? 'rgba(255,255,255,0.45)' /* 0.46 틴트 위에서도 3:1 유지 */
      : 'rgba(255,255,255,0.55)';
  const labelStyle = {
    fontSize: 13,
    fontWeight: (active ? '700' : '600') as '700' | '600',
    color,
  };
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
      <Text style={labelStyle}>{a}</Text>
      <Text style={labelStyle}>{b}</Text>
    </View>
  );
}
