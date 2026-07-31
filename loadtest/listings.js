// k6 load test for the airdnd `/api/listings` map-bounds endpoint.
//
// Companion to loadtest/rooms.js and rooms-korea.js. Those drive the older
// `/api/rooms?south=&west=&...` shape via CloudFront; THIS one drives the newer
//   GET /api/listings?mapBounds.south=&mapBounds.north=&mapBounds.west=&mapBounds.east=&page=&size=
// shape directly against the origin domain (airdnd.wownd.me, fronted by
// Cloudflare). The captured request that seeded this test was a Gangnam-area box.
//
//   brew install k6
//   k6 run loadtest/listings.js                              # THROUGH Cloudflare (default)
//   BASE_URL=http://localhost:8080 k6 run loadtest/listings.js   # against local
//   ORIGIN_IP=1.2.3.4 k6 run loadtest/listings.js            # pin straight to the origin EC2
//   PEAK_VUS=200 k6 run loadtest/listings.js                 # push harder
//   THINK_TIME=0 k6 run loadtest/listings.js                 # saturation run (no sleep)
//   PAGE_SIZE=20 k6 run loadtest/listings.js                 # tune page size
//
// Setting ORIGIN_IP pins the BASE_URL hostname to that address via k6's `hosts`
// map, so traffic hits the origin EC2 DIRECTLY — bypassing Cloudflare and DNS —
// while keeping the SNI / Host header as airdnd.wownd.me. The origin serves a
// Cloudflare Origin Certificate (not publicly trusted), so cert verification is
// skipped in that mode. The origin IP is deliberately NOT hard-coded here: this
// repository is public, and publishing it would let anyone bypass the CDN and its
// WAF rate limiting. Leave ORIGIN_IP unset to go through Cloudflare via normal DNS
// with full TLS verification.
//
// ⚠️  PROD SAFETY: prod runs on a t4g.micro (1 GB RAM, NO swap) that OOMs under
// heavy query load. Start small (PEAK_VUS=20-30) and watch memory before ramping.
// The http_req_failed threshold below auto-ABORTS the run if >10% of requests
// fail, so a struggling box stops the test instead of getting pounded.
//
// Every request uses a FRESH, RANDOM bounding box clustered on real city anchors,
// so each call is a DISTINCT query that hits varied index ranges / filesorts like
// real map panning — not the same cached buffer-pool pages over and over. The `cb`
// param only bypasses Cloudflare's edge cache; the backend ignores it.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://airdnd.wownd.me';
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || '30');
const THINK_TIME = parseFloat(__ENV.THINK_TIME || '1'); // seconds; 0 = saturate
const PAGE_SIZE = parseInt(__ENV.PAGE_SIZE || '20');
// Origin IP to hit directly (bypassing Cloudflare/DNS). Unset = go through Cloudflare.
const ORIGIN_IP = __ENV.ORIGIN_IP || '';

// Hostname out of BASE_URL (strip scheme, port, path). Only pin a real domain —
// never a localhost run.
const TARGET_HOST = BASE_URL.replace(/^https?:\/\//, '').replace(/[:/].*$/, '');
const PIN_IP = ORIGIN_IP && !/^(localhost|127\.0\.0\.1)$/.test(TARGET_HOST);

export const options = {
  // Resolve the hostname straight to the origin IP — TCP goes direct to the EC2
  // box, but SNI/cert/Host header stay as TARGET_HOST. The origin serves a
  // Cloudflare Origin Certificate (only trusted by Cloudflare's edge, not a public
  // CA), so Go/k6 can't verify it — skip verification when we bypass Cloudflare.
  ...(PIN_IP ? { hosts: { [TARGET_HOST]: ORIGIN_IP }, insecureSkipTLSVerify: true } : {}),
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1s', target: Math.ceil(PEAK_VUS * 0.2) },
        { duration: '3s', target: Math.ceil(PEAK_VUS * 0.5) },
        { duration: '5m', target: PEAK_VUS },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Safety valve on PROD: abort if >10% of requests error — stops the test
    // automatically instead of pounding a struggling (1 GB, no-swap) box.
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true }],
    http_req_duration: ['p(95)<3000'], // informational; won't abort
  },
};

