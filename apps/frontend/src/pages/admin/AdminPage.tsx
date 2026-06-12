import { Link } from 'react-router-dom';
import { useAdminDashboardQuery } from '../../features/admin/api/adminQueries';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function AdminPage() {
  const dashboardQuery = useAdminDashboardQuery();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>관리자 대시보드</h1>
        <p className="muted">승인, 사용자 관리, 예약 현황, 대기열 상태를 확장할 수 있는 영역입니다.</p>
      </div>
      {dashboardQuery.isLoading ? <Loading message="관리자 지표를 불러오는 중입니다." /> : null}
      {dashboardQuery.error ? <ErrorMessage error={dashboardQuery.error} /> : null}
      {dashboardQuery.data ? (
        <>
          <div className="metric-grid">
            <Link className="metric-card" to="/admin/rooms/pending">
              <span>승인 대기 숙소</span>
              <strong>{dashboardQuery.data.pendingRooms}</strong>
            </Link>
            <Link className="metric-card" to="/admin/users">
              <span>활성 사용자</span>
              <strong>{dashboardQuery.data.activeUsers}</strong>
            </Link>
            <Link className="metric-card" to="/admin/reservations">
              <span>오늘 예약</span>
              <strong>{dashboardQuery.data.reservationsToday}</strong>
            </Link>
            <Link className="metric-card" to="/admin/waitlist">
              <span>대기열</span>
              <strong>{dashboardQuery.data.waitQueueSize}</strong>
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
