import { z } from 'zod';

export const reservationStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELED']);

export const reservationSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  roomName: z.string(),
  roomImageUrl: z.string().url(),
  region: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
  status: reservationStatusSchema,
  guestName: z.string().optional(),
  createdAt: z.string().optional(),
});

export const createReservationSchema = z
  .object({
    roomId: z.number(),
    checkIn: z.string().min(1, '체크인 날짜를 선택하세요.'),
    checkOut: z.string().min(1, '체크아웃 날짜를 선택하세요.'),
    adults: z.coerce.number().min(1, '성인은 1명 이상이어야 합니다.'),
    children: z.coerce.number().min(0).default(0),
    infants: z.coerce.number().min(0).default(0),
    pets: z.coerce.number().min(0).default(0),
  })
  .refine((value) => value.checkIn < value.checkOut, {
    message: '체크아웃은 체크인보다 늦어야 합니다.',
    path: ['checkOut'],
  });

export type Reservation = z.infer<typeof reservationSchema>;
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreateReservationFormValues = z.input<typeof createReservationSchema>;

export type CreateReservationPayload = {
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  adultCount: number;
  childCount: number;
  infantCount: number;
  hasPets: boolean;
};
