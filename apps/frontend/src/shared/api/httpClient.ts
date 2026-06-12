import { env } from '../config/env';
import { ApiError, ApiErrorBody } from './apiError';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const defaultHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
};

export async function request<TResponse>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const body: ApiErrorBody = data ?? {
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다.',
    };
    throw new ApiError(response.status, body);
  }

  return data as TResponse;
}
