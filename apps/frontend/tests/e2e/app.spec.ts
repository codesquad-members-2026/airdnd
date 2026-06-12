import { expect, test, type Page } from '@playwright/test';

type MockCurrentUser = {
  id: number;
  name: string;
  email: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
};

async function mockCurrentUser(page: Page, user: MockCurrentUser) {
  await page.addInitScript((currentUser) => {
    const originalFetch = window.fetch;

    window.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input, window.location.origin);

      if (url.pathname === '/api/auth/me') {
        return Promise.resolve(Response.json(currentUser));
      }

      return originalFetch(input, init);
    };
  }, user);
}

test('숙소 목록에서 상세 화면으로 이동할 수 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '원하는 숙소를 검색하고 예약하세요.' })).toBeVisible();
  await page.getByRole('link', { name: /성수 루프탑 스테이/ }).click();
  await expect(page.getByRole('heading', { name: '성수 루프탑 스테이' })).toBeVisible();
});

test('검색바에서 가격 범위와 인원을 조정할 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '가격 범위' }).click();
  await expect(page.getByText('평균 1박 요금은')).toBeVisible();

  const sliderBox = await page.locator('.range-slider').boundingBox();
  expect(sliderBox).not.toBeNull();

  if (!sliderBox) {
    return;
  }

  await page.mouse.click(sliderBox.x + sliderBox.width * 0.45, sliderBox.y + sliderBox.height / 2);

  await page.getByRole('button', { name: '1명' }).click();
  await page.getByRole('button', { name: '아동 증가' }).click();
  await page.getByRole('button', { name: /검색/ }).click();

  await expect(page).toHaveURL(/minPrice=/);
  await expect(page).toHaveURL(/children=1/);
  await expect(page).toHaveURL(/guests=2/);
});

test('검색바 캘린더 드롭다운에서 체크인과 체크아웃을 선택할 수 있다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '날짜 선택' }).first().click();
  await expect(page.getByText('체크인 날짜 선택')).toBeVisible();

  await page.locator('.calendar-day:not([disabled])').first().click();
  await expect(page.getByText('체크아웃 날짜 선택')).toBeVisible();

  await page.locator('.calendar-day:not([disabled])').first().click();
  await page.getByRole('button', { name: /검색/ }).click();

  await expect(page).toHaveURL(/checkIn=/);
  await expect(page).toHaveURL(/checkOut=/);
});

test('인원 필터는 각 항목이 8명에서 증가 버튼이 비활성화된다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '1명' }).click();
  const increaseButtons = [
    page.getByRole('button', { name: '성인 증가' }),
    page.getByRole('button', { name: '아동 증가' }),
    page.getByRole('button', { name: '유아 증가' }),
  ];

  for (const increaseButton of increaseButtons) {
    for (let count = 0; count < 8; count += 1) {
      if (await increaseButton.isDisabled()) {
        break;
      }

      await increaseButton.click();
    }

    await expect(increaseButton).toBeDisabled();
  }
});

test('로그인 페이지는 Google OAuth 시작 URL을 제공한다', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('link', { name: 'Google로 계속하기' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:8080/oauth2/authorization/google',
  );
});

test('OAuth 콜백에서 인증 세션이 없으면 다시 로그인할 수 있다', async ({ page }) => {
  await page.goto('/auth/callback');

  await expect(page.getByRole('heading', { name: '로그인을 완료하지 못했습니다.' })).toBeVisible();
  await expect(page.getByRole('link', { name: '다시 로그인' })).toHaveAttribute('href', '/login');
});

test('OAuth 콜백에서 인증 사용자는 저장된 내부 경로로 이동한다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 1,
    name: 'Google 사용자',
    email: 'google@example.com',
    role: 'GUEST',
  });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('airdnd.auth.returnTo', '/reservations');
  });

  await page.goto('/auth/callback');

  await expect(page).toHaveURL('/reservations');
});

test('게스트에게는 예약 메뉴만 표시되고 호스트 화면 접근은 거부된다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 1,
    name: '게스트 사용자',
    email: 'guest@airdnd.test',
    role: 'GUEST',
  });

  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(navigation.getByRole('link', { name: '예약' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '호스트' })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: '관리자' })).toHaveCount(0);

  await page.goto('/host/rooms');
  await expect(page.getByRole('heading', { name: '접근 권한이 없습니다.' })).toBeVisible();
});

test('호스트에게는 호스트 메뉴가 표시되고 관리자 화면 접근은 거부된다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 2,
    name: '호스트 사용자',
    email: 'host@airdnd.test',
    role: 'HOST',
  });

  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(navigation.getByRole('link', { name: '호스트' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '관리자' })).toHaveCount(0);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: '접근 권한이 없습니다.' })).toBeVisible();
});

test('관리자에게는 호스트와 관리자 메뉴가 모두 표시된다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 3,
    name: '관리자 사용자',
    email: 'admin@airdnd.test',
    role: 'ADMIN',
  });

  await page.goto('/');

  const navigation = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(navigation.getByRole('link', { name: '호스트' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: '관리자' })).toBeVisible();
});

test('로그인 사용자가 로그인 화면을 다시 방문하면 마이페이지로 이동한다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 1,
    name: '게스트 사용자',
    email: 'guest@airdnd.test',
    role: 'GUEST',
  });

  await page.goto('/login');

  await expect(page).toHaveURL('/my');
});

test('로그아웃하면 사용자 캐시와 역할별 메뉴가 제거된다', async ({ page }) => {
  await mockCurrentUser(page, {
    id: 2,
    name: '호스트 사용자',
    email: 'host@airdnd.test',
    role: 'HOST',
  });

  await page.goto('/');
  await page.getByRole('button', { name: '호스트 사용자 계정 메뉴' }).click();
  await page.getByRole('button', { name: '로그아웃' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '예약' })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: '계정 메뉴' }).click();
  await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
});
