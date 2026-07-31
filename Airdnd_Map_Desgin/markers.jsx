// Custom map marker components for Airdnd.
const { useState: _useStateM } = React;

function StarIcon({ cls }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.26 6.85.62-5.17 4.55 1.54 6.7L12 17.1 5.88 20.7l1.54-6.71L2.25 8.88l6.85-.62L12 2z" />
    </svg>
  );
}
function HeartIcon({ cls }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.9-10-9.2C.3 8.6 1.6 5 5 5c2 0 3.2 1.2 4 2.4C9.8 6.2 11 5 13 5c3.4 0 4.7 3.6 3 6.8C19.5 16.1 12 21 12 21z" />
    </svg>
  );
}
window.StarIcon = StarIcon;
window.HeartIcon = HeartIcon;

// direction: 1 | 2 | 3 ; states derived from listing + selection
function PriceMarker({ listing, direction = 1, selected = false, viewed = false, showRating = false, onClick, onHover, style }) {
  const cls = [
    "am",
    "am--d" + direction,
    selected ? "is-selected" : "",
    viewed && !selected ? "is-viewed" : "",
    !listing.available ? "is-soldout" : "",
    listing.wishlisted ? "is-wishlisted" : "",
  ].filter(Boolean).join(" ");

  const label = listing.available ? window.formatKRW(listing.price) : "예약 마감";

  return (
    <button
      type="button"
      className={cls}
      style={style}
      onClick={onClick}
      onMouseEnter={onHover}
      aria-pressed={selected}
      aria-label={`${listing.name}, ${window.formatKRW(listing.price)} per night`}
    >
      <HeartIcon cls="am__heart" />
      {showRating && listing.available ? (
        <span className="am__rating"><StarIcon cls="am__star" /></span>
      ) : null}
      <span className="am__price">{label}</span>
    </button>
  );
}
window.PriceMarker = PriceMarker;

function ClusterMarker({ cluster, onClick, style }) {
  return (
    <button type="button" className="cluster" style={style} onClick={onClick}
      aria-label={`${cluster.count} stays in ${cluster.label}`}>
      <span className="cluster__count">
        <span className="cluster__dot" />
        {cluster.count} stays
      </span>
      <span className="cluster__range">
        {window.formatKRWShort(cluster.min)}–{window.formatKRWShort(cluster.max)}
      </span>
    </button>
  );
}
window.ClusterMarker = ClusterMarker;

function DetailPin({ style }) {
  return (
    <div className="detail-pin" style={style} aria-label="Listing location">
      <span className="detail-pin__pulse" />
      <svg className="detail-pin__shape" viewBox="0 0 40 52" fill="none" aria-hidden="true">
        {/* teardrop balloon — pointed tip at bottom marks the exact spot */}
        <path d="M20 51 C20 51 36 33 36 19 A16 16 0 1 0 4 19 C4 33 20 51 20 51 Z" fill="currentColor" />
        {/* white house glyph in the head */}
        <path d="M20 10.5 L29.5 18.5 L27 18.5 L27 27 L13 27 L13 18.5 L10.5 18.5 Z" fill="#fff" />
        <rect x="17.2" y="21" width="5.6" height="6" rx="0.8" fill="currentColor" />
      </svg>
    </div>
  );
}
window.DetailPin = DetailPin;
