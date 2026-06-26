import listing1 from '../../assets/listing-1.png';
import listing2 from '../../assets/listing-2.png';
import listing3 from '../../assets/listing-3.png';
import listing4 from '../../assets/listing-4.png';
import type { SearchState } from '../../types';

export const ASSET_MAP: Record<string, string> = {
  'listing-1': listing1,
  'listing-2': listing2,
  'listing-3': listing3,
  'listing-4': listing4,
};

export function listingImage(img: string): string {
  return ASSET_MAP[img] ?? listing1;
}

/** 체크인·체크아웃 범위에서 숙박 일수 계산 (없으면 1박) */
export function nightsOf(search: SearchState): number {
  const a = search.range?.a;
  const b = search.range?.b;
  if (a && b) {
    const diff = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
    if (diff >= 1) return diff;
  }
  return 1;
}