// Real city anchors (lat, lng) — same clustering the seed uses, so random metro
// boxes land where listings actually are.
const ANCHORS = [
  { lat: 37.5665, lng: 126.978 },  // 서울
  { lat: 37.4979, lng: 127.0276 }, // 강남 (the captured request's area)
  { lat: 37.2636, lng: 127.0286 }, // 경기/수원
  { lat: 37.4563, lng: 126.7052 }, // 인천
  { lat: 35.1796, lng: 129.0756 }, // 부산
  { lat: 35.8714, lng: 128.6014 }, // 대구
  { lat: 36.3504, lng: 127.3845 }, // 대전
  { lat: 35.1595, lng: 126.8526 }, // 광주
  { lat: 33.4996, lng: 126.5312 }, // 제주
  { lat: 37.7519, lng: 128.8761 }, // 강원/강릉
];

const rand = (min, max) => min + Math.random() * (max - min);
const rint = (min, max) => Math.floor(rand(min, max + 1)); // inclusive int
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r6 = (n) => Math.round(n * 1e6) / 1e6; // 6 dp matches the captured request

// Build the mapBounds query string from a center + half-extents (degrees).
function boundsQuery(centerLat, centerLng, halfLat, halfLng) {
  const south = r6(centerLat - halfLat);
  const north = r6(centerLat + halfLat);
  const west = r6(centerLng - halfLng);
  const east = r6(centerLng + halfLng);
  return `mapBounds.south=${south}&mapBounds.north=${north}` +
    `&mapBounds.west=${west}&mapBounds.east=${east}`;
}

// Weighted mix of query SHAPES, each randomized per call. Models realistic
// traffic: users mostly browse populated metros at street/neighborhood zoom;
// fully zoomed-out country views happen occasionally; panning onto empty ocean
// is rare. Pagination mostly stays on page 0 with occasional deeper pages.
//   metro-tight 70%  |  korea-wide 12%  |  empty-sea 3%  |  metro-deep-page 15%
// Per-call random page size around PAGE_SIZE, so the OFFSET/LIMIT shape varies too.
function nextSize() {
  return Math.max(1, PAGE_SIZE + rint(-Math.floor(PAGE_SIZE / 2), Math.floor(PAGE_SIZE / 2)));
}

// Random box aspect ratio (lng half = lat half * ratio) — real map viewports are
// never a fixed shape, they depend on window size and latitude.
const aspect = () => rand(0.4, 1.4);

function nextQuery() {
  const r = Math.random();
  if (r < 0.70) {
    // Tight neighborhood box around a random anchor — the common street-level path.
    // Wider jitter so consecutive calls don't keep re-hitting the same anchor cell.
    const a = pick(ANCHORS);
    const half = rand(0.015, 0.10); // ~ the Gangnam capture was ~0.03 x 0.018
    const bounds = boundsQuery(a.lat + rand(-0.12, 0.12), a.lng + rand(-0.12, 0.12), half, half * aspect());
    // Occasionally page deeper even at street zoom.
    return { name: 'metro-tight', bounds, page: Math.random() < 0.15 ? rint(1, 3) : 0 };
  }
  if (r < 0.82) {
    // Fully zoomed-out peninsula box — the gather-many + filesort case.
    const bounds = boundsQuery(rand(35.2, 36.8), rand(126.6, 128.4), rand(2.2, 3.4), rand(2.0, 3.0));
    return { name: 'korea-wide', bounds, page: rint(0, 2) };
  }
  if (r < 0.85) {
    // Random empty box over the East Sea — the empty-box scan pathology (rare).
    const bounds = boundsQuery(rand(36, 39.5), rand(130.6, 132), rand(0.3, 0.8), rand(0.3, 0.8));
    return { name: 'empty-sea', bounds, page: 0 };
  }
  // Dense metro box but paging deeper — exercises OFFSET cost on a populated set.
  const a = pick(ANCHORS);
  const half = rand(0.1, 0.25);
  const bounds = boundsQuery(a.lat + rand(-0.05, 0.05), a.lng + rand(-0.05, 0.05), half, half * aspect());
  return { name: 'metro-deep-page', bounds, page: rint(1, 6) };
}

export default function () {
  const q = nextQuery();
  const size = nextSize();
  const cb = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url = `${BASE_URL}/api/listings?${q.bounds}&page=${q.page}&size=${size}&cb=${cb}`;
  const res = http.get(url, {
    tags: { name: q.name },
    headers: { Accept: 'application/json' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 0,
  });
  if (THINK_TIME > 0) sleep(THINK_TIME);
}
