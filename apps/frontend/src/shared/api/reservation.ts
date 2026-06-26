import { API_BASE as BASE } from './config';
import { refreshingFetch } from './http';

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
 * 인증은 쿠키의 JWT 액세스 토큰으로 처리한다(credentials: 'include'). 액세스 토큰이 만료되면
 * refreshingFetch 가 401을 감지해 자동 재발급 후 재시도한다.
 */
export async function cancelReservation(
  reservationId: number,
  cancelReason: string,
): Promise<RefundResult | undefined> {
  const res = await refreshingFetch(`${BASE}/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelReason }),
  });

  let body: Envelope<RefundResult> | null = null;
  try {
    body = await res.json();
  } catch {
    /* 바디 없음 */
  }

  // 환불 성공 시 백엔드가 data 없이 {success:true}만 줄 수 있으므로 data 유무로 실패 판정하지 않는다.
  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? `예약 취소에 실패했어요 (${res.status})`);
  }
  return body?.data;
}
