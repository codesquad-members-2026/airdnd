import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addRoomToWishlist, createWishlist, getWishlist, getWishlists } from './wishlistApi';

export const wishlistQueryKeys = {
  list: ['wishlist', 'list'] as const,
  detail: (wishlistId: number) => ['wishlist', 'detail', wishlistId] as const,
};

export function useWishlistsQuery(enabled = true) {
  return useQuery({
    queryKey: wishlistQueryKeys.list,
    queryFn: getWishlists,
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

export function useCreateWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createWishlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list });
    },
  });
}

export function useAddRoomToWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wishlistId, roomId }: { wishlistId: number; roomId: number }) =>
      addRoomToWishlist(wishlistId, roomId),
    onSuccess: (_data, { wishlistId }) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.detail(wishlistId) });
    },
  });
}
