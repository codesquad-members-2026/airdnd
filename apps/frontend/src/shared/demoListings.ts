import type { Listing } from '../types';
import listing1 from '../assets/listing-1.png';
import listing2 from '../assets/listing-2.png';
import listing3 from '../assets/listing-3.png';
import listing4 from '../assets/listing-4.png';

export const ASSET_MAP: Record<string, string> = {
  'listing-1': listing1,
  'listing-2': listing2,
  'listing-3': listing3,
  'listing-4': listing4,
};

export const LISTINGS: Listing[] = [
  {
    id: 1,
    img: 'listing-1',
    loc: '서초구의 아파트 전체',
    title: 'Spacious and Comfortable cozy house #4',
    specs: '최대 인원 3명 · 원룸 · 침대 1개 · 욕실 1개',
    amen: '주방 · 무선 인터넷 · 에어컨 · 헤어드라이어',
    rating: 4.8,
    reviews: 127,
    price: 82953,
    total: 1493159,
    x: 30,
    y: 26,
  },
  {
    id: 2,
    img: 'listing-2',
    loc: 'Yeoksam-dong, Gangnam-gu의 아파트 전체',
    title: '#자가격리 #공부 #강남 #선릉역3분',
    specs: '최대 인원 4명 · 침실 1개 · 침대 1개 · 욕실 1개',
    amen: '주방 · 무선 인터넷 · 에어컨 · 헤어드라이어',
    rating: 4.92,
    reviews: 88,
    price: 96095,
    total: 1729707,
    x: 54,
    y: 44,
  },
  {
    id: 3,
    img: 'listing-3',
    loc: 'Yeoksam-dong, Gangnam-gu의 아파트 전체',
    title: '#자가격리 #역삼역1분 #파티 #삼성',
    specs: '최대 인원 3명 · 원룸 · 침대 1개 · 단독 욕실 1개',
    amen: '주방 · 무선 인터넷 · 에어컨 · 헤어드라이어',
    rating: 4.75,
    reviews: 64,
    price: 105260,
    total: 1894680,
    x: 22,
    y: 58,
  },
  {
    id: 4,
    img: 'listing-4',
    loc: 'Yangjae-dong, Seocho-gu의 아파트 전체',
    title: '[장기 임대 할인] 강남 양재천 실평수 30평',
    specs: '최대 인원 6명 · 침실 2개 · 침대 3개 · 욕실 1개',
    amen: '주방 · 무선 인터넷 · 에어컨 · 세탁기',
    rating: 4.88,
    reviews: 203,
    price: 115126,
    total: 2072268,
    x: 70,
    y: 66,
  },
];
