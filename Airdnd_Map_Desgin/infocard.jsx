// Info-card popover shown when a price marker is clicked on the map.
function InfoCard({ listing, onClose, onToggleWish, style }) {
  return (
    <div className="infocard" style={style} role="dialog" aria-label={listing.name}>
      <div className="infocard__arrow" />
      <div className="infocard__media">
        <img src={listing.img} alt="" loading="lazy" />
        <button type="button" className="infocard__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button type="button"
          className={"infocard__wish" + (listing.wishlisted ? " is-on" : "")}
          onClick={onToggleWish} aria-label="Save to wishlist">
          <HeartIcon cls="infocard__wish-icon" />
        </button>
        {!listing.available ? <span className="infocard__badge">예약 마감</span> : null}
        {listing.pets && listing.available ? <span className="infocard__chip">반려동물 OK</span> : null}
      </div>
      <div className="infocard__body">
        <div className="infocard__row">
          <h3 className="infocard__title">{listing.name}</h3>
          <span className="infocard__rating">
            <StarIcon cls="infocard__star" />{listing.rating.toFixed(2)}
          </span>
        </div>
        <p className="infocard__meta">{listing.region} · {listing.type}</p>
        <p className="infocard__meta">최대 {listing.guests}명 · 침대 {listing.beds}개 · 후기 {listing.reviews}개</p>
        <p className="infocard__price">
          <strong>{window.formatKRW(listing.price)}</strong> <span>/ 박</span>
        </p>
      </div>
    </div>
  );
}
window.InfoCard = InfoCard;
