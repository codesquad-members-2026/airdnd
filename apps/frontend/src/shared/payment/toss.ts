import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { PaymentPrepareResponse } from '../api/payment';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string;

/**
 * 카드 결제창(Redirect 방식)을 띄운다.
 *
 * 호출이 성공하면 토스가 prepare 응답의 successUrl/failUrl 로 브라우저를 통째로 리다이렉트하므로
 * 이 함수는 정상 흐름에선 반환하지 않는다. 결제창을 띄우기 전 단계에서 실패하면 throw 한다.
 */
export async function startCardPayment(prepare: PaymentPrepareResponse): Promise<void> {
  const tossPayments = await loadTossPayments(CLIENT_KEY);

  // 일회성 카드 결제(빌링 아님)라 customerKey는 구매자 식별용 무작위값이면 충분하다.
  const payment = tossPayments.payment({ customerKey: crypto.randomUUID() });

  await payment.requestPayment({
    method: 'CARD',
    // amount는 반드시 객체 { currency, value:정수 }. DTO엔 통화가 없어 KRW 고정, value는 정수로 변환.
    amount: { currency: 'KRW', value: Math.trunc(Number(prepare.amount)) },
    // orderId/orderName/successUrl/failUrl 은 prepare 응답을 그대로 사용 (프론트가 새로 만들지 않는다).
    orderId: prepare.orderId,
    orderName: prepare.orderName,
    successUrl: prepare.successUrl,
    failUrl: prepare.failUrl,
    card: {
      useEscrow: false,
      flowMode: 'DEFAULT',
      useCardPoint: false,
      useAppCardOnly: false,
    },
  });
}
