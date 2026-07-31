import { request } from '../../../shared/api/httpClient';
import { captureOrderResponseSchema, createOrderResponseSchema } from '../model/paymentTypes';

/**
 * PayPal 주문 생성. 결제 대상 예약 id 만 보내면 백엔드가 예약(PENDING 홀드)에서 금액을
 * 재계산해 PayPal Orders v2 주문을 만들고 그 order id 를 돌려준다.
 */
export async function createPaymentOrder(reservationId: number) {
  const data = await request<unknown>('/api/payments/orders', {
    method: 'POST',
    body: { reservationId },
  });
  return createOrderResponseSchema.parse(data);
}

/**
 * 결제 확정(capture). orderId 만 보내면 백엔드가 PayPal capture 를 호출하고, 성공 시
 * 해당 결제에 연결된 예약을 PENDING→CONFIRMED 로 확정한 뒤 그 reservationId 를 돌려준다.
 * (예약 id 는 Payment 가 보관하므로 클라이언트가 보내지 않는다.)
 */
export async function capturePaymentOrder(orderId: string) {
  const data = await request<unknown>(`/api/payments/orders/${orderId}/capture`, {
    method: 'POST',
  });
  return captureOrderResponseSchema.parse(data);
}
