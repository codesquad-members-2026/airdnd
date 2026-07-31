import { CalendarCheck, Mail, MessageSquare, Star, type LucideIcon } from 'lucide-react';
import type { Notification } from '../model/notificationTypes';

// 알림 타입별 아이콘 — 페이지/드롭다운에서 공유합니다.
export const NOTIFICATION_TYPE_ICON: Record<Notification['type'], LucideIcon> = {
  RESERVATION: CalendarCheck,
  HOST: Star,
  SYSTEM: Mail,
  REVIEW: MessageSquare,
};
