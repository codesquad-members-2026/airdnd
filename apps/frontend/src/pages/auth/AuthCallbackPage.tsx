import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '../../features/auth/api/authApi';
import { authQueryKeys } from '../../features/auth/api/authQueries';
import { consumeAuthReturnTo } from '../../features/auth/lib/authRedirect';
import { Loading } from '../../shared/ui/Loading';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasStarted = useRef(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    queryClient
      .fetchQuery({
        queryKey: authQueryKeys.me,
        queryFn: getCurrentUser,
        staleTime: 0,
      })
      .then((user) => {
        if (!user) {
          setHasFailed(true);
          return;
        }

        navigate(consumeAuthReturnTo(), { replace: true });
      })
      .catch(() => setHasFailed(true));
  }, [navigate, queryClient]);

  if (!hasFailed) {
    return <Loading message="로그인 상태를 확인하는 중입니다." />;
  }

  return (
    <section className="stack">
      <p className="eyebrow">OAuth Callback</p>
      <h1>로그인을 완료하지 못했습니다.</h1>
      <div className="state-box error" role="alert">
        <strong>인증 세션을 확인할 수 없습니다.</strong>
        <p>Google 로그인을 다시 시도해 주세요.</p>
      </div>
      <div className="button-group">
        <Link className="primary-button inline-action" to="/login">
          다시 로그인
        </Link>
        <Link className="secondary-button inline-action" to="/">
          홈으로 이동
        </Link>
      </div>
    </section>
  );
}
