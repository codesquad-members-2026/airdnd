import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addRoomToWishlist,
  createWishlist,
  getSavedRoomIds,
  getWishlist,
  getWishlistIdsForRoom,
  getWishlistRooms,
  getWishlists,
  removeRoomFromWishlistFolder,
} from './wishlistApi';

export const wishlistQueryKeys = {
  list: ['wishlist', 'list'] as const,
  detail: (wishlistId: number) => ['wishlist', 'detail', wishlistId] as const,
  // 폴더에 담긴 숙소 커서 무한 쿼리(메타와 분리). 담기/빼기 시 detail 과 함께 무효화한다.
  detailRooms: (wishlistId: number) => ['wishlist', 'detail', wishlistId, 'rooms'] as const,
  savedRoomIds: ['wishlist', 'saved-room-ids'] as const,
  // 특정 방이 담긴 폴더 id 목록(팝오버 폴더별 체크 표시).
  roomFolders: (roomId: number) => ['wishlist', 'room-folders', roomId] as const,
};

export function useWishlistsQuery(enabled = true) {
  return useQuery({
    queryKey: wishlistQueryKeys.list,
    queryFn: getWishlists,
    enabled,
  });
}

// 로그인 회원이 저장한 방 id 집합(카드 하트 표시용). 여러 카드가 같은 키를 구독하므로 요청은 1번만 나간다.
export function useSavedRoomIdsQuery(enabled = true) {
  return useQuery({
    queryKey: wishlistQueryKeys.savedRoomIds,
    queryFn: getSavedRoomIds,
    enabled,
  });
}

// 특정 방이 어떤 폴더에 담겨 있는지(팝오버 열렸을 때만 로드).
export function useRoomWishlistIdsQuery(roomId: number, enabled = true) {
  return useQuery({
    queryKey: wishlistQueryKeys.roomFolders(roomId),
    queryFn: () => getWishlistIdsForRoom(roomId),
    enabled,
  });
}

export function useWishlistQuery(wishlistId?: number) {
  return useQuery({
    queryKey: wishlistQueryKeys.detail(wishlistId ?? 0),
    queryFn: () => getWishlist(wishlistId as number),
    enabled: typeof wishlistId === 'number' && Number.isFinite(wishlistId),
  });
}

// 폴더에 담긴 숙소를 커서 무한 스크롤로 불러온다(한 페이지씩 점진 로딩).
export function useWishlistRoomsQuery(wishlistId?: number) {
  return useInfiniteQuery({
    queryKey: wishlistQueryKeys.detailRooms(wishlistId ?? 0),
    queryFn: ({ pageParam }) => getWishlistRooms(wishlistId as number, pageParam ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor ?? undefined : undefined),
    enabled: typeof wishlistId === 'number' && Number.isFinite(wishlistId),
  });
}

export function useCreateWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createWishlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list });
    },
  });
}

type FolderMutationVars = { wishlistId: number; roomId: number };
type FolderMutationContext = { previousFolders?: number[]; previousSaved?: number[] };

// 방을 특정 폴더에 담기. 팝오버 체크표시와 하트가 즉시 반영되도록 낙관적으로 갱신하고 실패 시 롤백한다.
export function useAddRoomToWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, FolderMutationVars, FolderMutationContext>({
    mutationFn: ({ wishlistId, roomId }) => addRoomToWishlist(wishlistId, roomId),
    onMutate: async ({ wishlistId, roomId }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKeys.roomFolders(roomId) });
      const previousFolders = queryClient.getQueryData<number[]>(wishlistQueryKeys.roomFolders(roomId));
      const previousSaved = queryClient.getQueryData<number[]>(wishlistQueryKeys.savedRoomIds);
      queryClient.setQueryData<number[]>(wishlistQueryKeys.roomFolders(roomId), (prev) =>
        prev ? (prev.includes(wishlistId) ? prev : [...prev, wishlistId]) : prev,
      );
      queryClient.setQueryData<number[]>(wishlistQueryKeys.savedRoomIds, (prev) =>
        prev ? (prev.includes(roomId) ? prev : [...prev, roomId]) : prev,
      );
      return { previousFolders, previousSaved };
    },
    onError: (_error, { roomId }, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(wishlistQueryKeys.roomFolders(roomId), context.previousFolders);
      }
      if (context?.previousSaved) {
        queryClient.setQueryData(wishlistQueryKeys.savedRoomIds, context.previousSaved);
      }
    },
    onSettled: (_data, _error, { wishlistId, roomId }) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.roomFolders(roomId) });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.savedRoomIds });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detail(wishlistId) });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detailRooms(wishlistId) });
    },
  });
}

// 방을 특정 폴더에서만 빼기. 그 폴더에서만 빠지고, 남은 폴더가 없으면 하트도 회색이 된다(낙관적 + 롤백).
export function useRemoveRoomFromWishlistFolderMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, FolderMutationVars, FolderMutationContext>({
    mutationFn: ({ wishlistId, roomId }) => removeRoomFromWishlistFolder(wishlistId, roomId),
    onMutate: async ({ wishlistId, roomId }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKeys.roomFolders(roomId) });
      const previousFolders = queryClient.getQueryData<number[]>(wishlistQueryKeys.roomFolders(roomId));
      const previousSaved = queryClient.getQueryData<number[]>(wishlistQueryKeys.savedRoomIds);
      const nextFolders = previousFolders?.filter((id) => id !== wishlistId);
      queryClient.setQueryData(wishlistQueryKeys.roomFolders(roomId), nextFolders);
      // 마지막 폴더에서 빠지면 어느 폴더에도 없으므로 하트도 회색으로.
      if (nextFolders && nextFolders.length === 0) {
        queryClient.setQueryData<number[]>(wishlistQueryKeys.savedRoomIds, (prev) =>
          prev ? prev.filter((id) => id !== roomId) : prev,
        );
      }
      return { previousFolders, previousSaved };
    },
    onError: (_error, { roomId }, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(wishlistQueryKeys.roomFolders(roomId), context.previousFolders);
      }
      if (context?.previousSaved) {
        queryClient.setQueryData(wishlistQueryKeys.savedRoomIds, context.previousSaved);
      }
    },
    onSettled: (_data, _error, { wishlistId, roomId }) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.roomFolders(roomId) });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.savedRoomIds });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detail(wishlistId) });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detailRooms(wishlistId) });
    },
  });
}
