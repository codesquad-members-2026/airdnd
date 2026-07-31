// Root — shared selection state across list + map, plus Tweaks.
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const listings = window.AIRDND_LISTINGS;
  const clusters = window.AIRDND_CLUSTERS;

  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewedIds, setViewedIds] = useState(() => new Set());

  const direction = STYLE_TO_DIR[t.markerStyle] || 1;

  // apply accent to CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty("--color-brand", t.accent);
    document.documentElement.style.setProperty("--am-accent", t.accent);
  }, [t.accent]);

  const select = useCallback((id) => {
    setSelectedId(id);
    if (id != null) setViewedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
  }, []);

  return (
    <div>
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7-5 7 5v9a2 2 0 01-2 2H7a2 2 0 01-2-2z"/></svg>
          </span>
          airdnd
        </span>
        <div className="mini-search">
          <span>서울</span>
          <span className="muted">5월 17일–22일</span>
          <span className="muted">게스트 3명</span>
          <span className="mini-search-go">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z"/></svg>
          </span>
        </div>
        <span className="topbar-spacer" />
        <span className="topbar-tag">300+ stays · map view</span>
      </header>

      <div className="split">
        <ResultsList
          listings={listings}
          selectedId={selectedId}
          viewedIds={viewedIds}
          onSelect={select}
          onHover={setHoveredId}
          onLeave={() => setHoveredId(null)}
        />
        <MapView
          listings={listings}
          clusters={clusters}
          direction={direction}
          showRating={t.showRating}
          autoCluster={t.autoCluster}
          viewedDim={t.viewedDim}
          selectedId={selectedId}
          viewedIds={viewedIds}
          hoveredId={hoveredId}
          onSelect={select}
          onHover={setHoveredId}
        />
      </div>

      <Board />

      <TweaksPanel>
        <TweakSection label="Markers" />
        <TweakRadio label="Style" value={t.markerStyle}
          options={["Classic", "Branded", "Anchored"]}
          onChange={(v) => setTweak("markerStyle", v)} />
        <TweakColor label="Accent" value={t.accent}
          options={["#e84c60", "#1f8a5b", "#2a6fdb", "#18181b"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakToggle label="Star rating on pin" value={t.showRating}
          onChange={(v) => setTweak("showRating", v)} />
        <TweakSection label="Behavior" />
        <TweakToggle label="Cluster when zoomed out" value={t.autoCluster}
          onChange={(v) => setTweak("autoCluster", v)} />
        <TweakToggle label="Dim viewed listings" value={t.viewedDim}
          onChange={(v) => setTweak("viewedDim", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
