import { StatusBadgeTone } from '../../../shared/ui/StatusBadge';
import { ReservationStatus } from './reservationTypes';

/** 예약 상태 → 한글 라벨 */
export const reservationStatusText: Record<ReservationStatus, string> = {
  PENDING: '대기',
  CONFIRMED: '확정',
  CANCELLED: '취소',
};

/** 예약 상태 → 뱃지 톤 */
export const reservationStatusTone: Record<ReservationStatus, StatusBadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'neutral',
};
