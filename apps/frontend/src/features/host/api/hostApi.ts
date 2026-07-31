import { request } from '../../../shared/api/httpClient';
import {
  ReservationCounts,
  ReservationPage,
  ReservationStatusFilter,
  reservationCountsSchema,
  reservationPageSchema,
} from '../../reservations/model/reservationTypes';
import {
  HostRoom,
  HostRoomFormInput,
  HostRoomStatus,
  hostRoomSchema,
} from '../model/hostRoomTypes';

interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

// 파일 한 장을 S3에 업로드하고, DB/화면에서 쓸 publicUrl 을 돌려준다.
// 1) 백엔드에서 presigned PUT URL 발급(세션 인증) → 2) S3 로 직접 PUT(쿠키 없이, Content-Type 일치 필수).
export async function uploadRoomImage(file: File): Promise<string> {
  let presigned: PresignResponse;
  try {
    presigned = await request<PresignResponse>('/api/host/rooms/images/presign', {
      method: 'POST',
      body: { fileName: file.name, contentType: file.type },
    });
  } catch {
    // presign 발급 실패(네트워크/인증/서버 오류) 시에도 동일한 친화적 문구로 노출한다.
    throw new Error('사진 등록에 실패하였습니다.');
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      // presign 에 박힌 Content-Type 과 반드시 동일해야 S3 가 서명을 검증한다.
      headers: { 'Content-Type': file.type },
      // 우리 세션 쿠키를 S3 로 보내면 안 된다(서명으로 인증되며, credentials 동반 시 CORS 거부).
    });
  } catch {
    // 네트워크/CORS 실패 시 fetch 는 "Failed to fetch" TypeError 를 던진다. 사용자에겐 친화적인 문구로 노출한다.
    throw new Error('사진 등록에 실패하였습니다.');
  }

  if (!uploadResponse.ok) {
    throw new Error('사진 등록에 실패하였습니다.');
  }

  return presigned.publicUrl;
}

export async function getHostRooms() {
  const data = await request<HostRoom[]>('/api/host/rooms');
  return hostRoomSchema.array().parse(data);
}

export async function getHostRoom(roomId: number) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}`);
  return hostRoomSchema.parse(data);
}

interface HostReservationsPageParams {
  roomId: number;
  // 'ALL' 이면 status 파라미터를 생략해 전체를 받는다.
  status: ReservationStatusFilter;
  cursor?: string;
}

// 호스트가 자기 숙소의 예약 현황을 커서 페이지로 조회한다. 서버가 status 필터링·정렬을 담당한다.
export async function getHostRoomReservations({
  roomId,
  status,
  cursor,
}: HostReservationsPageParams): Promise<ReservationPage> {
  const query = new URLSearchParams();
  if (status !== 'ALL') query.set('status', status);
  if (cursor) query.set('cursor', cursor);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  const data = await request<unknown>(`/api/host/rooms/${roomId}/reservations${suffix}`);
  return reservationPageSchema.parse(data);
}

// 상태 탭 배지에 표시할 전체/확정/대기/취소 카운트 요약(필터와 무관한 전체 집계).
export async function getHostRoomReservationCounts(roomId: number): Promise<ReservationCounts> {
  const data = await request<unknown>(`/api/host/rooms/${roomId}/reservations/summary`);
  return reservationCountsSchema.parse(data);
}

export async function createHostRoom(input: HostRoomFormInput) {
  const data = await request<number>('/api/host/rooms', {
    method: 'POST',
    body: normalizeHostRoomPayload(input),
  });
  return data;
}

export async function updateHostRoom(roomId: number, input: HostRoomFormInput) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}`, {
    method: 'PATCH',
    body: normalizeHostRoomPayload(input),
  });
  return hostRoomSchema.parse(data);
}

export async function updateHostRoomStatus(roomId: number, status: HostRoomStatus) {
  const data = await request<HostRoom>(`/api/host/rooms/${roomId}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return hostRoomSchema.parse(data);
}

function normalizeHostRoomPayload(input: HostRoomFormInput) {
  return {
    name: input.name,
    region: input.region,
    address: input.address,
    description: input.description,
    pricePerNight: input.pricePerNight,
    maxGuests: input.maxGuests,
    // imageUrls[0] 이 대표 이미지, 나머지가 추가 이미지(백엔드 등록 계약과 일치).
    imageUrl: input.imageUrls[0],
    imageUrls: input.imageUrls.slice(1),
    amenities: input.amenities,
    allowsInfants: input.allowsInfants ?? false,
    allowsPets: input.allowsPets ?? false,
    countryCode: input.countryCode,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}
