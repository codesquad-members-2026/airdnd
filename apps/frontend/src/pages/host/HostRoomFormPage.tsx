import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateHostRoomMutation,
  useHostRoomQuery,
} from '../../features/host/api/hostQueries';
import { useUpdateRoomMutation } from '../../features/rooms/api/roomsQueries';
import {
  HostRoomFormInput,
  HostRoomUpdateFormInput,
} from '../../features/host/model/hostRoomTypes';
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
  const updateMutation = useUpdateRoomMutation(parsedRoomId ?? 0);
  
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;
  const error = isEditMode ? updateMutation.error : createMutation.error;

  function handleCreate(input: HostRoomFormInput) {
    createMutation.mutate(input, {
      onSuccess: () => navigate('/host/rooms'),
    });
  }

  function handleUpdate(input: HostRoomUpdateFormInput) {
    const amenities = input.amenities ?? [];

    updateMutation.mutate(
      {
        name: input.name,
        description: input.description ?? '',
        pricePerNight: input.pricePerNight,
        maxGuests: input.maxGuests,
        allowsInfants: input.allowsInfants ?? false,
        allowsPets: input.allowsPets ?? false,
        amenities,
        // imageUrls[0] 이 대표 이미지(백엔드 수정 계약과 일치).
        imageUrls: input.imageUrls,
      },
      {
        onSuccess: () => navigate('/host/rooms'),
      },
    );
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
      {isEditMode && hostRoomQuery.error ? <ErrorMessage error={hostRoomQuery.error} /> : null}
      {error ? <ErrorMessage error={error} /> : null}
      {isEditMode && hostRoomQuery.data ? (
        <HostRoomForm
          key={`edit-${parsedRoomId}`}
          mode="edit"
          initialValue={hostRoomQuery.data}
          isSubmitting={isPending}
          onSubmit={handleUpdate}
        />
      ) : !isEditMode ? (
        <HostRoomForm key="create" mode="create" isSubmitting={isPending} onSubmit={handleCreate} />
      ) : null}
    </section>
  );
}
