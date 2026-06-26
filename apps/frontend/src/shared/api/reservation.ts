import { API_BASE as BASE } from './config';

/** POST /api/reservations/{reservationId}/cancel 의 결과 (예약 취소 + 토스 환불 완료 정보).
 *  백엔드 RefundResponse 와 1:1 대응. 금액은 BigDecimal→number, 날짜는 ISO 문자열. */
export interface RefundResult {
  orderId: string;
  orderName: string;
  cancelReason: string;
  /** 환불 승인 시각 (LocalDateTime, ISO 8601 문자열). 표시 시 new Date()로 파싱. */
  canceledAt: string;
  /** 환불 금액(원 단위). */
  refundAmount: number;
  checkInDate: string;
  checkOutDate: string;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

/**
 * POST /api/reservations/{reservationId}/cancel — 게스트 예약 취소 + 토스 환불.
 *
 * body.cancelReason 은 백엔드를 거쳐 그대로 토스 취소 사유로 전달되므로,
 * 코드(DATE_CHANGE 등)가 아니라 사람이 읽는 문구(라벨)를 보낸다.
 *
 * 인증은 백엔드 @CurrentMember 스텁(id=1)이 고정하므로 guest 파라미터는 보내지 않는다
 * (payment.ts 와 동일 기조). 실제 세션 인증 도입 시 fetch에 credentials: 'include' 추가하고
 * 백엔드 allowCredentials(true)와 한 쌍으로 맞춘다.
 */
export async function cancelReservation(
  reservationId: number,
  cancelReason: string,
): Promise<RefundResult> {
  const res = await fetch(`${BASE}/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelReason }),
  });

  let body: Envelope<RefundResult> | null = null;
  try {
    body = await res.json();
  } catch {
    /* 바디 없음 */
  }

  if (!res.ok || !body?.success || !body.data) {
    throw new Error(body?.message ?? `예약 취소에 실패했어요 (${res.status})`);
  }
  return body.data;
}
