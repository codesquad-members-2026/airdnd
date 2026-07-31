// Left-hand results list, synced with the map.
function ResultsList({ listings, selectedId, viewedIds, onSelect, onHover, onLeave }) {
  return (
    <div className="results">
      <div className="results-head">
        <h2>서울의 숙소 {listings.length}곳</h2>
        <span className="muted">5월 17일–22일 · 게스트 3명</span>
      </div>
      <div className="result-list" onMouseLeave={onLeave}>
        {listings.map((l) => {
          const cls = [
            "result",
            l.id === selectedId ? "is-active" : "",
            viewedIds.has(l.id) ? "is-viewed" : "",
          ].filter(Boolean).join(" ");
          return (
            <button type="button" key={l.id} className={cls}
              onMouseEnter={() => onHover(l.id)}
              onClick={() => onSelect(l.id)}>
              <img src={l.img} alt="" loading="lazy" />
              <div>
                <p className="result-title">{l.name}</p>
                <p className="result-meta">{l.region} · {l.type}</p>
                <p className="result-meta">최대 {l.guests}명 · 침대 {l.beds}개</p>
                <div className="result-foot">
                  <span className="result-rating"><StarIcon />{l.rating.toFixed(2)} <span style={{ color: "var(--text-tertiary)", fontWeight: 650 }}>({l.reviews})</span></span>
                  {l.available
                    ? <span className="result-price">{window.formatKRW(l.price)} <span>/ 박</span></span>
                    : <span className="result-soldout">예약 마감</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
window.ResultsList = ResultsList;
