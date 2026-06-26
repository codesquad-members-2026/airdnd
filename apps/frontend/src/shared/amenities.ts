// 어메니티 한글명 → Icon 이름. 등록 폼/상세 페이지 공용
export const AMENITY_ICONS: Record<string, string> = {
  '주방': 'utensils',
  '무선 인터넷': 'wifi',
  '에어컨': 'wind',
  '헤어드라이어': 'wind',
  '세탁기': 'washing-machine',
  '무료 주차': 'car',
  'TV': 'tv',
  '수영장': 'waves',
  '반려동물 동반 가능': 'paw-print',
  '조식 포함': 'coffee',
  '헬스장': 'dumbbell',
  '엘리베이터': 'arrow-up-down',
};

// 백엔드 Amenity enum → 한글명
export const AMENITY_ENUM_TO_KR: Record<string, string> = {
  KITCHEN: '주방',
  WIFI: '무선 인터넷',
  AIR_CONDITIONER: '에어컨',
  HAIR_DRYER: '헤어드라이어',
  WASHING_MACHINE: '세탁기',
  FREE_PARKING: '무료 주차',
  TV: 'TV',
  SWIMMING_POOL: '수영장',
  PET_ALLOWED: '반려동물 동반 가능',
  BREAKFAST_INCLUDED: '조식 포함',
  GYM: '헬스장',
  ELEVATOR: '엘리베이터',
};

// 전체 어메니티 목록(상세 페이지에서 미제공 항목 표시에도 사용)
export const ALL_AMENITIES = Object.keys(AMENITY_ICONS);

export function amenityIcon(name: string): string {
  return AMENITY_ICONS[name] ?? 'home';
}
