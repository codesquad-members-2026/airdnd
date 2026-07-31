import { expect, test, type Page } from '@playwright/test';

type ReservationSnapshot = {
  id: number;
  roomId: number;
  roomName: string;
  roomImageUrl?: string;
  region: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricePerNight: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
};

const confirmedReservation: ReservationSnapshot = {
  id: 9001,
  roomId: 101,
  roomName: '성수 루프탑 스테이',
  roomImageUrl: 'https://example.com/room.jpg',
  region: '서울',
  checkIn: '2026-07-10',
  checkOut: '2026-07-12',
  guests: 2,
  pricePerNight: 145000,
  totalPrice: 290000,
  status: 'CONFIRMED',
};

async function mockReservationSession(
  page: Page,
  detail: ReservationSnapshot | { error: true },
) {
  await page.addInitScript(
    ({ reservationDetail, reservationList }) => {
      const originalFetch = window.fetch;

      window.fetch = (input, init) => {
        const url = new URL(input instanceof Request ? input.url : input, window.location.origin);

        if (url.pathname === '/api/auth/me') {
          return Promise.resolve(
            Response.json({
              id: 1,
              name: '게스트 사용자',
              email: 'guest@airdnd.test',
              role: 'GUEST',
            }),
          );
        }

        if (url.pathname === '/api/reservations') {
          return Promise.resolve(Response.json(reservationList));
        }

        if (url.pathname === '/api/reservations/9001') {
          if ('error' in reservationDetail) {
            return Promise.resolve(
              Response.json(
                {
                  code: 'RESERVATION_LOAD_FAILED',
                  message: '예약을 불러오지 못했습니다.',
                },
                { status: 500 },
              ),
            );
          }

          return Promise.resolve(Response.json(reservationDetail));
        }

        if (url.pathname === '/api/rooms/101') {
          return Promise.resolve(
            Response.json({
              id: 101,
              name: '현재 이름으로 변경된 숙소',
              region: '현재 지역',
              address: '현재 주소',
              description: '예약 이후 변경된 숙소 정보',
              pricePerNight: 999000,
              maxGuests: 8,
              imageUrl: 'https://example.com/current-room.jpg',
              imageUrls: [],
              isAvailable: true,
              allowsPets: false,
              amenities: [],
              hostName: '현재 호스트',
              latitude: 37.5665,
              longitude: 126.978,
            }),
          );
        }

        return originalFetch(input, init);
      };
    },
    {
      reservationDetail: detail,
      reservationList: detail === confirmedReservation ? [confirmedReservation] : [],
    },
  );
}

test.describe('S1 예약 당시 정보 상세 보기', () => {
  test('예약 상세에서 예약 당시 1박 가격과 박수와 합계를 확인한다', async ({ page }) => {
    await mockReservationSession(page, confirmedReservation);

    await page.goto('/reservations/9001');

    await expect(page.getByText('₩145,000')).toBeVisible();
    await expect(page.getByText('2박')).toBeVisible();
    await expect(page.getByText('₩290,000')).toBeVisible();
  });

  test('예약 목록에서 상세로 이동해 예약 당시 정보와 금액 분해를 확인한다', async ({ page }) => {
    await mockReservationSession(page, confirmedReservation);
    await page.goto('/reservations');

    await page.getByRole('link', { name: '성수 루프탑 스테이' }).click();

    await expect(page).toHaveURL('/reservations/9001');
    await expect(page.getByText('예약 당시 정보입니다')).toBeVisible();
    await expect(page.getByText('현재 숙소 정보와 다를 수 있습니다')).toBeVisible();
    await expect(page.getByText('예약 확정')).toBeVisible();
    await expect(page.getByText('CONFIRMED')).toHaveCount(0);
    await expect(page.getByText('성수 루프탑 스테이')).toBeVisible();
    await expect(page.getByText('현재 이름으로 변경된 숙소')).toHaveCount(0);
    await expect(page.getByText('₩145,000')).toBeVisible();
    await expect(page.getByText('2박')).toBeVisible();
    await expect(page.getByText('₩290,000')).toBeVisible();
    await expect(page.getByText('서울')).toBeVisible();
    await expect(page.getByText('2026년 7월 10일')).toBeVisible();
    await expect(page.getByText('2026년 7월 12일')).toBeVisible();
    await expect(page.getByText('2명')).toBeVisible();
    await expect(page.getByRole('link', { name: '예약 목록으로' })).toHaveAttribute(
      'href',
      '/reservations',
    );
  });

  test('예약 당시 대표 이미지가 없어도 상세 정보 레이아웃을 유지한다', async ({ page }) => {
    await mockReservationSession(page, {
      ...confirmedReservation,
      roomImageUrl: undefined,
    });

    await page.goto('/reservations/9001');

    await expect(page.getByRole('heading', { name: '예약 확인' })).toBeVisible();
    await expect(page.getByRole('img', { name: /숙소 이미지 없음/ })).toBeVisible();
    await expect(page.getByText('성수 루프탑 스테이')).toBeVisible();
    await expect(page.getByText('예약 당시 정보입니다')).toBeVisible();
  });

  test('예약 상세 조회 실패 시 안내와 목록 복귀 경로를 제공한다', async ({ page }) => {
    await mockReservationSession(page, { error: true });

    await page.goto('/reservations/9001');

    await expect(page.getByRole('alert')).toContainText('예약을 불러오지 못했습니다.');
    await expect(page.getByRole('link', { name: '예약 목록으로' })).toHaveAttribute(
      'href',
      '/reservations',
    );
  });
});
