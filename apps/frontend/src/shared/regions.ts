import data from './regions.json';

export interface Sido {
  code: string;
  name: string;
}

export interface Sigungu {
  code: string;
  name: string;
  sidoCode: string;
}

export const SIDO_LIST: Sido[] = data.sido;
const SIGUNGU_LIST: Sigungu[] = data.sigungu;

const sigunguBySido = SIGUNGU_LIST.reduce<Record<string, Sigungu[]>>((acc, s) => {
  (acc[s.sidoCode] ??= []).push(s);
  return acc;
}, {});

export function getSigunguBySido(sidoCode: string): Sigungu[] {
  return sigunguBySido[sidoCode] ?? [];
}

export function getSidoName(sidoCode: string): string {
  return SIDO_LIST.find((s) => s.code === sidoCode)?.name ?? sidoCode;
}

export function getSigunguName(sigunguCode: string): string {
  return SIGUNGU_LIST.find((s) => s.code === sigunguCode)?.name ?? sigunguCode;
}

// 표시용 지역명: 시군구 있으면 "시군구, 시도", 없으면 "시도"
export function regionLabel(sidoCode: string, sigunguCode: string | null): string {
  return sigunguCode ? `${getSigunguName(sigunguCode)}, ${getSidoName(sidoCode)}` : getSidoName(sidoCode);
}

export interface RegionOption {
  sidoCode: string;
  sigunguCode: string | null;
  label: string;
  desc?: string;
  icon?: string;
  tint?: string;
}

// 타이핑 검색용 평면 목록(시도 + 시군구). 시군구는 "시군구, 시도"로 표기
const SEARCH_INDEX: RegionOption[] = [
  ...SIDO_LIST.map((s) => ({ sidoCode: s.code, sigunguCode: null, label: s.name } as RegionOption)),
  ...SIGUNGU_LIST.map(
    (sg) =>
      ({
        sidoCode: sg.sidoCode,
        sigunguCode: sg.code,
        label: `${sg.name}, ${getSidoName(sg.sidoCode)}`,
      } as RegionOption),
  ),
];

// 입력 없을 때 보여줄 주요 도시
export const MAJOR_CITIES: RegionOption[] = [
  { sidoCode: '11', sigunguCode: null, label: '서울', desc: '관광 명소: 경복궁', icon: '🏯', tint: '#E8F0FE' },
  { sidoCode: '26', sigunguCode: null, label: '부산', desc: '해변과 도시의 매력', icon: '🏖️', tint: '#FDECEC' },
  { sidoCode: '50', sigunguCode: null, label: '제주', desc: '여름 휴가에 적합', icon: '🌴', tint: '#E7F6EE' },
  { sidoCode: '28', sigunguCode: null, label: '인천', desc: '공항 근처 인기 지역', icon: '✈️', tint: '#EAF3FB' },
  { sidoCode: '42', sigunguCode: null, label: '강원', desc: '자연을 만끽하기 좋은 곳', icon: '⛰️', tint: '#EEF1F6' },
  { sidoCode: '41', sigunguCode: null, label: '경기', desc: '서울 근교 여행', icon: '🏙️', tint: '#F1ECFB' },
  { sidoCode: '27', sigunguCode: null, label: '대구', desc: '도심 속 즐길거리', icon: '🌆', tint: '#FDF2E6' },
  { sidoCode: '30', sigunguCode: null, label: '대전', desc: '중부권 중심 도시', icon: '🏬', tint: '#FBECF3' },
];

// 검색 결과 파스텔 배경 — 시도별로 다른 색
const PASTEL_TINTS = [
  '#E8F0FE', '#FDECEC', '#E7F6EE', '#EAF3FB', '#EEF1F6',
  '#F1ECFB', '#FDF2E6', '#FBECF3', '#EAF7F7', '#F3F0E8',
];
// 키워드 매칭 안 될 때 시도별로 돌려 쓰는 아이콘 풀
const GENERIC_ICONS = ['🏙️', '🌆', '🏘️', '🏞️', '🌳', '🛣️', '🗺️', '📍'];

function hashCode(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return h;
}

export function regionTint(sidoCode: string): string {
  return PASTEL_TINTS[hashCode(sidoCode) % PASTEL_TINTS.length];
}

// 검색 결과 아이콘 — 지역명 키워드 우선, 없으면 시도별 아이콘 풀에서 선택
export function regionIcon(label: string, sidoCode?: string): string {
  if (/해수욕장|해변|바다|항|포구|섬|호$/.test(label)) return '🏖️';
  if (/산|봉|계곡|군$|령|골/.test(label)) return '⛰️';
  if (/공항/.test(label)) return '✈️';
  if (/온천|스파/.test(label)) return '♨️';
  if (/궁|성|사$|능/.test(label)) return '🏯';
  if (/강|천$|호수|川/.test(label)) return '🏞️';
  if (/구$/.test(label)) return '🏙️';
  if (/시$/.test(label)) return '🌆';
  if (sidoCode) return GENERIC_ICONS[hashCode(label) % GENERIC_ICONS.length];
  return '📍';
}

// 질의어로 지역 검색. 공백 제거 후 부분일치, 최대 50개
export function searchRegions(query: string): RegionOption[] {
  const q = query.trim().replace(/\s/g, '');
  if (!q) return [];
  return SEARCH_INDEX.filter((r) => r.label.replace(/\s/g, '').includes(q)).slice(0, 50);
}
