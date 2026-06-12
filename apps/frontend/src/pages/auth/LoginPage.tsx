import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUserQuery } from '../../features/auth/api/authQueries';
import { saveAuthReturnTo, toInternalPath } from '../../features/auth/lib/authRedirect';
import { getGoogleOAuthUrl } from '../../shared/config/env';
import { Loading } from '../../shared/ui/Loading';

export function LoginPage() {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUserQuery();
  const from = (location.state as { from?: { pathname: string; search?: string; hash?: string } } | null)
    ?.from;
  const returnTo = toInternalPath(from);

  if (isLoading) {
    return <Loading message="로그인 상태를 확인하는 중입니다." />;
  }

  if (user) {
    return <Navigate to={returnTo === '/' ? '/my' : returnTo} replace />;
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">OAuth Login</p>
      <h1>로그인</h1>
      <p className="muted">
        Google 계정으로 로그인하거나 처음 방문한 경우 계정을 생성합니다.
      </p>
      <a
        className="primary-button inline-action"
        href={getGoogleOAuthUrl()}
        onClick={() => saveAuthReturnTo(returnTo)}
      >
        Google로 계속하기
      </a>
    </section>
  );
}
