import { describe, expect, it } from 'vitest';
import { reservationSchema } from './reservationTypes';

describe('S1 예약 당시 정보 상세 계약', () => {
  it('예약 당시 1박 가격을 상세 응답에 보존한다', () => {
    const reservation = reservationSchema.parse({
      id: 9001,
      roomId: 101,
      roomName: '성수 루프탑 스테이',
      roomUrl: 'https://example.com/room.jpg',
      region: '서울',
      checkIn: '2026-07-10',
      checkOut: '2026-07-12',
      guests: 2,
      pricePerNight: 145000,
      totalPrice: 290000,
      status: 'CONFIRMED',
    });

    expect(reservation).toMatchObject({
      pricePerNight: 145000,
      totalPrice: 290000,
    });
  });

  it('예약 당시 대표 이미지가 없어도 상세 응답을 처리한다', () => {
    expect(() =>
      reservationSchema.parse({
        id: 9002,
        roomId: 102,
        roomName: '이미지 없는 숙소',
        roomUrl: '',
        region: '부산',
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        guests: 2,
        pricePerNight: 100000,
        totalPrice: 200000,
        status: 'PENDING',
      }),
    ).not.toThrow();
  });
});
