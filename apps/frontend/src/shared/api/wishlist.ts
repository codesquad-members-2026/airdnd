import type { WishlistSummary } from '../../types';

const BASE = 'http://localhost:8080';

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
  const res = await fetch(`${BASE}${path}`, {
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

/** GET /api/wishlists — 현재 멤버의 위시리스트 목록 */
export function getWishlists(): Promise<WishlistSummary[]> {
  return request<WishlistSummary[]>('/api/wishlists');
}

/** POST /api/wishlists/{wishlistId}/items — 기존 위시리스트에 숙소 추가 */
export function addItemToWishlist(wishlistId: number, listingId: number): Promise<unknown> {
  return request(`/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
}

/** POST /api/wishlists/items — 새 위시리스트 생성 + 숙소 추가 */
export function createWishlistWithItem(listingId: number, name: string): Promise<unknown> {
  return request('/api/wishlists/items', {
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
