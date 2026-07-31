import {
  AdvancedMarker,
  APILoadingStatus,
  Map,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_KOREA_CENTER,
  DETAIL_MAP_ZOOM,
  isMapsConfigured,
  mapsConfig,
  ROOM_DETAIL_PIN_ANCHOR,
} from '../config/mapsConfig';
import { SelectedLocation, toLatLng } from '../model/locationTypes';
import { getSelectedLocation } from '../model/placeLocation';
import { RoomDetailPin } from './RoomDetailPin';

interface LocationPickerProps {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  disabled?: boolean;
  includedRegionCodes?: string[];
}

type PlaceAutocompleteElementInstance = HTMLElement & {
  disabled: boolean;
  value: string;
};

type PlacePredictionSelectEvent = Event & {
  placePrediction: {
    toPlace(): {
      formattedAddress?: string | null;
      location?: {
        lat(): number;
        lng(): number;
      } | null;
      addressComponents?: Array<{
        shortText: string | null;
        longText?: string | null;
        types: string[];
      }>;
      fetchFields(options: { fields: string[] }): Promise<unknown>;
    };
  };
};

export function LocationPicker(props: LocationPickerProps) {
  if (!isMapsConfigured) {
    return (
      <div className="location-picker-fallback" role="status">
        Google Maps 설정이 필요하여 위치를 선택할 수 없습니다.
      </div>
    );
  }

  return <LocationPickerView {...props} />;
}

function LocationPickerView({
  value,
  onChange,
  disabled = false,
  includedRegionCodes,
}: LocationPickerProps) {
  const status = useApiLoadingStatus();
  const placesLibrary = useMapsLibrary('places');
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<PlaceAutocompleteElementInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const regionCodesKey = includedRegionCodes?.join(',');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = autocompleteContainerRef.current;
    if (!placesLibrary || !container) return;

    const autocomplete = new placesLibrary.PlaceAutocompleteElement({
      includedRegionCodes: regionCodesKey?.split(','),
      placeholder: '주소를 검색하세요.',
    });

    async function handleSelect(event: Event) {
      setPlaceError(null);

      try {
        const place = (event as PlacePredictionSelectEvent).placePrediction.toPlace();
        await place.fetchFields({
          fields: ['formattedAddress', 'location', 'addressComponents'],
        });
        const location = getSelectedLocation(place);

        if (!location) {
          setPlaceError('선택한 장소에서 주소와 좌표를 확인할 수 없습니다.');
          return;
        }

        onChangeRef.current(location);
      } catch {
        setPlaceError('주소 정보를 불러오지 못했습니다. 다시 시도해주세요.');
      }
    }

    function handleError() {
      setPlaceError('주소 검색을 불러오지 못했습니다. 다시 시도해주세요.');
    }

    autocomplete.addEventListener('gmp-select', handleSelect);
    autocomplete.addEventListener('gmp-error', handleError);
    container.replaceChildren(autocomplete);
    autocompleteRef.current = autocomplete;

    return () => {
      autocomplete.removeEventListener('gmp-select', handleSelect);
      autocomplete.removeEventListener('gmp-error', handleError);
      autocomplete.remove();
      autocompleteRef.current = null;
    };
  }, [placesLibrary, regionCodesKey]);

  useEffect(() => {
    const autocomplete = autocompleteRef.current;
    const address = value?.address ?? '';
    if (!autocomplete || autocomplete.value === address) return;
    autocomplete.value = address;
  }, [value?.address]);

  useEffect(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.disabled = disabled;
    }
  }, [disabled]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="location-picker-fallback" role="alert">
        Google Maps를 불러오지 못해 위치를 선택할 수 없습니다.
      </div>
    );
  }

  const position = value ? toLatLng(value) : null;

  return (
    <div className="location-picker">
      <div className="location-picker-search" ref={autocompleteContainerRef}>
        {!placesLibrary ? <span className="muted">주소 검색을 불러오는 중입니다.</span> : null}
      </div>
      {placeError ? (
        <span className="field-error" role="alert">
          {placeError}
        </span>
      ) : null}
      <div className="location-picker-map">
        <Map
          defaultCenter={position ?? DEFAULT_KOREA_CENTER}
          defaultZoom={position ? DETAIL_MAP_ZOOM : 7}
          mapId={mapsConfig.mapId || undefined}
          gestureHandling="cooperative"
          clickableIcons={false}
          mapTypeControl={false}
          reuseMaps
        >
          <LocationPickerMapContent position={position} />
        </Map>
      </div>
      <div className="location-picker-details" aria-live="polite">
        {value ? (
          <>
            <strong>{value.address}</strong>
            <span>
              {value.region} · {value.countryCode}
            </span>
            <small>숙소 위치는 선택한 주소를 기준으로 저장되며 등록 후 변경할 수 없습니다.</small>
          </>
        ) : (
          <span className="muted">주소 검색 결과를 선택하면 해당 주소의 위치가 지도에 표시됩니다.</span>
        )}
      </div>
    </div>
  );
}

interface LocationPickerMapContentProps {
  position: { lat: number; lng: number } | null;
}

function LocationPickerMapContent({ position }: LocationPickerMapContentProps) {
  const map = useMap();
  const latitude = position?.lat;
  const longitude = position?.lng;

  useEffect(() => {
    if (!map || latitude === undefined || longitude === undefined) return;
    map.panTo({ lat: latitude, lng: longitude });
    map.setZoom(DETAIL_MAP_ZOOM);
  }, [latitude, longitude, map]);

  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      title="선택한 숙소 위치 (이동 불가)"
      anchorLeft={ROOM_DETAIL_PIN_ANCHOR.left}
      anchorTop={ROOM_DETAIL_PIN_ANCHOR.top}
      className="location-picker-marker"
      clickable={false}
      draggable={false}
    >
      <RoomDetailPin showPulse={false} />
    </AdvancedMarker>
  );
}
