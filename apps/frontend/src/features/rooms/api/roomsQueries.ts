import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getRoom, getRooms, updateRoom, RoomUpdateRequest } from './roomsApi';
import { RoomSearchParams } from '../model/roomTypes';

export const roomQueryKeys = {
  list: (params: RoomSearchParams) => ['rooms', 'list', params] as const,
  detail: (roomId: number) => ['rooms', 'detail', roomId] as const,
};

// 목록(좌측 카드 리스트)과 지도 검색 페이지 공용. 커서 무한 스크롤. cursor 는 페이지마다 갈아끼우고
// 나머지 필터/뷰포트는 고정되므로 params 에서 cursor 는 제외하고 키를 만든다.
// 지도 페이지는 뷰포트(bbox)가 정해지기 전까지 호출하지 않도록 enabled 로 막는다.
export function useRoomListQuery(params: RoomSearchParams, enabled = true) {
  const stableParams: RoomSearchParams = { ...params };
  delete stableParams.cursor;
  return useInfiniteQuery({
    queryKey: roomQueryKeys.list(stableParams),
    queryFn: ({ pageParam }) =>
      getRooms({ ...stableParams, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor ?? undefined : undefined),
    enabled,
  });
}

export function useRoomQuery(roomId: number) {
  return useQuery({
    queryKey: roomQueryKeys.detail(roomId),
    queryFn: () => getRoom(roomId),
    enabled: Number.isFinite(roomId),
  });
}

export function useUpdateRoomMutation(roomId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RoomUpdateRequest) => updateRoom(roomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomQueryKeys.detail(roomId) });
    },
  });
}
