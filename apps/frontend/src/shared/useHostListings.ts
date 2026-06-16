import { useQuery } from '@tanstack/react-query';
import { getHostListingsOptions } from './api/generated/@tanstack/react-query.gen';
import { toHostListing, HOST_STUB } from './api/hostMapping';

export function useHostListings() {
  const query = useQuery(getHostListingsOptions({ query: { host: HOST_STUB } }));
  const listings = query.data?.data?.listings?.map(toHostListing) ?? [];
  return { ...query, listings };
}
