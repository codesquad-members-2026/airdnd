import type { CreateReservationRequest } from './generated/types.gen';
import type { SearchState } from '../../types';

type ApiErrorBody = {
  code?: string;
  message?: string;
  errors?: Array<{ field?: string; reason?: string }>;
};

const FALLBACK_ERROR = '예약에 실패했어요. 잠시 후 다시 시도해주세요.';

/**
 * createReservation 실패 시 throw된 에러 응답(ApiResponse)에서 표시 메시지 추출.
 * 검증 오류(errors[])가 있으면 필드 사유를, 없으면 상위 message를 사용.
 */
export function reservationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const body = err as ApiErrorBody;
    const reason = body.errors?.find((e) => e.reason)?.reason;
    if (reason) return reason;
    if (body.message) return body.message;
  }
  return FALLBACK_ERROR;
}

/** 검색 상태(날짜 범위 + 인원) → 예약 생성 요청 변환 */
export function toReservationRequest(search: SearchState): CreateReservationRequest {
  const range = search.range;
  if (!range?.a || !range?.b) {
    throw new Error('체크인/체크아웃 날짜를 선택해주세요.');
  }
  const g = search.guests;
  return {
    checkInDate: range.a,
    checkOutDate: range.b,
    adultGuestNum: g.adult,
    childGuestNum: g.child,
    babyGuestNum: g.infant,
    petGuestNum: g.pet,
  };
}
