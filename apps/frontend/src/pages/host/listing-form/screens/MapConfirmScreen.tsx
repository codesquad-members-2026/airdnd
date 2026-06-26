import { KakaoMap } from '../components/KakaoMap';

export function MapConfirmScreen({
  address,
  onCoordinatesChange,
}: {
  address: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
}) {
  return (
    <div style={{ maxWidth: 550, margin: '0 auto', width: '100%' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 30,
          textAlign: 'center',
        }}
      >
        핀이 올바른 위치에 있나요?
      </h1>
      <p style={{ fontSize: 15, color: 'var(--ink-3)', textAlign: 'center', marginTop: 10 }}>
        주소는 게스트가 예약을 완료한 후에만 공유됩니다.
      </p>

      {address ? (
        <KakaoMap address={address} onCoordinatesChange={onCoordinatesChange} />
      ) : (
        <div style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-3)', textAlign: 'center' }}>
          먼저 주소를 입력해주세요.
        </div>
      )}
    </div>
  );
}
