// ============================================================
// Airdnd — interactive map prototype
// ============================================================
const { useState, useRef, useEffect, useCallback, useMemo } = React;

const PLANE_W = 1600, PLANE_H = 1200;
const ZOOM_MIN = 0.85, ZOOM_MAX = 1.85;
const CLUSTER_BELOW = 0.96; // show clusters when zoomed out past this

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "markerStyle": "Branded",
  "accent": "#e84c60",
  "showRating": false,
  "autoCluster": true,
  "viewedDim": true
}/*EDITMODE-END*/;

const STYLE_TO_DIR = { "Classic": 1, "Branded": 2, "Anchored": 3 };

function clampPan(p, zoom, vw, vh) {
  const minX = Math.min(0, vw - PLANE_W * zoom);
  const minY = Math.min(0, vh - PLANE_H * zoom);
  return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) };
}

// ---------------- Map view ----------------
function MapView({ listings, clusters, direction, showRating, autoCluster, viewedDim,
                   selectedId, viewedIds, hoveredId, onSelect, onHover }) {
  const mapRef = useRef(null);
  const [vp, setVp] = useState({ w: 600, h: 640 });
  const [zoom, setZoom] = useState(1.05);
  const [pan, setPan] = useState({ x: -380, y: -300 });
  const [moveSearch, setMoveSearch] = useState(false);
  const [panned, setPanned] = useState(false);
  const [openInfoId, setOpenInfoId] = useState(null);
  const drag = useRef(null);
  const inited = useRef(false);

  const svg = useMemo(() => buildMapSVG(PLANE_W, PLANE_H), []);

  // measure viewport
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setVp({ w: r.width, h: r.height });
      if (!inited.current && r.width > 0) {
        inited.current = true;
        // center on the cluster of listings
        setPan(clampPan({ x: r.width / 2 - 0.46 * PLANE_W * 1.05, y: r.height / 2 - 0.42 * PLANE_H * 1.05 }, 1.05, r.width, r.height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toScreen = useCallback((xPct, yPct) => ({
    x: pan.x + (xPct / 100) * PLANE_W * zoom,
    y: pan.y + (yPct / 100) * PLANE_H * zoom,
  }), [pan, zoom]);

  const setZoomAt = useCallback((nz) => {
    nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nz));
    setZoom((z) => {
      // keep viewport center fixed while zooming
      setPan((p) => {
        const cx = vp.w / 2, cy = vp.h / 2;
        const wx = (cx - p.x) / z, wy = (cy - p.y) / z;
        return clampPan({ x: cx - wx * nz, y: cy - wy * nz }, nz, vp.w, vp.h);
      });
      return nz;
    });
  }, [vp]);

  // ---- drag to pan ----
  const onDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
    document.body.style.userSelect = "none";
  };
  useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
      setPan(clampPan({ x: drag.current.px + dx, y: drag.current.py + dy }, zoom, vp.w, vp.h));
    };
    const up = () => {
      if (drag.current && drag.current.moved) { if (!moveSearch) setPanned(true); }
      drag.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [zoom, vp, moveSearch]);

  // center map on a listing (called from list + when selected externally)
  const centerOn = useCallback((l) => {
    setPan((p) => clampPan({ x: vp.w / 2 - (l.x / 100) * PLANE_W * zoom, y: vp.h / 2 - (l.y / 100) * PLANE_H * zoom }, zoom, vp.w, vp.h));
  }, [vp, zoom]);

  // when selection comes from the list, open card + recenter
  useEffect(() => {
    if (selectedId == null) { setOpenInfoId(null); return; }
    const l = listings.find((x) => x.id === selectedId);
    if (l) { setOpenInfoId(selectedId); }
  }, [selectedId, listings]);

  const showClusters = autoCluster && zoom < CLUSTER_BELOW;

  const handleMarkerClick = (l, e) => {
    if (drag.current && drag.current.moved) return;
    e.stopPropagation();
    onSelect(l.id);
    setOpenInfoId(l.id);
  };

  const openInfo = openInfoId != null ? listings.find((l) => l.id === openInfoId) : null;
  const infoPos = openInfo ? toScreen(openInfo.x, openInfo.y) : null;

  // order markers so selected/hovered draw on top
  const ordered = [...listings].sort((a, b) => {
    const rank = (id) => (id === selectedId ? 2 : id === hoveredId ? 1 : 0);
    return rank(a.id) - rank(b.id);
  });

  return (
    <div className={"map" + (drag.current ? " dragging" : "")} ref={mapRef}
         onMouseDown={onDown}
         onClick={() => { if (!(drag.current && drag.current.moved)) setOpenInfoId(null); }}>
      <div className="map-plane" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: PLANE_W, height: PLANE_H }}
           dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="map-marker-layer">
        {showClusters
          ? clusters.map((c) => {
              const s = toScreen(c.x, c.y);
              return (
                <div className="marker-anchor" key={c.id} style={{ left: s.x, top: s.y, zIndex: 3 }}>
                  <ClusterMarker cluster={c} onClick={(e) => { e.stopPropagation(); setZoomAt(zoom + 0.55); centerOn({ x: c.x, y: c.y }); }} />
                </div>
              );
            })
          : ordered.map((l) => {
              const s = toScreen(l.x, l.y);
              const z = l.id === selectedId ? 8 : l.id === hoveredId ? 7 : 3;
              return (
                <div className={"marker-anchor" + (direction === 3 ? " d3" : "")} key={l.id}
                     style={{ left: s.x, top: s.y, zIndex: z }}>
                  <PriceMarker
                    listing={l}
                    direction={direction}
                    selected={l.id === selectedId}
                    viewed={viewedDim && viewedIds.has(l.id)}
                    showRating={showRating}
                    onClick={(e) => handleMarkerClick(l, e)}
                    onHover={() => onHover(l.id)}
                  />
                </div>
              );
            })}
      </div>

      {openInfo && !showClusters ? (
        <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <InfoCard
            listing={openInfo}
            style={{ left: infoPos.x, top: infoPos.y - (direction === 3 ? 14 : 0) }}
            onClose={() => { setOpenInfoId(null); onSelect(null); }}
            onToggleWish={() => { openInfo.wishlisted = !openInfo.wishlisted; setOpenInfoId(openInfo.id); }}
          />
        </div>
      ) : null}

      {/* controls */}
      <div className="map-controls" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={"move-search" + (moveSearch ? " is-on" : "")}
                onClick={() => { setMoveSearch((v) => !v); setPanned(false); }}>
          <span className="switch" /> 지도를 움직이면 검색하기
        </button>
        <div className="zoom-stack">
          <button type="button" onClick={() => setZoomAt(zoom + 0.3)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" onClick={() => setZoomAt(zoom - 0.3)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
        </div>
      </div>

      {panned && !moveSearch ? (
        <button type="button" className="search-here"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setPanned(false); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z"/></svg>
          이 지역 검색
        </button>
      ) : null}

      <div className="map-hint" onMouseDown={(e) => e.stopPropagation()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7-5 7 5v9a2 2 0 01-2 2H7a2 2 0 01-2-2z"/></svg>
        {showClusters ? "확대하면 개별 숙소가 표시됩니다" : "마커를 눌러 숙소를 미리 보세요"}
      </div>
    </div>
  );
}
window.MapView = MapView;
