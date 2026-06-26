import {
  Search,
  Menu,
  User,
  Heart,
  Star,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Image,
  Plus,
  Minus,
  MapPin,
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  Shield,
  Briefcase,
  MessageCircle,
  Clock,
  Edit3,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  CreditCard,
  BookOpen,
  Bell,
  Settings,
  Globe,
  HelpCircle,
  LogOut,
  Home,
  DoorOpen,
  Utensils,
  Wifi,
  Wind,
  WashingMachine,
  Car,
  Tv,
  Waves,
  PawPrint,
  Coffee,
  Dumbbell,
  ArrowUpDown,
  SlidersHorizontal,
  Grip,
  CalendarX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

const ICONS: Record<string, LucideIcon> = {
  search: Search,
  menu: Menu,
  user: User,
  heart: Heart,
  star: Star,
  x: X,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  image: Image,
  plus: Plus,
  minus: Minus,
  'map-pin': MapPin,
  'layout-dashboard': LayoutDashboard,
  users: Users,
  'building-2': Building2,
  'calendar-check': CalendarCheck,
  'trending-up': TrendingUp,
  shield: Shield,
  briefcase: Briefcase,
  'message-circle': MessageCircle,
  clock: Clock,
  'edit-3': Edit3,
  sparkles: Sparkles,
  'more-horizontal': MoreHorizontal,
  pencil: Pencil,
  'trash-2': Trash2,
  'credit-card': CreditCard,
  'book-open': BookOpen,
  bell: Bell,
  settings: Settings,
  globe: Globe,
  'help-circle': HelpCircle,
  'log-out': LogOut,
  home: Home,
  'door-open': DoorOpen,
  utensils: Utensils,
  wifi: Wifi,
  wind: Wind,
  'washing-machine': WashingMachine,
  car: Car,
  tv: Tv,
  waves: Waves,
  'paw-print': PawPrint,
  coffee: Coffee,
  dumbbell: Dumbbell,
  'arrow-up-down': ArrowUpDown,
  sliders: SlidersHorizontal,
  grip: Grip,
  'calendar-x': CalendarX,
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, color, fill, strokeWidth = 2, style }: IconProps) {
  const Comp = ICONS[name];
  if (!Comp) return null;
  return (
    <Comp
      size={size}
      color={color ?? 'currentColor'}
      fill={fill ?? 'none'}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
