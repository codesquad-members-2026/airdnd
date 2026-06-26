import type { CreateReservationRequest, CurrentMemberInfo } from './generated/types.gen';
import type { SearchState } from '../../types';

/**
 * @CurrentMember는 서버에서 인증으로 처리되지만 OpenAPI 스펙에 쿼리 파라미터로 노출됨.
 * 백엔드 LoginArgumentResolver가 @CurrentMember를 항상 id=1 로 고정하고 이 쿼리값은
 * 읽지도 않으므로, 예약 생성·결제 prepare 모두 1번 회원으로 일관되게 흐른다(정렬은 서버가 보장).
 *
 * 반드시 빈 객체여야 한다. { id: 1 } 처럼 값을 넣으면 클라이언트가 `guest[id]=1` 로 직렬화하는데,
 * 대괄호가 인코딩되지 않은 쿼리스트링은 Tomcat이 400으로 거부해 CORS 오류처럼 보인다.
 */
export const GUEST_STUB: CurrentMemberInfo = {};

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
