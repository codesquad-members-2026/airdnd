// k6 load test for airdnd room search — KOREA-only edition.
//
// Companion to loadtest/rooms.js (which keeps the US/cross-continent cases for
// regression testing). This one stays inside the Korean peninsula but still
// exercises every behavior that matters, including the empty-box PK-walk — which
// is a domestic risk too (panning the map onto an ocean or an empty rural area),
// not something unique to overseas listings.
//
//   k6 run loadtest/rooms-korea.js                       # against prod (default URL)
//   BASE_URL=http://localhost:8080 k6 run loadtest/rooms-korea.js
//   PEAK_VUS=200 k6 run loadtest/rooms-korea.js          # push harder
//   THINK_TIME=0 k6 run loadtest/rooms-korea.js          # saturation run (no sleep)
//
// IMPORTANT: every request uses a FRESH, RANDOM bounding box (clustered on real
// city anchors), so each call is a DISTINCT query. The old version reused 4 fixed
// boxes, so after warmup the backend just re-read the same buffer-pool pages —
// flat CPU, zero disk, unrealistic. Random boxes hit varied index ranges and
// filesorts like real map panning does. (The `cb` param only bypasses CloudFront;
// the backend ignores it, so it does NOT vary the SQL on its own.)
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://d3jcrga8nxeldx.cloudfront.net';
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || '50');
const THINK_TIME = parseFloat(__ENV.THINK_TIME || '1'); // seconds; 0 = saturate

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: Math.ceil(PEAK_VUS * 0.2) },
        { duration: '30s', target: Math.ceil(PEAK_VUS * 0.5) },
        { duration: '1m', target: PEAK_VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true }],
    http_req_duration: ['p(95)<3000'],
  },
};

// Real city anchors (lat, lng) — same clustering the seed uses, so random metro
// boxes land where listings actually are. Korean region names for text search.
const ANCHORS = [
  { region: '서울특별시', lat: 37.5665, lng: 126.978 },
  { region: '경기도', lat: 37.2636, lng: 127.0286 },
  { region: '인천광역시', lat: 37.4563, lng: 126.7052 },
  { region: '부산광역시', lat: 35.1796, lng: 129.0756 },
  { region: '대구광역시', lat: 35.8714, lng: 128.6014 },
  { region: '대전광역시', lat: 36.3504, lng: 127.3845 },
  { region: '광주광역시', lat: 35.1595, lng: 126.8526 },
  { region: '제주특별자치도', lat: 33.4996, lng: 126.5312 },
  { region: '강원특별자치도', lat: 37.7519, lng: 128.8761 },
  { region: '전북특별자치도', lat: 35.8242, lng: 127.148 },
];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r4 = (n) => Math.round(n * 1e4) / 1e4; // 4 dp keeps URLs sane but distinct

// Build a bbox query string from a center + half-extents (degrees), with random
// guest filters so the capacity predicate varies too.
function boxQuery(centerLat, centerLng, halfLat, halfLng) {
  const south = r4(centerLat - halfLat);
  const north = r4(centerLat + halfLat);
  const west = r4(centerLng - halfLng);
  const east = r4(centerLng + halfLng);
  const guests = 1 + Math.floor(Math.random() * 6);
  const children = Math.floor(Math.random() * 3);
  return `south=${south}&west=${west}&north=${north}&east=${east}` +
    `&guests=${guests}&adults=${guests}&children=${children}&infants=0`;
}

// Weighted mix of query SHAPES, each with randomized coordinates per call.
// Weights model REALISTIC traffic: users overwhelmingly browse populated areas
// and search by region; fully-zoomed-out views happen occasionally; panning onto
// empty ocean is rare. (An earlier 10% `empty-sea` over-weighted the empty-box
// PK-walk pathology and made the box look worse than real usage would.)
//   metro-random 72%  |  region-text 13%  |  korea-wide 12%  |  empty-sea 3%
function nextQuery() {
  const r = Math.random();
  if (r < 0.72) {
    // Dense metro box around a random anchor, random zoom — the common path.
    const a = pick(ANCHORS);
    const half = rand(0.05, 0.3);
    return {
      name: 'metro-random',
      path: `/api/rooms?${boxQuery(a.lat + rand(-0.1, 0.1), a.lng + rand(-0.1, 0.1), half, half)}`,
    };
  }
  if (r < 0.84) {
    // Fully zoomed-out, jittered peninsula box — the gather-many + filesort case.
    return {
      name: 'korea-wide',
      path: `/api/rooms?${boxQuery(rand(35.5, 36.5), rand(127, 128), rand(2.5, 3.2), rand(2.2, 2.8))}`,
    };
  }
  if (r < 0.87) {
    // Random empty box over the East Sea — the empty-box PK-walk pathology (rare).
    return {
      name: 'empty-sea',
      path: `/api/rooms?${boxQuery(rand(36, 39.5), rand(130.6, 132), rand(0.3, 0.8), rand(0.3, 0.8))}`,
    };
  }
  // Region text search on a random region (sargable prefix on the region index).
  const a = pick(ANCHORS);
  const guests = 1 + Math.floor(Math.random() * 6);
  return {
    name: 'region-text',
    path: `/api/rooms?region=${encodeURIComponent(a.region)}&guests=${guests}&adults=${guests}&children=0&infants=0`,
  };
}

export default function () {
  const q = nextQuery();
  const cb = `${__VU}-${__ITER}-${Date.now()}`;
  const res = http.get(`${BASE_URL}${q.path}&cb=${cb}`, {
    tags: { name: q.name },
    headers: { Accept: 'application/json' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 0,
  });
  if (THINK_TIME > 0) sleep(THINK_TIME);
}
