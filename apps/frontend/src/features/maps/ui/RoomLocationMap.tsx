import { AdvancedMarker, APILoadingStatus, Map, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import {
  DETAIL_MAP_ZOOM,
  isMapsConfigured,
  mapsConfig,
  ROOM_DETAIL_PIN_ANCHOR,
} from '../config/mapsConfig';
import { coordinatesSchema } from '../model/locationTypes';
import { RoomDetailPin } from './RoomDetailPin';

interface RoomLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export function RoomLocationMap({ latitude, longitude, name }: RoomLocationMapProps) {
  // 백엔드에서 잘못된 좌표가 오는 경우를 방어합니다.
  if (!coordinatesSchema.safeParse({ latitude, longitude }).success) {
    return <p className="room-map-fallback muted">위치 정보를 표시할 수 없습니다.</p>;
  }

  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // API 키가 없으면(테스트/미설정) 지도 대신 외부 링크만 제공합니다.
  if (!isMapsConfigured) {
    return (
      <div className="room-map-fallback">
        <span className="muted">지도를 표시할 수 없습니다.</span>
        <a className="link-button" href={externalUrl} target="_blank" rel="noreferrer">
          Google 지도에서 보기
        </a>
      </div>
    );
  }

  return (
    <RoomLocationMapView latitude={latitude} longitude={longitude} name={name} externalUrl={externalUrl} />
  );
}

interface RoomLocationMapViewProps extends RoomLocationMapProps {
  externalUrl: string;
}

function RoomLocationMapView({ latitude, longitude, name, externalUrl }: RoomLocationMapViewProps) {
  const status = useApiLoadingStatus();
  const position = { lat: latitude, lng: longitude };

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="room-map-fallback">
        <span className="muted">지도를 불러오지 못했습니다.</span>
        <a className="link-button" href={externalUrl} target="_blank" rel="noreferrer">
          Google 지도에서 보기
        </a>
      </div>
    );
  }

  return (
    <div className="room-map">
      <div className="room-map-canvas">
        <Map
          defaultCenter={position}
          defaultZoom={DETAIL_MAP_ZOOM}
          mapId={mapsConfig.mapId || undefined}
          gestureHandling="cooperative"
          mapTypeControl={false}
          reuseMaps
        >
          <AdvancedMarker
            position={position}
            title={name}
            anchorLeft={ROOM_DETAIL_PIN_ANCHOR.left}
            anchorTop={ROOM_DETAIL_PIN_ANCHOR.top}
          >
            <RoomDetailPin />
          </AdvancedMarker>
        </Map>
      </div>
      <a className="link-button" href={externalUrl} target="_blank" rel="noreferrer">
        Google 지도에서 보기
      </a>
    </div>
  );
}
