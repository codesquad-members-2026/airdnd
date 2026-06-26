import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Icon } from '../shared/Icon';
import { won } from '../shared/utils';
import { SaveToWishlistModal } from '../components/SaveToWishlistModal';
import { useAppState } from '../shared/AppState';
import type { Listing } from '../types';

// TODO(API): 데모 LISTINGS엔 실제 listingId가 없어 임시로 매핑한다(인덱스 → listing id).
// 백엔드 DB에 존재하는 listing id로 맞춰야 POST가 성공함. 없는 id면 404(LISTING_NOT_FOUND).
const DEMO_LISTING_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

import listing1 from '../assets/listing-1.png';
import listing2 from '../assets/listing-2.png';
import listing3 from '../assets/listing-3.png';
import listing4 from '../assets/listing-4.png';

const ASSET_MAP: Record<string, string> = {
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

export function Results() {
  const navigate = useNavigate();
  const { search, setSelectedListing } = useAppState();
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  // 하트 클릭 시 저장 모달을 띄울 대상 리스팅 인덱스 (null이면 닫힘)
  const [saveFor, setSaveFor] = useState<number | null>(null);
  // 저장 성공 토스트 메시지
  const [toast, setToast] = useState<string | null>(null);

  const onOpen = (l: Listing) => {
    setSelectedListing(l);
    navigate(`/listings/${l.id}`);
  };
  const onSearchPill = () => navigate('/');

  return (
    <div>
      <Header mode="compact" search={search} onSearchPill={onSearchPill} />
      <div style={{ display: 'flex' }}>
        {/* Listing list */}
        <div
          style={{
            flex: '0 0 58%',
            padding: '28px 48px 60px',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>
            300개 이상의 숙소 · {search.dates || '5월 17일 – 6월 4일'} ·{' '}
            {search.priceLabel || '₩100,000~₩1,000,000'} ·{' '}
            {search.guestLabel || '게스트 3명'}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              marginBottom: 22,
            }}
          >
            지도에서 선택한 지역의 숙소
          </h1>

          {LISTINGS.map((l, i) => (
            <div
              key={i}
              onClick={() => onOpen(l)}
              className="result-row"
              style={{
                display: 'flex',
                gap: 22,
                padding: '24px 0',
                borderTop: i ? '1px solid var(--line)' : 'none',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
            >
              <div
                style={{
                  width: 240,
                  height: 160,
                  borderRadius: 10,
                  background: `url(${ASSET_MAP[l.img]}) center/cover`,
                  flex: 'none',
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{l.loc}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSaveFor(i);
                    }}
                    style={{ cursor: 'pointer', padding: 4 }}
                  >
                    <Icon
                      name="heart"
                      size={22}
                      color={liked[i] ? 'var(--brand-coral)' : 'var(--ink-1)'}
                      fill={liked[i] ? 'var(--brand-coral)' : 'none'}
                    />
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, margin: '6px 0 10px' }}>{l.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>
                  {l.specs}
                  <br />
                  {l.amen}
                </div>
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingTop: 12,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14 }}>
                    <Icon name="star" size={15} color="var(--star)" fill="var(--star)" />
                    <b>{l.rating}</b>{' '}
                    <span style={{ color: 'var(--ink-3)' }}>(후기 {l.reviews}개)</span>
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div>
                      <b style={{ fontSize: 17 }}>{won(l.price)}</b>{' '}
                      <span style={{ color: 'var(--ink-3)' }}>/ 박</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>총액 {won(l.total)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div
          style={{
            flex: 1,
            position: 'sticky',
            top: 80,
            height: 'calc(100vh - 80px)',
            background: '#E8EDF0',
            overflow: 'hidden',
          }}
        >
          <MapBg />
          {/* "Search while moving map" toggle */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              borderRadius: 30,
              boxShadow: 'var(--shadow-md)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            <Icon name="check" size={16} color="var(--ink-1)" />
            지도를 움직이며 검색하기
          </div>

          {/* Price pins */}
          {LISTINGS.map((l, i) => (
            <div
              key={i}
              onClick={() => onOpen(l)}
              className="pin"
              style={{
                position: 'absolute',
                left: l.x + '%',
                top: l.y + '%',
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                borderRadius: 30,
                boxShadow: 'var(--shadow-md)',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {won(l.price)}
            </div>
          ))}

          {/* Zoom controls */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              right: 20,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff',
              borderRadius: 10,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              className="zoom"
              style={{
                padding: 10,
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
            >
              <Icon name="plus" size={18} />
            </div>
            <div className="zoom" style={{ padding: 10, cursor: 'pointer', transition: 'background 120ms ease' }}>
              <Icon name="minus" size={18} />
            </div>
          </div>
        </div>
      </div>

      <SaveToWishlistModal
        open={saveFor !== null}
        listingId={saveFor !== null ? DEMO_LISTING_IDS[saveFor] ?? null : null}
        onClose={() => setSaveFor(null)}
        onSaved={(wishlistName) => {
          if (saveFor !== null) setLiked((prev) => ({ ...prev, [saveFor]: true }));
          setSaveFor(null);
          setToast(`'${wishlistName}'에 저장했어요`);
          window.setTimeout(() => setToast(null), 2200);
        }}
      />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--cta-dark)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: 'var(--shadow-pop)',
            zIndex: 300,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function MapBg() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0 }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="100%" height="100%" fill="#EAEFF1" />
      <g stroke="#D6DEE2" strokeWidth="14" fill="none">
        <path d="M-50 200 L900 360" />
        <path d="M200 -50 L420 900" />
        <path d="M-50 560 L900 640" />
        <path d="M650 -50 L760 900" />
      </g>
      <g fill="#E1E7E9">
        <rect x="60" y="80" width="120" height="90" rx="6" />
        <rect x="300" y="220" width="140" height="100" rx="6" />
        <rect x="520" y="120" width="120" height="120" rx="6" />
        <rect x="120" y="420" width="160" height="110" rx="6" />
        <rect x="560" y="480" width="150" height="120" rx="6" />
      </g>
      <g fill="#CDE3D0">
        <circle cx="420" cy="520" r="60" />
        <circle cx="700" cy="300" r="42" />
      </g>
    </svg>
  );
}
