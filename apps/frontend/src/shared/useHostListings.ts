import { useQuery } from '@tanstack/react-query';
import { getHostListingsOptions } from './api/generated/@tanstack/react-query.gen';
import { toHostListing } from './api/hostMapping';

export function useHostListings() {
  const query = useQuery(getHostListingsOptions());
  const listings = query.data?.data?.listings?.map(toHostListing) ?? [];
  return { ...query, listings };
}
