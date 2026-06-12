import { useCurrentUserQuery } from '../../features/auth/api/authQueries';
import { getRoleLabel } from '../../features/auth/lib/authAccess';
import { Loading } from '../../shared/ui/Loading';

export function MyPage() {
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) {
    return <Loading message="사용자 정보를 불러오는 중입니다." />;
  }

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">My Page</p>
        <h1>마이페이지</h1>
      </div>
      {user ? (
        <article className="info-card">
          <dl>
            <div>
              <dt>이름</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>역할</dt>
              <dd>{getRoleLabel(user.role)}</dd>
            </div>
          </dl>
        </article>
      ) : null}
    </section>
  );
}
