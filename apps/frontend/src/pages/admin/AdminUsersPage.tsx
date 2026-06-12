import { useAdminUsersQuery } from '../../features/admin/api/adminQueries';
import { formatDate } from '../../shared/lib/format';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function AdminUsersPage() {
  const usersQuery = useAdminUsersQuery();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>사용자 관리</h1>
      </div>
      {usersQuery.isLoading ? <Loading message="사용자 목록을 불러오는 중입니다." /> : null}
      {usersQuery.error ? <ErrorMessage error={usersQuery.error} /> : null}
      {usersQuery.data ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>사용자</th>
                <th>역할</th>
                <th>예약 수</th>
                <th>가입일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <p className="muted">{user.email}</p>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.reservationCount}</td>
                  <td>{formatDate(user.joinedAt)}</td>
                  <td>
                    <StatusBadge>{user.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
