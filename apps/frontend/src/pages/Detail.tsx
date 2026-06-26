import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Icon } from '../shared/Icon';
import { CalendarModal } from '../components/panels/CalendarModal';
import { GuestPanel } from '../components/panels/GuestPanel';
import { toReservationRequest } from '../shared/api/reservationMapping';
import { SaveToWishlistModal } from '../components/SaveToWishlistModal';
import { removeWishlistItem, fetchListingWishlistId } from '../shared/api/wishlist';
import { getHostListingDetailOptions } from '../shared/api/generated/@tanstack/react-query.gen';
import { AMENITY_ENUM_TO_KR } from '../shared/amenities';
import { won } from '../shared/utils';
import { LISTINGS } from '../shared/demoListings';
import { useAppState } from '../shared/AppState';
import { useToast } from '../shared/Toast';
import { DetailGallery } from './detail/DetailGallery';
import { DetailOverview } from './detail/DetailOverview';
import { DetailRatings } from './detail/DetailRatings';
import { DetailReviews, EmptyReviews } from './detail/DetailReviews';
import { DetailAmenities } from './detail/DetailAmenities';
import { DetailCalendar } from './detail/DetailCalendar';
import { DetailDescription } from './detail/DetailDescription';
import { DetailLocation } from './detail/DetailLocation';
import { DetailHost } from './detail/DetailHost';
import { DetailThingsToKnow } from './detail/DetailThingsToKnow';

type Panel = 'date' | 'guest' | null;

