export interface GuestCounts {
  adult: number;
  child: number;
  infant: number;
  pet: number;
}

export interface DateRange {
  a: string | null;
  b: string | null;
}

export interface RegionSelection {
  sidoCode: string;
  sigunguCode: string | null;
}

export interface SearchState {
  destination: string;
  region: RegionSelection | null;
  dates: string;
  range: DateRange | null;
  priceMin: number | null;
  priceMax: number | null;
  guests: GuestCounts;
  guestLabel: string;
}

export interface Listing {
  id: number;
  img: string;
  loc: string;
  title: string;
  specs: string;
  amen: string;
  rating: number;
  reviews: number;
  price: number;
  total: number;
  x: number;
  y: number;
}

export type RoomType = '집 전체' | '개인실' | '다인실';

export type ListingState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';

export interface HostListing {
  id: string;
  title: string;
  loc: string;
  roomType: RoomType;
  description: string;
  price: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  imageUrls: string[];
  active: boolean;
  state?: ListingState;
}

/** 숙소 등록/수정 폼에서 사용하는 데이터 타입 (백엔드 ListingCreateRequest와 대응) */
export interface ListingFormData {
  title: string;
  city: string;
  district: string;
  streetAddress: string;
  detailAddress: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  roomType: RoomType;
  description: string;
  price: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  imageUrls: string[];
}

export type View = 'home' | 'results' | 'detail' | 'checkout' | 'stay-pending' | 'trips' | 'host-dashboard' | 'host-new' | 'host-edit' | 'admin' | 'mypage' | 'wishlist-detail' | 'wishlists';

export interface WishlistSummary {
  id: number;
  name: string;
  itemCount: number;
  imgUrl: string | null;
}

export interface WishlistDetailItem {
  listingId: number;
  listingName: string;
  pricePerNight: number;
  note: string | null;
  imageUrls: string[];
}

export interface WishlistDetail {
  id: number;
  name: string;
  items: WishlistDetailItem[];
}
