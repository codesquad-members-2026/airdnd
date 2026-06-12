import { useWaitlistSnapshotQuery } from '../../features/admin/api/adminQueries';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function AdminWaitlistPage() {
  const waitlistQuery = useWaitlistSnapshotQuery();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Waitlist</p>
        <h1>대기 시스템 상태</h1>
        <p className="muted">트래픽 집중 상황에서 입장 제어 상태를 모니터링합니다.</p>
      </div>
      {waitlistQuery.isLoading ? <Loading message="대기열 상태를 불러오는 중입니다." /> : null}
      {waitlistQuery.error ? <ErrorMessage error={waitlistQuery.error} /> : null}
      {waitlistQuery.data ? (
        <>
          <div className="metric-grid">
            <article className="metric-card">
              <span>상태</span>
              <strong>
                <StatusBadge>{waitlistQuery.data.status}</StatusBadge>
              </strong>
            </article>
            <article className="metric-card">
              <span>대기 사용자</span>
              <strong>{waitlistQuery.data.waitingUsers}</strong>
            </article>
            <article className="metric-card">
              <span>평균 대기</span>
              <strong>{waitlistQuery.data.averageWaitMinutes}분</strong>
            </article>
            <article className="metric-card">
              <span>분당 입장</span>
              <strong>{waitlistQuery.data.admissionRatePerMinute}</strong>
            </article>
          </div>
          <div className="state-box success">
            최근 갱신: {new Date(waitlistQuery.data.updatedAt).toLocaleString('ko-KR')}
          </div>
        </>
      ) : null}
    </section>
  );
}
