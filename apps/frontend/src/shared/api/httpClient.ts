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

  if (!response.ok) {
    throw new ApiError(response.status, parseErrorBody(text));
  }

  return (text ? JSON.parse(text) : undefined) as TResponse;
}

function parseErrorBody(text: string): ApiErrorBody {
  const fallback: ApiErrorBody = {
    code: 'UNKNOWN_ERROR',
    message: '알 수 없는 오류가 발생했습니다.',
  };

  if (!text) {
    return fallback;
  }

  try {
    const data: unknown = JSON.parse(text);

    if (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      typeof data.code === 'string' &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data as ApiErrorBody;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
