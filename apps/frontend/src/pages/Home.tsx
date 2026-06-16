import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { useAppState } from '../shared/AppState';

import heroImg from '../assets/hero-illustration.jpg';
import categoryNature from '../assets/category-nature.png';
import destSeoul from '../assets/dest-seoul.png';
import listing1 from '../assets/listing-1.png';
import listing2 from '../assets/listing-2.png';
import listing3 from '../assets/listing-3.png';
import listing4 from '../assets/listing-4.png';

const ASSET_MAP: Record<string, string> = {
  hero: heroImg,
  'category-nature': categoryNature,
  'dest-seoul': destSeoul,
  'listing-1': listing1,
  'listing-2': listing2,
  'listing-3': listing3,
  'listing-4': listing4,
};

const DESTS: [string, string, string][] = [
  ['서울', '차로 30분 거리', 'dest-seoul'],
  ['의정부시', '차로 30분 거리', 'listing-2'],
  ['대구', '차로 3.5시간 거리', 'listing-3'],
  ['대전', '차로 2시간 거리', 'listing-4'],
  ['광주', '차로 4시간 거리', 'listing-1'],
  ['수원시', '차로 45분 거리', 'listing-3'],
  ['울산', '차로 4.5시간 거리', 'listing-2'],
  ['부천시', '차로 45분 거리', 'listing-4'],
];

const CATS: [string, string][] = [
  ['자연생활을 만끽할 수 있는 숙소', 'category-nature'],
  ['독특한 공간', 'listing-2'],
  ['집 전체', 'listing-3'],
  ['반려동물 동반 가능', 'listing-4'],
];

const FOOTER_COLS: [string, string[]][] = [
  ['소개', ['이용 방법', '뉴스룸', '투자자 정보', '호텔투나잇', '비즈니스 프로그램', '채용정보']],
  ['커뮤니티', ['다양성 및 소속감', '접근성', '어소시에이트', '구호 인력을 위한 숙소', '게스트 추천']],
  ['호스팅하기', ['숙소 호스팅', '온라인 체험 호스팅하기', '체험 호스팅하기', '책임감 있는 호스팅', '호스트 추천', '자료 센터']],
  ['지원', ['코로나19 대응 방안', '도움말 센터', '예약 취소 옵션', '이웃 민원 지원', '신뢰와 안전']],
];

export function Home() {
  const navigate = useNavigate();
  const { search, setSearch } = useAppState();
  const onChange = setSearch;
  const onSearch = () => navigate('/results');
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: 640 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `url(${ASSET_MAP.hero}) center/cover`,
          }}
        />
        <Header mode="full" />
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <SearchBar value={search} onChange={onChange} onSearch={onSearch} />
        </div>
      </div>

      {/* Nearby destinations */}
      <Section title="가까운 여행지 둘러보기">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            rowGap: 28,
            columnGap: 24,
          }}
        >
          {DESTS.map(([name, dist, img]) => (
            <div
              key={name}
              className="dest"
              style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: `url(${ASSET_MAP[img]}) center/cover`,
                  flex: 'none',
                  transition: 'opacity 120ms ease',
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 4 }}>{dist}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Category cards */}
      <Section title="어디서나, 여행은 살아보는 거야!">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {CATS.map(([title, img]) => (
            <div
              key={title}
              className="cat-card"
              onClick={onSearch}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 10,
                  background: `url(${ASSET_MAP[img]}) center/cover`,
                  transition: 'opacity 120ms ease',
                }}
              />
              <div style={{ fontSize: 20, marginTop: 14 }}>{title}</div>
            </div>
          ))}
        </div>
      </Section>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '64px 80px 0' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 32,
          marginBottom: 32,
          lineHeight: 1.2,
          color: 'var(--black)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 80,
        background: 'var(--surface-footer)',
        padding: '64px 80px 40px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          paddingBottom: 40,
          borderBottom: '1px solid var(--line)',
        }}
      >
        {FOOTER_COLS.map(([heading, items]) => (
          <div key={heading}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>{heading}</div>
            {items.map((item) => (
              <div
                key={item}
                className="foot-link"
                style={{
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  padding: '7px 0',
                  cursor: 'pointer',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 13,
          color: 'var(--ink-3)',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink-1)' }}>
          air<span style={{ color: 'var(--brand-coral)' }}>dnd</span>
        </span>
        <span>© 2021 airdnd, Inc.</span>
        <span>· 개인정보처리방침 · 이용약관 · 회사 세부정보</span>
      </div>
    </footer>
  );
}
