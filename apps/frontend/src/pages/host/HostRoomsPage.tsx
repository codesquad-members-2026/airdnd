import { Link } from 'react-router-dom';
import {
  useHostRoomsQuery,
  useUpdateHostRoomStatusMutation,
} from '../../features/host/api/hostQueries';
import { HostRoomList } from '../../features/host/ui/HostRoomList';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function HostRoomsPage() {
  const hostRoomsQuery = useHostRoomsQuery();
  const statusMutation = useUpdateHostRoomStatusMutation();

  return (
    <section className="stack">
      <div className="row-between">
        <div className="page-heading">
          <p className="eyebrow">Host</p>
          <h1>호스트 숙소 관리</h1>
        </div>
        <Link className="primary-button" to="/host/rooms/new">
          숙소 등록
        </Link>
      </div>
      {hostRoomsQuery.isLoading ? <Loading message="호스트 숙소를 불러오는 중입니다." /> : null}
      {hostRoomsQuery.error ? <ErrorMessage error={hostRoomsQuery.error} /> : null}
      {statusMutation.error ? <ErrorMessage error={statusMutation.error} /> : null}
      {hostRoomsQuery.data ? (
        <HostRoomList
          rooms={hostRoomsQuery.data}
          onStatusChange={(roomId, status) => statusMutation.mutate({ roomId, status })}
        />
      ) : null}
    </section>
  );
}
