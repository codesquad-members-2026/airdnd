import { TEMP_LISTING_COORDINATES } from '../../../shared/api/hostMapping';
import type { ListingFormData, RoomType } from '../../../types';

export const ROOM_TYPES: RoomType[] = ['집 전체', '개인실', '다인실'];

export const AMENITIES = [
  '주방', '무선 인터넷', '에어컨', '헤어드라이어',
  '세탁기', '무료 주차', 'TV', '수영장',
  '반려동물 동반 가능', '조식 포함', '헬스장', '엘리베이터',
];

export const STEPS = [
  { title: '기본 정보', description: '숙소 이름과 방 유형을 입력하세요.' },
  { title: '주소', description: '도로명 주소와 상세 주소를 입력하세요.' },
  { title: '공간 구성', description: '게스트가 사용할 수 있는 공간 규모를 알려주세요.' },
  { title: '숙소 설명', description: '설명을 입력하면 숙소 분위기와 이용 팁이 잘 전달되어 게스트가 더 쉽게 선택할 수 있습니다.' },
  { title: '요금', description: '1박 기준 요금을 입력하세요.' },
  { title: '편의시설', description: '게스트에게 제공되는 항목을 선택하세요.' },
  { title: '이미지', description: '숙소 이미지 URL을 추가하세요.' },
] as const;

export const DEFAULT_FORM: ListingFormData = {
  title: '',
  city: '',
  district: '',
  streetAddress: '',
  detailAddress: '',
  zipCode: '',
  latitude: TEMP_LISTING_COORDINATES.latitude,
  longitude: TEMP_LISTING_COORDINATES.longitude,
  roomType: '집 전체',
  description: '',
  price: 0,
  maxGuests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [],
  imageUrls: [''],
};
