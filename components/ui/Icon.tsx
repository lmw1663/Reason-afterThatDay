import {
  Apple,
  Archive,
  Award,
  BarChart3,
  Bell,
  BellOff,
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudFog,
  Coffee,
  Compass,
  Feather,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  Hourglass,
  Image as ImageIcon,
  Leaf,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Moon,
  PenLine,
  Plus,
  Puzzle,
  Save,
  Scale,
  Search,
  Smile,
  Sparkles,
  Thermometer,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react-native';
import { colors } from '@/constants/colors';

/**
 * 단일 아이콘 시스템 (Lucide 기반).
 *
 * 정책:
 *  - 시그니처 색은 `colors.purple[400]` (#7F77DD). 다크 테마 위에서 가장 안정적.
 *  - 강조가 다른 맥락(teal/coral/amber/gray)은 `color` prop으로 명시 override.
 *  - 라인 두께 1.8 — 너무 얇지도 굵지도 않게.
 *  - 표준 size: 22 (탭/메뉴/Choice), 18 (인라인/헤더), 16 (보조), 56+ (Empty state).
 */

const iconMap = {
  // 탭/메뉴
  home: Home,
  search: Search,
  compass: Compass,
  graduation: GraduationCap,
  book: BookOpen,
  pen: PenLine,
  scale: Scale,

  // 방향 선택 (catch / let_go / undecided)
  heart: Heart,
  feather: Feather,
  fog: CloudFog,

  // 내비게이션
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,

  // 액션
  check: Check,
  x: X,
  plus: Plus,

  // 알림 / 유예
  hourglass: Hourglass,
  'bell-off': BellOff,
  bell: Bell,
  undo: Undo2,
  save: Save,

  // 통계
  thermometer: Thermometer,
  chart: BarChart3,

  // 분위기
  moon: Moon,

  // 추억 / 정리 트랙
  archive: Archive,
  camera: Camera,
  image: ImageIcon,
  'message-circle': MessageCircle,
  'map-pin': MapPin,
  trash: Trash2,

  // 자기 성찰 (about-me 카테고리)
  users: Users,
  'heart-handshake': HeartHandshake,
  smile: Smile,
  sparkles: Sparkles,
  award: Award,
  coffee: Coffee,
  leaf: Leaf,
  puzzle: Puzzle,

  // 기타
  clipboard: ClipboardList,

  // OAuth 버튼 — TODO: 정식 브랜드 로고 SVG로 교체. Lucide Apple은 fruit 형태.
  apple: Apple,
  globe: Globe,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  color = colors.purple[400],
  strokeWidth = 1.8,
}: Props) {
  const Component = iconMap[name];
  return <Component size={size} color={color} strokeWidth={strokeWidth} />;
}
