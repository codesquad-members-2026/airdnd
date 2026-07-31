import { z } from 'zod';

// 주문 생성 응답: PayPal order id
export const createOrderResponseSchema = z.object({
  orderId: z.string(),
});

// 결제 확정(capture) 응답: 생성된 예약 id
export const captureOrderResponseSchema = z.object({
  reservationId: z.number(),
});

export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type CaptureOrderResponse = z.infer<typeof captureOrderResponseSchema>;