export function Detail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search, setSearch, selectedListing, setSelectedListing, isLoggedIn, openLogin } = useAppState();
  const toast = useToast();
  const listing = LISTINGS.find((item) => String(item.id) === id) ?? selectedListing;
  const onChange = setSearch;
  const onBack = () => navigate('/results');
  const onReserve = () => navigate(`/listings/${listing.id}/checkout`);

  useEffect(() => {
    setSelectedListing(listing);
  }, [listing, setSelectedListing]);

  // 실제 상세 API (GET /api/listings/{listingsId}). 로딩/실패 시 데모로 폴백
  const listingId = id != null ? Number(id) : NaN;
  const detailQuery = useQuery({
    ...getHostListingDetailOptions({
      path: { listingsId: listingId },
    }),
    enabled: Number.isFinite(listingId),
  });
  const d = detailQuery.data?.data;

  // 표시용 뷰모델: 상세 API 데이터만 사용
  const cap = d?.capacity;
  const v = {
    id: d?.listingId ?? listingId,
    title: d?.name ?? '',
    loc: d?.location ?? '',
    price: d?.pricePerNight ?? 0,
    rating: d?.review?.averageRating ?? 0,
    reviews: d?.review?.reviewCount ?? 0,
    images: d?.images ?? [],
    hostName: d?.host?.name ?? '',
    hostProfileUrl: d?.host?.profileUrl ?? null,
    lat: d?.latitude,
    lng: d?.longitude,
    capacityLine: cap
      ? [
          cap.maxGuests != null ? `최대 인원 ${cap.maxGuests}명` : null,
          cap.bedrooms != null ? `침실 ${cap.bedrooms}개` : null,
          cap.beds != null ? `침대 ${cap.beds}개` : null,
          cap.bathrooms != null ? `욕실 ${cap.bathrooms}개` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '',
    amenities: d?.amenities?.map((a) => AMENITY_ENUM_TO_KR[a] ?? a) ?? [],
    description: d?.description ?? '',
  };

  const nights = 1;
  const fee = Math.round(v.price * 0.099);
  const tax = Math.round(v.price * 0.014);
  const total = v.price * nights + fee + tax;

  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 상단 저장 버튼 ↔ 위시리스트
  const [saved, setSaved] = useState(false);
  const [savedWishlistId, setSavedWishlistId] = useState<number | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  // 상세 응답의 wishlistId로 초기 저장 상태 + 삭제 대상 반영(null이면 미저장)
  useEffect(() => {
    setSaved(d?.wishlistId != null);
    setSavedWishlistId(d?.wishlistId ?? null);
  }, [d?.wishlistId, d?.listingId]);

  // "저장" 의도 실행(로그인 직후 재생용): 이미 담긴 숙소면 하트만 채우고 안내, 아니면 저장 모달을 연다.
  // 토글이 아니라 저장 전용이므로, 이미 저장된 경우에도 삭제하지 않는다.
  const runSaveIntent = () => {
    fetchListingWishlistId(v.id)
      .then((wid) => {
        if (wid != null) {
          setSaved(true);
          setSavedWishlistId(wid);
          toast.show('이미 위시리스트에 저장한 숙소예요');
        } else {
          setSaveOpen(true);
        }
      })
      .catch(() => setSaveOpen(true));
  };

  const onToggleSave = () => {
    // 비로그인 시 저장 모달 대신 로그인 모달로 유도. 로그인 성공(폼/구글) 후 저장 의도를 이어서 실행.
    if (!isLoggedIn) {
      openLogin('위시리스트에 저장하려면 로그인이 필요해요.', runSaveIntent, {
        type: 'saveHeart',
        listingId: v.id,
        from: window.location.pathname,
      });
      return;
    }
    if (!saved) {
      setSaveOpen(true);
      return;
    }
    // 저장돼 있으면 삭제
    if (savedWishlistId != null) {
      removeWishlistItem(savedWishlistId, v.id)
        .then(() => {
          setSaved(false);
          setSavedWishlistId(null);
        })
        .catch(() => {});
    } else {
      setSaved(false);
    }
  };

  // 날짜·인원 검증 후 예약(결제) 단계로 이동. 검증 실패 시 에러 표시.
  const proceedReserve = () => {
    try {
      // 예약 생성은 결제 단계에서 처리
      toReservationRequest(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : '예약 정보를 확인해주세요.');
      return;
    }
    onReserve();
  };

  function handleReserve() {
    setError(null);
    // 비로그인 시 결제 단계로 넘기지 않고 로그인 모달로 유도.
    // 로그인 성공 시 입력해 둔 날짜/인원(전역 search) 그대로 예약 단계로 이어진다.
    if (!isLoggedIn) {
      openLogin('예약하려면 로그인이 필요해요.', proceedReserve, {
        type: 'reserve',
        listingId: v.id,
        search,
      });
      return;
    }
    proceedReserve();
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const checkin = search.dates ? search.dates.split(' – ')[0] : '날짜 입력';
  const checkout = search.dates ? search.dates.split(' – ')[1] : '날짜 입력';

  // 상세 데이터 로딩/실패 가드
  if (!d) {
    return (
      <div>
        <Header mode="compact" search={search} onSearchPill={onBack} />
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--ink-3)' }}>
          {detailQuery.isLoading ? '불러오는 중…' : '숙소 정보를 불러올 수 없어요.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header mode="compact" search={search} onSearchPill={onBack} />
      <div style={{ padding: '28px 80px 80px', maxWidth: 1320, margin: '0 auto' }}>
        {/* Back link */}
        <div
          className="back"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            marginBottom: 16,
            fontSize: 14,
            color: 'var(--ink-2)',
            transition: 'color 120ms ease',
          }}
        >
          <Icon name="chevron-left" size={18} />
          검색 결과로
        </div>

        {/* Section 1: 갤러리 */}
        <DetailGallery
          title={v.title}
          images={v.images}
          saved={saved}
          onToggleSave={onToggleSave}
        />

        <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
          {/* Left: listing info */}
          <div style={{ flex: 1 }}>
            {/* Section 2: 개요 */}
            <DetailOverview
              roomTypeLabel="집 전체"
              location={v.loc}
              capacityLine={v.capacityLine}
              rating={v.rating}
              reviews={v.reviews}
              hostName={v.hostName}
              profileUrl={v.hostProfileUrl}
              onHostClick={() =>
                document.getElementById('detail-host')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            />
            <DetailDescription description={v.description} />
            <DetailAmenities provided={v.amenities} />
            <DetailCalendar value={search} onChange={onChange} location={v.loc} />
          </div>

          {/* Right: reservation cost card */}
          <div ref={cardRef} style={{ flex: '0 0 360px', position: 'sticky', top: 100, zIndex: 30 }}>
            <div
              style={{
                position: 'relative',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-lg)',
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>
                  <b style={{ fontSize: 22 }}>{won(v.price)}</b>{' '}
                  <span style={{ color: 'var(--ink-3)' }}>/ 박</span>
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 700 }}>
                  후기 {v.reviews}개
                </span>
              </div>

              {/* Date + guest field group */}
              <div
                style={{
                  position: 'relative',
                  margin: '16px 0',
                }}
              >
                <div
                  style={{
                    border: '1px solid var(--line-strong)',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex' }}>
                    <FieldCell
                      label="체크인"
                      val={checkin}
                      active={panel === 'date'}
                      onClick={() => setPanel(panel === 'date' ? null : 'date')}
                      borderRight
                    />
                    <FieldCell
                      label="체크아웃"
                      val={checkout}
                      active={panel === 'date'}
                      onClick={() => setPanel(panel === 'date' ? null : 'date')}
                    />
                  </div>
                  <div style={{ borderTop: '1px solid var(--line-strong)' }}>
                    <FieldCell
                      label="인원"
                      val={search.guestLabel || '게스트 1명'}
                      active={panel === 'guest'}
                      onClick={() => setPanel(panel === 'guest' ? null : 'guest')}
                    />
                  </div>
                </div>

                {panel === 'date' && (
                  <DetailPopover width={720} right>
                    <CalendarModal value={search} onChange={onChange} />
                  </DetailPopover>
                )}
                {panel === 'guest' && (
                  <DetailPopover width={360} right>
                    <GuestPanel value={search} onChange={onChange} />
                  </DetailPopover>
                )}
              </div>

              <button
                onClick={handleReserve}
                className="reserve-btn"
                style={{
                  width: '100%',
                  height: 50,
                  border: 'none',
                  borderRadius: 10,
                  background: 'var(--cta-dark)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
              >
                예약하기
              </button>

              {error && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--brand-coral)', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--ink-3)',
                  margin: '16px 0 20px',
                }}
              >
                예약 확정 전에는 요금이 청구되지 않습니다.
              </div>

              <PriceRow label={`${won(v.price)} x ${nights}박`} value={won(v.price * nights)} />
              <PriceRow label="서비스 수수료" value={won(fee)} />
              <PriceRow label="숙박세와 수수료" value={won(tax)} />

              <div
                style={{
                  borderTop: '1px solid var(--line)',
                  marginTop: 14,
                  paddingTop: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <span>총 합계</span>
                <span>{won(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3+4: 평점/후기. 후기 0개면 빈 상태 하나로 묶어 표시 */}
        {v.reviews === 0 ? (
          <EmptyReviews hostName={v.hostName} />
        ) : (
          <>
            <DetailRatings rating={v.rating} reviews={v.reviews} listingId={v.id} />
            <DetailReviews reviews={v.reviews} listingId={v.id} />
          </>
        )}

        {/* Section 7: 위치 */}
        <DetailLocation location={v.loc} lat={v.lat} lng={v.lng} />

        {/* Section 8: 호스트 소개 */}
        <DetailHost hostName={v.hostName} rating={v.rating} reviews={v.reviews} profileUrl={v.hostProfileUrl} />

        {/* 알아두어야 할 사항 */}
        <DetailThingsToKnow checkIn={search.range?.a ?? null} />
      </div>

      <SaveToWishlistModal
        open={saveOpen}
        listingId={saveOpen ? v.id : null}
        onClose={() => setSaveOpen(false)}
        onSaved={(_name, wishlistId) => {
          setSaved(true);
          setSavedWishlistId(wishlistId);
          setSaveOpen(false);
        }}
      />
    </div>
  );
}

function FieldCell({
  label,
  val,
  active,
  onClick,
  borderRight,
}: {
  label: string;
  val: string;
  active?: boolean;
  onClick?: () => void;
  borderRight?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        padding: '11px 14px',
        cursor: onClick ? 'pointer' : 'default',
        background: active ? 'var(--surface-alt-2)' : 'transparent',
        borderRight: borderRight ? '1px solid var(--line-strong)' : 'none',
        transition: 'background 120ms ease',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{val}</div>
    </div>
  );
}

function DetailPopover({
  children,
  width,
  right,
}: {
  children: React.ReactNode;
  width: number;
  right?: boolean;
}) {
  return (
    <div
      className="popover-enter"
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        left: right ? 'auto' : 0,
        right: right ? 0 : 'auto',
        width,
        background: '#fff',
        borderRadius: 24,
        boxShadow: 'var(--shadow-pop)',
        padding: 28,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 15,
        color: 'var(--ink-1)',
        padding: '6px 0',
      }}
    >
      <span
        style={{
          textDecoration: 'underline',
          textDecorationColor: 'var(--ink-4)',
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}
