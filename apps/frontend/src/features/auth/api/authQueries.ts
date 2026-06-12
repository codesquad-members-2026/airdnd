import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activateHost, getCurrentUser, logout } from './authApi';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
};

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: getCurrentUser,
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.me, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
    },
  });
}

export function useHostActivationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateHost,
    onSuccess: (user) => {
      // 백엔드 세션 갱신(SessionReAuthenticator)과 짝을 이뤄 캐시의 role도 즉시 갱신합니다.
      queryClient.setQueryData(authQueryKeys.me, user);
    },
  });
}
