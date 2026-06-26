import { API_BASE as BASE } from './config';
import { refreshingFetch } from './http';

/** POST /api/payments/{resId}/prepare 가 돌려주는 결제 준비 정보.
 *  orderId/orderName/successUrl/failUrl/amount 모두 서버가 확정한 값으로, 그대로 토스에 넘긴다. */
export interface PaymentPrepareResponse {
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  /** 결제 금액(원 단위). 서버는 BigDecimal → JSON 숫자로 직렬화한다. */
  amount: number;
}

/** POST /api/payments/confirm 의 결과 (결제 승인 완료 정보). */
export interface PaymentConfirmResult {
  orderId: string;
  /** "DONE" 이면 승인 완료. */
  status: string;
  amount: number;
  method: string;
  /** ISO 8601 문자열. 표시 시 new Date()로 파싱. */
  approvedAt: string;
  reservationId: number;
}

interface Envelope<T> {
  success?: boolean;
  code?: string;
  data?: T;
  message?: string;
}

/** 서버 ApiResponse 에러를 코드까지 담아 던지는 에러. 호출부가 code(예: RESERVATION_006)로 분기할 수 있다. */
export class ApiError extends Error {
  readonly code?: string;
  readonly status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/** prepare가 이 코드로 실패하면 그 예약은 더는 못 쓴다(만료/확정·취소/없음).
 *  RESERVATION_006: NOT_PENDING_RESERVATION, RESERVATION_003: RESERVATION_NOT_FOUND */
export const UNUSABLE_RESERVATION_CODES = new Set(['RESERVATION_006', 'RESERVATION_003']);

/** 예약(resId)에 대한 결제를 준비한다. 예약은 PENDING 상태여야 하고, 인증 회원(스텁: id=1)의 것이어야 한다. */
export async function preparePayment(reservationId: number): Promise<PaymentPrepareResponse> {
  const res = await refreshingFetch(`${BASE}/api/payments/${reservationId}/prepare`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  let body: Envelope<PaymentPrepareResponse> | null = null;
  try {
    body = await res.json();
  } catch {
    /* 바디 없음 */
  }

  if (!res.ok || !body?.success || !body.data) {
    throw new ApiError(body?.message ?? `결제 준비에 실패했어요 (${res.status})`, res.status, body?.code);
  }
  return body.data;
}

/**
 * POST /api/payments/confirm — 토스 결제 승인.
 * amount는 반드시 JSON 숫자로 전송한다(URL 문자열 그대로 보내지 말 것).
 *
 * 인증은 쿠키의 JWT 액세스 토큰으로 처리한다(credentials: 'include', 백엔드 allowCredentials(true)와 한 쌍).
 * 액세스 토큰 만료 시 refreshingFetch 가 401을 감지해 자동 재발급 후 재시도한다.
 */
export async function confirmPayment(params: {
  orderId: string;
  paymentKey: string;
  amount: number;
}): Promise<PaymentConfirmResult> {
  const res = await refreshingFetch(`${BASE}/api/payments/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  let body: Envelope<PaymentConfirmResult> | null = null;
  try {
    body = await res.json();
  } catch {
    /* 바디 없음 */
  }

  if (!res.ok || !body?.success || !body.data) {
    throw new Error(body?.message ?? `결제 승인에 실패했어요 (${res.status})`);
  }
  return body.data;
}
