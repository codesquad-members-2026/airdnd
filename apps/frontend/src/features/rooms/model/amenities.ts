import type { LucideIcon } from 'lucide-react';
import {
  Wifi,
  Car,
  BatteryCharging,
  Utensils,
  UtensilsCrossed,
  CookingPot,
  Refrigerator,
  Microwave,
  Droplet,
  Droplets,
  CupSoda,
  Snowflake,
  Flame,
  Wind,
  AirVent,
  Tv,
  Speaker,
  WashingMachine,
  Fan,
  Shirt,
  Bath,
  BedDouble,
  Sofa,
  Briefcase,
  BookOpen,
  Gamepad2,
  Bike,
  Baby,
  Waves,
  Dumbbell,
  Thermometer,
  Coffee,
  PawPrint,
  ShieldCheck,
  Cctv,
  KeyRound,
  FireExtinguisher,
  Mountain,
  TreePine,
  Trees,
  Sun,
  Check,
} from 'lucide-react';

export type AmenityOption = {
  value: string;
  icon: LucideIcon;
};

// 숙소 등록 시 선택 가능한 편의시설의 정식 목록(단일 소스).
// 이 목록을 등록 폼 체크박스와 상세페이지 아이콘이 함께 사용한다.
export const AMENITY_OPTIONS: AmenityOption[] = [
  { value: '와이파이', icon: Wifi },
  { value: '무료 주차', icon: Car },
  { value: '전기차 충전', icon: BatteryCharging },
  { value: '주방', icon: Utensils },
  { value: '조리도구', icon: CookingPot },
  { value: '식기세척기', icon: UtensilsCrossed },
  { value: '냉장고', icon: Refrigerator },
  { value: '전자레인지', icon: Microwave },
  { value: '정수기', icon: Droplets },
  { value: '커피 머신', icon: CupSoda },
  { value: '에어컨', icon: Snowflake },
  { value: '난방', icon: Flame },
  { value: '공기청정기', icon: Wind },
  { value: '환기 시스템', icon: AirVent },
  { value: 'TV', icon: Tv },
  { value: '음향 시스템', icon: Speaker },
  { value: '세탁기', icon: WashingMachine },
  { value: '건조기', icon: Fan },
  { value: '다리미', icon: Shirt },
  { value: '욕조', icon: Bath },
  { value: '세면용품', icon: Droplet },
  { value: '침구', icon: BedDouble },
  { value: '거실/소파', icon: Sofa },
  { value: '업무 공간', icon: Briefcase },
  { value: '도서', icon: BookOpen },
  { value: '게임기', icon: Gamepad2 },
  { value: '자전거', icon: Bike },
  { value: '유아용품', icon: Baby },
  { value: '수영장', icon: Waves },
  { value: '헬스장', icon: Dumbbell },
  { value: '사우나', icon: Thermometer },
  { value: '조식', icon: Coffee },
  { value: '보안/CCTV', icon: Cctv },
  { value: '도어락/셀프 체크인', icon: KeyRound },
  { value: '소화기', icon: FireExtinguisher },
  { value: '전망', icon: Mountain },
  { value: '정원/마당', icon: Trees },
  { value: '테라스', icon: Sun },
];

// 정식 목록의 value → 아이콘 (정확 일치용)
const EXACT_ICON_MAP = new Map(AMENITY_OPTIONS.map((option) => [option.value, option.icon]));

// 정식 목록에 없는 레거시 자유 입력 데이터를 위한 키워드 폴백.
// 위에서부터 먼저 매칭되는 규칙을 사용하므로 구체적인 키워드를 앞에 둔다.
const KEYWORD_RULES: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['와이파이', 'wifi', '인터넷', '와파'], icon: Wifi },
  { keywords: ['전기차', '충전', 'ev'], icon: BatteryCharging },
  { keywords: ['주차', '파킹', 'parking'], icon: Car },
  { keywords: ['냉장고'], icon: Refrigerator },
  { keywords: ['전자레인지', '전자렌지', '렌지'], icon: Microwave },
  { keywords: ['식기세척기', '식세기'], icon: UtensilsCrossed },
  { keywords: ['조리도구', '냄비', '프라이팬', '주방용품'], icon: CookingPot },
  { keywords: ['주방', '취사', '조리', '인덕션', '가스', '식기'], icon: Utensils },
  { keywords: ['정수기', '생수', '식수'], icon: Droplets },
  { keywords: ['에어컨', '냉방'], icon: Snowflake },
  { keywords: ['난방', '보일러', '온돌'], icon: Flame },
  { keywords: ['환기', '공기청정', '선풍기'], icon: Wind },
  { keywords: ['건조기'], icon: Fan },
  { keywords: ['다리미', '다림질'], icon: Shirt },
  { keywords: ['음향', '스피커', '사운드', '오디오'], icon: Speaker },
  { keywords: ['tv', '티비', '텔레비전', '넷플릭스'], icon: Tv },
  { keywords: ['세탁', '빨래'], icon: WashingMachine },
  { keywords: ['세면', '비누', '샴푸', '어메니티'], icon: Droplet },
  { keywords: ['욕조', '욕실', '샤워', '온수'], icon: Bath },
  { keywords: ['소파', '거실', '라운지'], icon: Sofa },
  { keywords: ['업무', '책상', '데스크', '워크'], icon: Briefcase },
  { keywords: ['도서', '책', '서적'], icon: BookOpen },
  { keywords: ['게임', '콘솔', '플스', '닌텐도'], icon: Gamepad2 },
  { keywords: ['자전거', '바이크', '따릉이'], icon: Bike },
  { keywords: ['유아', '아기', '아이', '베이비'], icon: Baby },
  { keywords: ['침구', '침대', '이불', '베개'], icon: BedDouble },
  { keywords: ['수영장', '오션', '바다', '계곡'], icon: Waves },
  { keywords: ['사우나', '찜질', '한증막'], icon: Thermometer },
  { keywords: ['헬스', '운동', '피트니스', '짐'], icon: Dumbbell },
  { keywords: ['커피', '조식', '아침', '카페'], icon: Coffee },
  { keywords: ['반려', '애견', '강아지', '펫'], icon: PawPrint },
  { keywords: ['소화기', '화재', '안전'], icon: FireExtinguisher },
  { keywords: ['도어락', '셀프 체크인', '키패드', '스마트키'], icon: KeyRound },
  { keywords: ['보안', 'cctv', '금고'], icon: ShieldCheck },
  { keywords: ['전망', '뷰', '마운틴', '산'], icon: Mountain },
  { keywords: ['정원', '마당', '바베큐', '바비큐', '캠프'], icon: TreePine },
  { keywords: ['테라스', '발코니', '루프탑', '일광'], icon: Sun },
];

// 편의시설 문자열에 대응하는 아이콘을 찾는다.
// 정식 목록과 정확히 일치하면 그 아이콘을, 아니면 키워드로 추정, 그래도 없으면 기본 체크.
export function getAmenityIcon(amenity: string): LucideIcon {
  const exact = EXACT_ICON_MAP.get(amenity);
  if (exact) return exact;

  const lower = amenity.toLowerCase();
  const matched = KEYWORD_RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
  );
  return matched?.icon ?? Check;
}
