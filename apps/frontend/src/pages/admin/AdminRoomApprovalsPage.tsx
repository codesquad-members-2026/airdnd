import {
  useApproveRoomMutation,
  usePendingRoomReviewsQuery,
  useRejectRoomMutation,
} from '../../features/admin/api/adminQueries';
import { formatCurrency } from '../../shared/lib/format';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function AdminRoomApprovalsPage() {
  const roomsQuery = usePendingRoomReviewsQuery();
  const approveMutation = useApproveRoomMutation();
  const rejectMutation = useRejectRoomMutation();

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Admin</p>
        <h1>숙소 승인 관리</h1>
        <p className="muted">호스트가 등록한 숙소의 공개 여부를 검토합니다.</p>
      </div>
      {roomsQuery.isLoading ? <Loading message="승인 대기 숙소를 불러오는 중입니다." /> : null}
      {roomsQuery.error ? <ErrorMessage error={roomsQuery.error} /> : null}
      {approveMutation.error ? <ErrorMessage error={approveMutation.error} /> : null}
      {rejectMutation.error ? <ErrorMessage error={rejectMutation.error} /> : null}
      {roomsQuery.data?.length === 0 ? <EmptyState title="승인 대기 숙소가 없습니다." /> : null}
      {roomsQuery.data ? (
        <div className="list-stack">
          {roomsQuery.data.map((room) => (
            <article className="reservation-item" key={room.id}>
              <img src={room.imageUrl} alt={`${room.name} 대표 이미지`} />
              <div className="reservation-content">
                <h2>{room.name}</h2>
                <p className="muted">{room.address}</p>
                <strong>{formatCurrency(room.pricePerNight)} / 박</strong>
              </div>
              <div className="button-group">
                <button className="primary-button" type="button" onClick={() => approveMutation.mutate(room.id)}>
                  승인
                </button>
                <button className="secondary-button" type="button" onClick={() => rejectMutation.mutate(room.id)}>
                  반려
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
