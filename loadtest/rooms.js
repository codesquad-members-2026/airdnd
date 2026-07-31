// k6 load test for airdnd room search — drives the endpoints from the index
// investigation while you watch the "Bottleneck Triage" Grafana dashboard.
//
//   brew install k6
//   k6 run loadtest/rooms.js                       # against prod (default URL below)
//   BASE_URL=http://localhost:8080 k6 run loadtest/rooms.js   # against local
//   PEAK_VUS=200 k6 run loadtest/rooms.js          # push harder
//
// Each request carries a unique `cb` param so CloudFront/browser caches are
// bypassed and every call actually reaches the backend (otherwise you'd be load
// testing the CDN, not Tomcat/MySQL).
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://d3jcrga8nxeldx.cloudfront.net';
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || '50');

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Math.ceil(PEAK_VUS * 0.2) }, // warm up
        { duration: '1m',  target: Math.ceil(PEAK_VUS * 0.5) },
        { duration: '1m',  target: PEAK_VUS },                   // hold at peak
        { duration: '30s', target: 0 },                          // ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Safety valve on PROD: bail out if >10% of requests error — stops the test
    // automatically instead of pounding a struggling box.
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: true }],
    http_req_duration: ['p(95)<3000'], // informational; won't abort
  },
};

// The three shapes from the investigation. `name` tags group them in k6's summary.
const QUERIES = [
  // 1) Region text search (the original "1-in-a-million LA room" full-scan case)
  { name: 'region-LA', path: '/api/rooms?region=Los%20Angeles&guests=1&adults=1&children=0&infants=0' },
  // 2) Overseas-edge bbox — wide North America box, populated area near the WEST
  //    edge (the pathological ~5s PK-walk case)
  { name: 'overseas-edge', path: '/api/rooms?south=15&west=-130&north=55&east=-60&guests=1&adults=1&children=0&infants=0' },
  // 3) Domestic dense bbox (Seoul) — the healthy fast path, for comparison
  { name: 'domestic-seoul', path: '/api/rooms?south=37.4&west=126.8&north=37.7&east=127.2&guests=1&adults=1&children=0&infants=0' },
];

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const cb = `${__VU}-${__ITER}-${Date.now()}`;
  const res = http.get(`${BASE_URL}${q.path}&cb=${cb}`, {
    tags: { name: q.name },
    headers: { 'Accept': 'application/json' },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 0,
  });
  sleep(1); // ~1 req/VU/sec think time
}
