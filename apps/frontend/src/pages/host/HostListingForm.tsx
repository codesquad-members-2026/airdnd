import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import logoSvg from '../../assets/logo.svg';
import { createListingMutation } from '../../shared/api/generated/@tanstack/react-query.gen';
import { toCreateRequest, HOST_STUB, TEMP_LISTING_COORDINATES } from '../../shared/api/hostMapping';
import { useHostListings } from '../../shared/useHostListings';
import type { HostListing, ListingFormData } from '../../types';
import { DaumPostcodeModal } from './listing-form/components/DaumPostcodeModal';
import { DEFAULT_FORM } from './listing-form/constants';
import type { ListingFormErrors } from './listing-form/types';
import { AddressStep } from './listing-form/steps/AddressStep';
import { AmenitiesStep } from './listing-form/steps/AmenitiesStep';
import { BasicInfoStep } from './listing-form/steps/BasicInfoStep';
import { CapacityStep } from './listing-form/steps/CapacityStep';
import { DescriptionStep } from './listing-form/steps/DescriptionStep';
import { ImagesStep } from './listing-form/steps/ImagesStep';
import { PricingStep } from './listing-form/steps/PricingStep';
import { SplashScreen } from './listing-form/screens/SplashScreen';
import { StepIntroScreen } from './listing-form/screens/StepIntroScreen';
import { PlaceTypeScreen } from './listing-form/screens/PlaceTypeScreen';
import { MapConfirmScreen } from './listing-form/screens/MapConfirmScreen';

type ScreenKind =
  | 'splash'
  | 'intro'
  | 'place-type'
  | 'address'
  | 'map'
  | 'basics'
  | 'title'
  | 'amenities'
  | 'images'
  | 'description'
  | 'price';

interface Screen {
  kind: ScreenKind;
  phase?: 1 | 2 | 3;
}

const SCREENS: Screen[] = [
  { kind: 'splash' },
  { kind: 'intro', phase: 1 },
  { kind: 'place-type', phase: 1 },
  { kind: 'address', phase: 1 },
  { kind: 'map', phase: 1 },
  { kind: 'basics', phase: 1 },
  { kind: 'intro', phase: 2 },
  { kind: 'title', phase: 2 },
  { kind: 'amenities', phase: 2 },
  { kind: 'images', phase: 2 },
  { kind: 'description', phase: 2 },
  { kind: 'intro', phase: 3 },
  { kind: 'price', phase: 3 },
];

function toInitialForm(listing?: HostListing | null): ListingFormData {
  if (!listing) return DEFAULT_FORM;
  return {
    title: listing.title,
    city: '',
    district: '',
    streetAddress: '',
    detailAddress: '',
    zipCode: '',
    latitude: TEMP_LISTING_COORDINATES.latitude,
    longitude: TEMP_LISTING_COORDINATES.longitude,
    roomType: listing.roomType,
    description: listing.description,
    price: listing.price,
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    amenities: listing.amenities,
    imageUrls: listing.imageUrls.length > 0 ? listing.imageUrls : [''],
  };
}

