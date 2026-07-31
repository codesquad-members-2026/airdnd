// Reference board — every marker direction × state, plus cluster, info card, detail pin.
function BoardMarker({ listing, direction, selected, viewed, hover, showRating }) {
  const cls = [
    "am", "am--d" + direction,
    selected ? "is-selected" : "",
    viewed && !selected ? "is-viewed" : "",
    !listing.available ? "is-soldout" : "",
    listing.wishlisted ? "is-wishlisted" : "",
    hover ? "is-hover" : "",
  ].filter(Boolean).join(" ");
  const label = listing.available ? window.formatKRW(listing.price) : "예약 마감";
  return (
    <div className={direction === 3 ? "d3-wrap" : ""} style={direction === 3 ? { paddingBottom: 8 } : null}>
      <span className={cls} style={{ pointerEvents: "none" }}>
        <HeartIcon cls="am__heart" />
        {showRating && listing.available ? <span className="am__rating"><StarIcon cls="am__star" /></span> : null}
        <span className="am__price">{label}</span>
      </span>
    </div>
  );
}

const SAMPLE = { id: 99, name: "Sample", price: 118000, rating: 4.9, available: true, wishlisted: false };
const SOLD = { ...SAMPLE, available: false };
const WISH = { ...SAMPLE, wishlisted: true };

function Swatch({ children, title, sub, map }) {
  return (
    <div className="swatch">
      <div className={"swatch__stage" + (map ? " swatch__stage--map" : "")}>{children}</div>
      <div className="swatch__label"><strong>{title}</strong><span>{sub}</span></div>
    </div>
  );
}

function Board() {
  const [dir, setDir] = useState(2);
  const states = [
    { t: "Default", s: "Resting price pin", p: { listing: SAMPLE } },
    { t: "Hover", s: "Pointer over marker", p: { listing: SAMPLE, hover: true } },
    { t: "Selected", s: "Open / active listing", p: { listing: SAMPLE, selected: true } },
    { t: "Viewed", s: "Already opened once", p: { listing: SAMPLE, viewed: true } },
    { t: "With rating", s: "Optional star prefix", p: { listing: { ...SAMPLE, rating: 4.95 }, showRating: true } },
    { t: "Wishlisted", s: "Saved to a folder", p: { listing: WISH } },
    { t: "Wishlisted + selected", s: "Saved & active", p: { listing: WISH, selected: true } },
    { t: "Sold out", s: "Unavailable for dates", p: { listing: SOLD } },
  ];

  return (
    <section className="board">
      <div className="board-inner">
        <div className="section-head" style={{ padding: "44px 0 8px", maxWidth: "none" }}>
          <p className="eyebrow">Component spec</p>
          <h1>Markers, states &amp; variations</h1>
          <p>Every marker state for each visual direction, plus the cluster, info card and the single detail-page pin. The live map above reflects whichever direction is set in Tweaks.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
          <span style={{ fontSize: "var(--font-size-13)", fontWeight: 800, color: "var(--text-tertiary)" }}>DIRECTION</span>
          <div className="dir-tabs">
            {[[1, "Classic"], [2, "Branded"], [3, "Anchored"]].map(([d, name]) => (
              <button key={d} className={dir === d ? "is-on" : ""} onClick={() => setDir(d)}>{d} · {name}</button>
            ))}
          </div>
          <span style={{ fontSize: "var(--font-size-13)", color: "var(--text-tertiary)", fontWeight: 650 }}>
            {dir === 1 ? "White pill, ink fill when active — closest to the original." :
             dir === 2 ? "White by default, brand-pink on hover & select." :
             "Anchored teardrop with a tail that pins to the exact spot."}
          </span>
        </div>

        <div className="board-section">
          <div className="board-grid">
            {states.map((st) => (
              <Swatch key={st.t} title={st.t} sub={st.s} map>
                <BoardMarker direction={dir} {...st.p} />
              </Swatch>
            ))}
          </div>
        </div>

        <div className="board-section">
          <h3>Cluster marker</h3>
          <p>Shown when the map is zoomed out — count plus the price range for that district. Tap to zoom in.</p>
          <div className="board-grid">
            {window.AIRDND_CLUSTERS.map((c) => (
              <Swatch key={c.id} title={c.label} sub={`${c.count} stays`} map>
                <ClusterMarker cluster={c} onClick={() => {}} />
              </Swatch>
            ))}
          </div>
        </div>

        <div className="board-section">
          <h3>Info card &amp; detail pin</h3>
          <p>The popover that opens on marker click, and the animated branded pin used on a single room&rsquo;s detail page.</p>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>
            <div className="infocard-demo">
              <InfoCard listing={window.AIRDND_LISTINGS[5]} onClose={() => {}} onToggleWish={() => {}} />
            </div>
            <Swatch title="Detail-page pin" sub="Single location · animated halo" map>
              <DetailPin />
            </Swatch>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Board = Board;
