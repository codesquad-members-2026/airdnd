import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateHostRoomMutation,
  useHostRoomQuery,
  useUpdateHostRoomMutation,
} from '../../features/host/api/hostQueries';
import { HostRoomFormInput } from '../../features/host/model/hostRoomTypes';
import { HostRoomForm } from '../../features/host/ui/HostRoomForm';
import { ErrorMessage } from '../../shared/ui/ErrorMessage';
import { Loading } from '../../shared/ui/Loading';

export function HostRoomFormPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const parsedRoomId = roomId ? Number(roomId) : undefined;
  const isEditMode = typeof parsedRoomId === 'number' && Number.isFinite(parsedRoomId);
  const hostRoomQuery = useHostRoomQuery(parsedRoomId);
  const createMutation = useCreateHostRoomMutation();
  const updateMutation = useUpdateHostRoomMutation(parsedRoomId ?? 0);
  const activeMutation = isEditMode ? updateMutation : createMutation;

  function handleSubmit(input: HostRoomFormInput) {
    activeMutation.mutate(input, {
      onSuccess: () => navigate('/host/rooms'),
    });
  }

  if (isEditMode && hostRoomQuery.isLoading) {
    return <Loading message="숙소 정보를 불러오는 중입니다." />;
  }

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="eyebrow">Host</p>
        <h1>{isEditMode ? '숙소 수정' : '숙소 등록'}</h1>
      </div>
      {hostRoomQuery.error ? <ErrorMessage error={hostRoomQuery.error} /> : null}
      {activeMutation.error ? <ErrorMessage error={activeMutation.error} /> : null}
      <HostRoomForm
        initialValue={hostRoomQuery.data}
        isSubmitting={activeMutation.isPending}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
