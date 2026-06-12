import { ApiError } from '../api/apiError';

type ErrorMessageProps = {
  error: unknown;
  fallback?: string;
};

export function ErrorMessage({ error, fallback = '요청을 처리하지 못했습니다.' }: ErrorMessageProps) {
  const message = error instanceof ApiError ? error.message : fallback;

  return (
    <div className="state-box error" role="alert">
      <strong>오류</strong>
      <p>{message}</p>
    </div>
  );
}
