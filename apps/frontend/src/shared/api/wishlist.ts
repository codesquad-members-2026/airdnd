import type { WishlistSummary } from '../../types';
import { API_BASE as BASE } from './config';
import { refreshingFetch } from './http';
import { getHostListingDetail } from './generated/sdk.gen';

/** 특정 숙소가 현재 로그인 사용자의 위시리스트에 담겨 있는지 조회. 담겼으면 wishlistId, 아니면 null.
 *  (로그인 직후 "이미 저장된 숙소" 판별용 — 생성 client 라 인증 쿠키/401 재발급이 자동 적용된다) */
export async function fetchListingWishlistId(listingId: number): Promise<number | null> {
  const { data } = await getHostListingDetail({ path: { listingsId: listingId } });
  return data?.data?.wishlistId ?? null;
}

/** 백엔드 ApiResponse 봉투 */
interface Envelope<T> {
  success: boolean;
  code?: string;
  data?: T;
  message?: string;
}

/** 실패 응답을 status/code/message 와 함께 던지기 위한 에러 */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await refreshingFetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  let body: Envelope<T> | null = null;
  try {
    body = await res.json();
  } catch {
    /* 바디 없음 */
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(res.status, body?.message ?? `요청에 실패했어요 (${res.status})`, body?.code);
  }
  return body.data as T;
}

/** GET /api/wishlists — 현재 멤버의 위시리스트 목록
 *  (백엔드 ApiResponse가 @JsonInclude(NON_EMPTY)라 빈 목록일 때 data가 빠져 옴 → [] 보정) */
export function getWishlists(): Promise<WishlistSummary[]> {
  return request<WishlistSummary[] | undefined>('/api/wishlists').then((ws) => ws ?? []);
}

/** POST /api/wishlists/{wishlistId}/items — 기존 위시리스트에 숙소 추가 */
export function addItemToWishlist(wishlistId: number, listingId: number): Promise<unknown> {
  return request(`/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
}

/** POST /api/wishlists/items — 새 위시리스트 생성 + 숙소 추가 */
export interface WishlistAddResult {
  wishlistId: number;
  listingId: number;
  name: string;
}
export function createWishlistWithItem(listingId: number, name: string): Promise<WishlistAddResult> {
  return request<WishlistAddResult>('/api/wishlists/items', {
    method: 'POST',
    body: JSON.stringify({ listingId, name }),
  });
}

/** PATCH /api/wishlists/{wishlistId}/items/{listingId} — 항목 메모 수정 (빈 메모 허용) */
export interface WishlistItemPatchResult {
  wishlistId: number;
  listingId: number;
  note: string | null;
}
export function updateWishlistItemNote(
  wishlistId: number,
  listingId: number,
  note: string,
): Promise<WishlistItemPatchResult> {
  return request<WishlistItemPatchResult>(`/api/wishlists/${wishlistId}/items/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  });
}

/** PATCH /api/wishlists/{wishlistId} — 위시리스트 이름 변경 */
export interface WishlistPatchResult {
  id: number;
  name: string;
}
export function renameWishlist(wishlistId: number, name: string): Promise<WishlistPatchResult> {
  return request<WishlistPatchResult>(`/api/wishlists/${wishlistId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

/** DELETE /api/wishlists/{wishlistId} — 위시리스트 전체 삭제 */
export function deleteWishlist(wishlistId: number): Promise<unknown> {
  return request(`/api/wishlists/${wishlistId}`, { method: 'DELETE' });
}

/** DELETE /api/wishlists/{wishlistId}/items/{listingId} — 위시리스트에서 숙소 제거 */
export function removeWishlistItem(wishlistId: number, listingId: number): Promise<unknown> {
  return request(`/api/wishlists/${wishlistId}/items/${listingId}`, { method: 'DELETE' });
}
