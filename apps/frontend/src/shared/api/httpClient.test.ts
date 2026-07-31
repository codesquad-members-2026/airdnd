import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './apiError';
import { request } from './httpClient';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request error responses', () => {
  it('preserves a backend error response message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            code: 'VALIDATION_FAILED',
            message: '요청 값의 형식이 올바르지 않습니다.',
          },
          { status: 400 },
        ),
      ),
    );

    await expect(request('/api/host/rooms')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_FAILED',
      message: '요청 값의 형식이 올바르지 않습니다.',
    });
  });

  it('returns a visible fallback error for a non-JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Bad Request', { status: 400 })),
    );

    await expect(request('/api/host/rooms')).rejects.toEqual(
      new ApiError(400, {
        code: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다.',
      }),
    );
  });
});
