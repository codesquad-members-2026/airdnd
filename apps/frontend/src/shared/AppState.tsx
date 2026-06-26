import { createContext, useContext, useState, type ReactNode } from 'react';
import { LISTINGS } from './demoListings';
import type { SearchState, Listing } from '../types';

const DEFAULT_SEARCH: SearchState = {
  destination: '',
  region: null,
  dates: '',
  range: null,
  priceMin: null,
  priceMax: null,
  guests: { adult: 1, child: 0, infant: 0, pet: 0 },
  guestLabel: '',
};

interface AppStateValue {
  search: SearchState;
  setSearch: (s: SearchState) => void;
  selectedListing: Listing;
  setSelectedListing: (l: Listing) => void;
  canceledIds: Set<number>;
  cancelReservation: (id: number) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<SearchState>(DEFAULT_SEARCH);
  const [selectedListing, setSelectedListing] = useState<Listing>(LISTINGS[0]);
  // 게스트 취소는 백엔드 연결 전이라 클라이언트에서 취소된 예약 id를 보관
  const [canceledIds, setCanceledIds] = useState<Set<number>>(new Set());
  const cancelReservation = (id: number) =>
    setCanceledIds(prev => new Set(prev).add(id));

  return (
    <AppStateContext.Provider
      value={{ search, setSearch, selectedListing, setSelectedListing, canceledIds, cancelReservation }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
