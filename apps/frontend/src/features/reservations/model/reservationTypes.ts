import { z } from 'zod';
import { cursorPageSchema } from '../../../shared/api/cursorPage';

export const reservationStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']);

export const reservationSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  roomName: z.string(),
  roomUrl: z.string(),
  region: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  pricePerNight: z.number(),
  totalPrice: z.number(),
  status: reservationStatusSchema,
  expiresAt: z.string().nullish(), // PENDING 홀드 만료 시각(ISO). CONFIRMED/CANCELLED 면 null
  guestName: z.string().optional(),
  createdAt: z.string().optional(),
  // 이 예약에 후기를 이미 작성했는지 (목록 응답에만 포함 — 단건 응답엔 없을 수 있어 기본 false)
  hasReview: z.boolean().default(false),
});

export const bookedDateRangeSchema = z.object({
  checkInDate: z.string(),
  checkOutDate: z.string(),
});

export type BookedDateRange = z.infer<typeof bookedDateRangeSchema>;

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

/**
 * POST /api/reservations 로 보내는 PENDING 홀드 생성 페이로드.
 * 금액(totalPrice)·guestId 는 보내지 않는다 — 백엔드가 roomId+날짜로 재계산하고
 * guestId 는 인증 principal 에서 가져온다.
 */
export type CreateReservationPayload = {
  roomId: number;
  checkInDate: string; // yyyy-MM-dd
  checkOutDate: string; // yyyy-MM-dd
  adultCount: number;
  childCount: number;
  infantCount: number;
  hasPets: boolean;
};

// 호스트 예약 현황의 커서 페이지(서버가 status 로 필터링·정렬해 한 페이지씩 내려준다).
export const reservationPageSchema = cursorPageSchema(reservationSchema);
export type ReservationPage = z.infer<typeof reservationPageSchema>;

// 상태 탭 카운트 요약. 페이지 응답과 분리된 별도 엔드포인트에서 내려온다.
export const reservationCountsSchema = z.object({
  all: z.number().int().nonnegative(),
  confirmed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
});
export type ReservationCounts = z.infer<typeof reservationCountsSchema>;

// 호스트 예약 목록 상태 필터. 'ALL' 은 status 파라미터를 생략(전체)한다는 의미.
export type ReservationStatusFilter = 'ALL' | ReservationStatus;

// 게스트 예약 목록 탭. 날짜 기반 파생 그룹이라 status 와 1:1이 아니다(서버가 오늘 기준으로 가른다).
export type GuestReservationTab = 'upcoming' | 'past' | 'cancelled';

// 게스트 탭 배지 카운트 요약. 페이지 응답과 분리된 별도 엔드포인트에서 내려온다.
export const guestReservationCountsSchema = z.object({
  upcoming: z.number().int().nonnegative(),
  past: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
});
export type GuestReservationCounts = z.infer<typeof guestReservationCountsSchema>;

export type Reservation = z.infer<typeof reservationSchema>;
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreateReservationFormValues = z.input<typeof createReservationSchema>;
