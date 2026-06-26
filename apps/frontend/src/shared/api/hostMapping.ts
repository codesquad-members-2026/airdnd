import type { HostListingSummary, ListingCreateRequest as ApiCreateRequest } from './generated/types.gen';
import type { HostListing, ListingFormData, RoomType } from '../../types';


export const ROOM_TYPE_FROM_API: Record<string, RoomType> = {
  ENTIRE_PLACE: '집 전체',
  PRIVATE_ROOM: '개인실',
  SHARED_ROOM: '다인실',
};

export const ROOM_TYPE_TO_API: Record<RoomType, 'ENTIRE_PLACE' | 'PRIVATE_ROOM' | 'SHARED_ROOM'> = {
  '집 전체': 'ENTIRE_PLACE',
  '개인실': 'PRIVATE_ROOM',
  '다인실': 'SHARED_ROOM',
};

export const TEMP_LISTING_COORDINATES = {
  latitude: 37.5665,
  longitude: 126.978,
};

export const AMENITY_TO_API = {
  '주방': 'KITCHEN',
  '무선 인터넷': 'WIFI',
  '에어컨': 'AIR_CONDITIONER',
  '헤어드라이어': 'HAIR_DRYER',
  '세탁기': 'WASHING_MACHINE',
  '무료 주차': 'FREE_PARKING',
  'TV': 'TV',
  '수영장': 'SWIMMING_POOL',
  '반려동물 동반 가능': 'PET_ALLOWED',
  '조식 포함': 'BREAKFAST_INCLUDED',
  '헬스장': 'GYM',
  '엘리베이터': 'ELEVATOR',
} as const;

/** API 응답(HostListingSummary) → 프론트엔드 HostListing 변환 */
export function toHostListing(s: HostListingSummary): HostListing {
  return {
    id: String(s.id ?? ''),
    title: s.name ?? '',
    loc: s.addressSummary ?? '',
    roomType: ROOM_TYPE_FROM_API[s.roomType ?? 'ENTIRE_PLACE'] ?? '집 전체',
    description: '',
    price: s.pricePerNight ?? 0,
    maxGuests: s.capacity?.maxGuests ?? 0,
    bedrooms: s.capacity?.bedrooms ?? 0,
    beds: s.capacity?.beds ?? 0,
    bathrooms: s.capacity?.bathrooms ?? 0,
    amenities: [],
    imageUrls: s.coverImage ? [s.coverImage] : [],
    active: s.state === 'APPROVED',
    state: s.state,
  };
}

/** 폼 데이터(ListingFormData) → API 요청(ListingCreateRequest) 변환 */
export function toCreateRequest(form: ListingFormData): ApiCreateRequest {
  return {
    name: form.title,
    roadAddress: form.streetAddress,
    detailAddress: form.detailAddress,
    postalCode: form.zipCode,
    latitude: form.latitude || TEMP_LISTING_COORDINATES.latitude,
    longitude: form.longitude || TEMP_LISTING_COORDINATES.longitude,
    roomType: ROOM_TYPE_TO_API[form.roomType],
    maxGuests: form.maxGuests,
    bedrooms: form.bedrooms,
    beds: form.beds,
    bathrooms: form.bathrooms,
    // 배열 순서 = 등록 시 순서(sort_order), 0번 = 커버
    images: form.imageUrls.filter(u => u.trim()),
    description: form.description,
    pricePerNight: Math.round(form.price * 100) / 100,
    amenities: form.amenities
      .map(a => AMENITY_TO_API[a as keyof typeof AMENITY_TO_API])
      .filter((a): a is NonNullable<typeof a> => a != null),
  };
}
