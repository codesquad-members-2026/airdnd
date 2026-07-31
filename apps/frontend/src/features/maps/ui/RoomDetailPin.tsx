// 숙소 상세 위치 지도용 브랜드 핀 — 끝점이 정확한 위치를 가리키는 teardrop 풍선 핀.
// Claude Design 핸드오프(Airdnd Map Markers)의 detail-pin 디자인을 옮긴 컴포넌트입니다.
export function RoomDetailPin({ showPulse = true }: { showPulse?: boolean }) {
  return (
    <div className="detail-pin" aria-label="숙소 위치">
      {showPulse ? <span className="detail-pin__pulse" /> : null}
      <svg className="detail-pin__shape" viewBox="0 0 40 52" fill="none" aria-hidden="true">
        {/* teardrop 풍선 — 아래쪽 뾰족한 끝이 정확한 지점을 표시 */}
        <path d="M20 51 C20 51 36 33 36 19 A16 16 0 1 0 4 19 C4 33 20 51 20 51 Z" fill="currentColor" />
        {/* 머리 부분의 흰색 집 글리프 */}
        <path d="M20 10.5 L29.5 18.5 L27 18.5 L27 27 L13 27 L13 18.5 L10.5 18.5 Z" fill="#fff" />
        <rect x="17.2" y="21" width="5.6" height="6" rx="0.8" fill="currentColor" />
      </svg>
    </div>
  );
}
