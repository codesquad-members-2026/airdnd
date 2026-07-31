import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode, useState } from 'react';
import { isMapsConfigured, mapsConfig } from '../../features/maps/config/mapsConfig';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  // Google Maps API는 앱 전체에서 한 번만 로드합니다.
  // 키가 없으면(테스트/미설정) 지도 없이 동작하도록 APIProvider를 건너뜁니다.
  if (!isMapsConfigured) {
    return content;
  }

  return <APIProvider apiKey={mapsConfig.apiKey}>{content}</APIProvider>;
}