export function HostListingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { listings } = useHostListings();
  const listing = id ? listings.find((l) => l.id === id) ?? null : null;
  const onExit = () => navigate('/host');

  const isEdit = !!id;
  const [form, setForm] = useState<ListingFormData>(() => toInitialForm(listing));

  useEffect(() => {
    if (listing) setForm(toInitialForm(listing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const createMutation = useMutation(createListingMutation());

  const screen = SCREENS[step];
  const isFirst = step === 0;
  const isLast = step === SCREENS.length - 1;
  const phaseFills = computePhaseFills(step);

  function handlePostcodeComplete(data: { zonecode: string; roadAddress: string; sido: string; sigungu: string }) {
    setForm(f => ({ ...f, zipCode: data.zonecode, streetAddress: data.roadAddress, city: data.sido, district: data.sigungu }));
    setErrors(e => ({ ...e, zipCode: undefined, streetAddress: undefined, city: undefined, district: undefined }));
  }

  function setField<K extends keyof ListingFormData>(key: K, val: ListingFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function toggleAmenity(a: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  }

  // 채워진 이미지 URL 목록만 다룸
  const images = form.imageUrls.filter(u => u.trim());
  function setImages(next: string[]) {
    setForm(f => ({ ...f, imageUrls: next }));
  }

  function validateScreen(): boolean {
    const next: ListingFormErrors = {};
    if (screen.kind === 'title' && !form.title.trim()) {
      next.title = '숙소 이름을 입력해주세요.';
    }
    if (screen.kind === 'address' && !isEdit) {
      if (!form.streetAddress.trim()) next.streetAddress = '주소 검색 버튼을 눌러 주소를 선택해주세요.';
      if (!form.detailAddress.trim()) next.detailAddress = '상세 주소를 입력해주세요.';
    }
    if (screen.kind === 'price' && (!form.price || form.price <= 0)) {
      next.price = '올바른 가격을 입력해주세요.';
    }
    if (screen.kind === 'images' && images.length < 5) {
      next.imageUrls = '사진을 5장 이상 추가해주세요.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateScreen()) return;
    if (isLast) {
      handleSubmit();
      return;
    }
    setStep(s => Math.min(SCREENS.length - 1, s + 1));
  }

  function goPrev() {
    if (isFirst) onExit();
    else setStep(s => Math.max(0, s - 1));
  }

  function handleSubmit() {
    if (isEdit) {
      onExit();
      return;
    }
    createMutation.mutate(
      { body: toCreateRequest({ ...form, imageUrls: form.imageUrls.filter(u => u.trim()) }), query: { host: HOST_STUB } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [{ _id: 'getHostListings' }] });
          onExit();
        },
      },
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <WizardHeader onLogo={onExit} onExit={onExit} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%' }}>
          {screen.kind === 'splash' && <SplashScreen />}
          {screen.kind === 'intro' && <StepIntroScreen phase={screen.phase!} />}
          {screen.kind === 'place-type' && (
            <PlaceTypeScreen value={form.roomType} onChange={v => setField('roomType', v)} />
          )}
          {screen.kind === 'address' && (
            <StepBody>
              <AddressStep
                form={form}
                errors={errors}
                isEdit={isEdit}
                onSearchAddress={() => setIsPostcodeOpen(true)}
                onDetailAddressChange={v => setField('detailAddress', v)}
              />
            </StepBody>
          )}
          {screen.kind === 'map' && (
            <MapConfirmScreen
              address={form.streetAddress}
              onCoordinatesChange={(lat, lng) => {
                setField('latitude', lat);
                setField('longitude', lng);
              }}
            />
          )}
          {screen.kind === 'basics' && (
            <StepBody>
              <CapacityStep form={form} setField={setField} />
            </StepBody>
          )}
          {screen.kind === 'title' && (
            <StepBody>
              <BasicInfoStep form={form} errors={errors} titleInputRef={titleInputRef} setField={setField} />
            </StepBody>
          )}
          {screen.kind === 'amenities' && (
            <StepBody>
              <AmenitiesStep form={form} onToggleAmenity={toggleAmenity} />
            </StepBody>
          )}
          {screen.kind === 'images' && (
            <StepBody>
              <ImagesStep images={images} onChange={setImages} error={errors.imageUrls} />
            </StepBody>
          )}
          {screen.kind === 'description' && (
            <StepBody>
              <DescriptionStep form={form} errors={errors} descriptionInputRef={descriptionInputRef} setField={setField} />
            </StepBody>
          )}
          {screen.kind === 'price' && (
            <StepBody>
              <PricingStep form={form} errors={errors} priceInputRef={priceInputRef} setField={setField} />
            </StepBody>
          )}
        </div>
      </main>

      {isPostcodeOpen && (
        <DaumPostcodeModal onComplete={handlePostcodeComplete} onClose={() => setIsPostcodeOpen(false)} />
      )}

      <WizardFooter
        screen={screen}
        fills={phaseFills}
        isFirst={isFirst}
        isLast={isLast}
        isEdit={isEdit}
        submitting={createMutation.isPending}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

// 단계(phase)별 채움 비율: 지난 단계 100%, 현재 단계는 통과한 화면 비율(인트로 포함), 이후 0%
// 연속·단조 증가 → 직전 페이지가 항상 진행도에 반영됨
function computePhaseFills(step: number): number[] {
  const current = SCREENS[step];
  return [1, 2, 3].map(p => {
    if (current.phase == null || current.phase < p) return 0;
    if (current.phase > p) return 1;
    const inPhase = SCREENS.map((s, i) => ({ s, i })).filter(x => x.s.phase === p);
    // 현재 화면은 아직 통과 전 → 제외(이 페이지를 넘겨야 채워짐)
    const passed = inPhase.filter(x => x.i < step).length;
    return passed / inPhase.length;
  });
}

function StepBody({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>{children}</div>;
}

function WizardHeader({ onLogo, onExit }: { onLogo: () => void; onExit: () => void }) {
  return (
    <header
      style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <img src={logoSvg} alt="airdnd" onClick={onLogo} style={{ height: 36, cursor: 'pointer' }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <PillButton onClick={onExit}>저장 후 나가기</PillButton>
      </div>
    </header>
  );
}

function PillButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        padding: '0 16px',
        borderRadius: 999,
        border: '1px solid var(--line-strong)',
        background: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function WizardFooter({
  screen,
  fills,
  isFirst,
  isLast,
  isEdit,
  submitting,
  onPrev,
  onNext,
}: {
  screen: Screen;
  fills: number[];
  isFirst: boolean;
  isLast: boolean;
  isEdit: boolean;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isSplash = screen.kind === 'splash';
  const nextLabel = isSplash ? '시작하기' : isLast ? (isEdit ? '수정 완료' : '숙소 등록') : '다음';

  return (
    <footer style={{ position: 'sticky', bottom: 0, background: '#fff', zIndex: 30 }}>
      {!isSplash && <ProgressBar fills={fills} />}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 40px',
          borderTop: isSplash ? '1px solid var(--line)' : 'none',
        }}
      >
        {!isFirst ? (
          <button
            onClick={onPrev}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            뒤로
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onNext}
          disabled={submitting}
          style={{
            border: 'none',
            borderRadius: 10,
            background: submitting ? 'var(--ink-4)' : 'var(--ink-1)',
            color: '#fff',
            padding: '13px 28px',
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? '등록 중…' : nextLabel}
        </button>
      </div>
    </footer>
  );
}

function ProgressBar({ fills }: { fills: number[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 40px' }}>
      {fills.map((f, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--line)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.round(f * 100)}%`,
              height: '100%',
              borderRadius: 2,
              background: 'var(--ink-1)',
              transition: 'width 220ms ease',
            }}
          />
        </div>
      ))}
    </div>
  );
}
