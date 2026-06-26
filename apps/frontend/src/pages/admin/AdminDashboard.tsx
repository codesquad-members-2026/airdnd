import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HostHeader } from '../../components/HostHeader';
import { Icon } from '../../shared/Icon';
import { won } from '../../shared/utils';

// ─── Local Types ──────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'users' | 'listings' | 'reservations';
type UserRole = 'guest' | 'host' | 'admin';
type UserStatus = 'active' | 'suspended';
type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  status: UserStatus;
}

interface AdminReservation {
  id: string;
  guestName: string;
  listingTitle: string;
  listingLoc: string;
  checkin: string;
  checkout: string;
  nights: number;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
}

interface AdminListing {
  id: string;
  title: string;
  loc: string;
  hostName: string;
  price: number;
  roomType: string;
  active: boolean;
  rating: number;
  reviews: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: '1', name: '김민수', email: 'minsoo.kim@gmail.com', role: 'host', joinedAt: '2021-03-12', status: 'active' },
  { id: '2', name: '이지영', email: 'jiyoung.lee@naver.com', role: 'guest', joinedAt: '2021-05-20', status: 'active' },
  { id: '3', name: '박준혁', email: 'junhyuk.park@kakao.com', role: 'guest', joinedAt: '2021-06-01', status: 'active' },
  { id: '4', name: '최수현', email: 'soohyun.choi@gmail.com', role: 'host', joinedAt: '2021-02-14', status: 'active' },
  { id: '5', name: '정도윤', email: 'doyoon.jung@daum.net', role: 'guest', joinedAt: '2021-07-08', status: 'suspended' },
  { id: '6', name: '홍길동', email: 'gildong.hong@gmail.com', role: 'admin', joinedAt: '2021-01-01', status: 'active' },
  { id: '7', name: '강예린', email: 'yerin.kang@naver.com', role: 'guest', joinedAt: '2021-08-15', status: 'active' },
  { id: '8', name: '임성민', email: 'sungmin.lim@gmail.com', role: 'host', joinedAt: '2021-04-22', status: 'active' },
];

const MOCK_RESERVATIONS: AdminReservation[] = [
  { id: 'RES-001', guestName: '이지영', listingTitle: 'Spacious and Comfortable cozy house #4', listingLoc: '서초구, 서울', checkin: '2021-05-17', checkout: '2021-05-20', nights: 3, totalPrice: 263859, status: 'confirmed', createdAt: '2021-05-10' },
  { id: 'RES-002', guestName: '박준혁', listingTitle: '#자가격리 #공부 #강남 #선릉역3분', listingLoc: '강남구, 서울', checkin: '2021-06-01', checkout: '2021-06-05', nights: 4, totalPrice: 402380, status: 'pending', createdAt: '2021-05-25' },
  { id: 'RES-003', guestName: '정도윤', listingTitle: '[장기 임대 할인] 강남 양재천 실평수 30평', listingLoc: '서초구, 서울', checkin: '2021-05-10', checkout: '2021-05-15', nights: 5, totalPrice: 609630, status: 'completed', createdAt: '2021-05-02' },
  { id: 'RES-004', guestName: '강예린', listingTitle: '#자가격리 #역삼역1분 #파티 #삼성', listingLoc: '강남구, 서울', checkin: '2021-06-10', checkout: '2021-06-12', nights: 2, totalPrice: 219522, status: 'confirmed', createdAt: '2021-06-01' },
  { id: 'RES-005', guestName: '이지영', listingTitle: '[장기 임대 할인] 강남 양재천 실평수 30평', listingLoc: '서초구, 서울', checkin: '2021-04-20', checkout: '2021-04-23', nights: 3, totalPrice: 362378, status: 'cancelled', createdAt: '2021-04-15' },
  { id: 'RES-006', guestName: '박준혁', listingTitle: 'Spacious and Comfortable cozy house #4', listingLoc: '서초구, 서울', checkin: '2021-07-01', checkout: '2021-07-03', nights: 2, totalPrice: 175906, status: 'pending', createdAt: '2021-06-20' },
];

const MOCK_ADMIN_LISTINGS: AdminListing[] = [
  { id: '1', title: 'Spacious and Comfortable cozy house #4', loc: '서초구, 서울', hostName: '김민수', price: 82953, roomType: '집 전체', active: true, rating: 4.8, reviews: 127 },
  { id: '2', title: '#자가격리 #공부 #강남 #선릉역3분', loc: '강남구, 서울', hostName: '최수현', price: 96095, roomType: '집 전체', active: false, rating: 4.92, reviews: 88 },
  { id: '3', title: '#자가격리 #역삼역1분 #파티 #삼성', loc: '강남구, 서울', hostName: '최수현', price: 105260, roomType: '집 전체', active: true, rating: 4.75, reviews: 64 },
  { id: '4', title: '[장기 임대 할인] 강남 양재천 실평수 30평', loc: '서초구, 서울', hostName: '임성민', price: 115126, roomType: '집 전체', active: true, rating: 4.88, reviews: 203 },
  { id: '5', title: '한강뷰 아파트 프리미엄 스위트', loc: '마포구, 서울', hostName: '임성민', price: 145000, roomType: '집 전체', active: true, rating: 4.95, reviews: 52 },
  { id: '6', title: '홍대 감성 독채 게스트하우스', loc: '마포구, 서울', hostName: '김민수', price: 67000, roomType: '개인실', active: false, rating: 4.6, reviews: 31 },
];

const STAT_CARDS = [
  { label: '총 사용자', value: '156', unit: '명', icon: 'users', iconColor: '#4A7CF6', iconBg: '#EEF2FF', trend: '+12%', trendUp: true },
  { label: '총 숙소', value: '42', unit: '개', icon: 'building-2', iconColor: '#E84C60', iconBg: '#FDEBEE', trend: '+5%', trendUp: true },
  { label: '이번 달 예약', value: '89', unit: '건', icon: 'calendar-check', iconColor: '#118917', iconBg: '#F0FFF1', trend: '+23%', trendUp: true },
  { label: '이번 달 매출', value: won(28450000), unit: '', icon: 'trending-up', iconColor: '#F59E0B', iconBg: '#FFFBEB', trend: '+18%', trendUp: true },
];

const NAV_ITEMS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'overview', label: '대시보드', icon: 'layout-dashboard' },
  { key: 'users', label: '사용자 관리', icon: 'users' },
  { key: 'listings', label: '숙소 관리', icon: 'building-2' },
  { key: 'reservations', label: '예약 관리', icon: 'calendar-check' },
];

// ─── Root Component ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const onLogo = () => navigate('/');
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [listings, setListings] = useState<AdminListing[]>(MOCK_ADMIN_LISTINGS);

  function toggleUserStatus(id: string) {
    setUsers(prev =>
      prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u)
    );
  }

  function toggleListingActive(id: string) {
    setListings(prev =>
      prev.map(l => l.id === id ? { ...l, active: !l.active } : l)
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-alt)' }}>
      <HostHeader
        title="관리자 대시보드"
        onLogo={onLogo}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 30,
              background: '#FFFBEB', color: '#F59E0B',
              fontSize: 12, fontWeight: 700,
            }}>
              <Icon name="shield" size={13} color="#F59E0B" />
              관리자
            </span>
            <button
              onClick={onLogo}
              style={{
                height: 40, padding: '0 18px', borderRadius: 10,
                border: '1px solid var(--line-strong)', background: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-2)', cursor: 'pointer',
              }}
            >
              홈으로
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: 220,
          background: '#fff',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <nav style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: 'none', background: active ? 'var(--brand-coral-tint)' : 'transparent',
                    color: active ? 'var(--brand-coral)' : 'var(--ink-2)',
                    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'var(--surface-alt-2)';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon name={item.icon} size={17} color={active ? 'var(--brand-coral)' : 'var(--ink-3)'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar bottom stats */}
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              빠른 현황
            </div>
            {[
              { label: '활성 숙소', value: `${listings.filter(l => l.active).length}개` },
              { label: '대기 예약', value: `${MOCK_RESERVATIONS.filter(r => r.status === 'pending').length}건` },
              { label: '정지 계정', value: `${users.filter(u => u.status === 'suspended').length}명` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-1)' }}>{value}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 80px' }}>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'users' && <UsersTab users={users} onToggleStatus={toggleUserStatus} />}
          {tab === 'listings' && <ListingsTab listings={listings} onToggleActive={toggleListingActive} />}
          {tab === 'reservations' && <ReservationsTab reservations={MOCK_RESERVATIONS} />}
        </main>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <div>
      <PageHeader title="대시보드" sub="airdnd 서비스 전체 현황입니다." />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{
            background: '#fff', borderRadius: 16, padding: '22px 24px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line-soft)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={card.icon} size={20} color={card.iconColor} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                color: card.trendUp ? '#118917' : '#E84C60',
                background: card.trendUp ? '#F0FFF1' : '#FDEBEE',
              }}>
                {card.trend}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', fontFamily: 'var(--font-display)' }}>
              {card.value}
              {card.unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', marginLeft: 4 }}>{card.unit}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Reservations + Recent Users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Reservations */}
        <Card title="최근 예약" action={<TabAction label="전체 보기" />}>
          <div>
            {MOCK_RESERVATIONS.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--surface-alt-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-2)',
                }}>
                  {r.guestName.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>
                    {r.guestName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.listingTitle}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 4 }}>
                    {won(r.totalPrice)}
                  </div>
                  <ReservationBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Users */}
        <Card title="최근 가입" action={<TabAction label="전체 보기" />}>
          <div>
            {MOCK_USERS.slice(0, 5).map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--surface-alt-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-2)',
                }}>
                  {u.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <RoleBadge role={u.role} />
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{u.joinedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, onToggleStatus }: { users: AdminUser[]; onToggleStatus: (id: string) => void }) {
  const [filter, setFilter] = useState<UserRole | 'all'>('all');

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div>
      <PageHeader title="사용자 관리" sub={`총 ${users.length}명의 사용자가 등록되어 있습니다.`} />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'guest', 'host', 'admin'] as const).map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            style={{
              padding: '7px 16px', borderRadius: 30,
              border: `1px solid ${filter === role ? 'var(--ink-1)' : 'var(--line-strong)'}`,
              background: filter === role ? 'var(--ink-1)' : '#fff',
              color: filter === role ? '#fff' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {role === 'all' ? '전체' : role === 'guest' ? '게스트' : role === 'host' ? '호스트' : '관리자'}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {role === 'all' ? users.length : users.filter(u => u.role === role).length}
            </span>
          </button>
        ))}
      </div>

      <TableCard>
        <TableHeader cols="2fr 2.5fr 1fr 1.2fr 1fr 1fr">
          <span>이름</span>
          <span>이메일</span>
          <span>역할</span>
          <span>가입일</span>
          <span>상태</span>
          <span>액션</span>
        </TableHeader>
        {filtered.map((u, i) => (
          <TableRow key={u.id} cols="2fr 2.5fr 1fr 1.2fr 1fr 1fr" last={i === filtered.length - 1}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--surface-alt-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', flexShrink: 0,
              }}>
                {u.name.charAt(0)}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{u.name}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{u.email}</span>
            <span><RoleBadge role={u.role} /></span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{u.joinedAt}</span>
            <span><UserStatusBadge status={u.status} /></span>
            <div>
              <button
                onClick={() => onToggleStatus(u.id)}
                disabled={u.role === 'admin'}
                style={{
                  padding: '5px 12px', borderRadius: 7,
                  border: '1px solid var(--line-strong)', background: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  color: u.status === 'active' ? '#E84C60' : '#118917',
                  cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                  opacity: u.role === 'admin' ? 0.4 : 1,
                  transition: 'all 120ms ease',
                }}
              >
                {u.status === 'active' ? '정지' : '복구'}
              </button>
            </div>
          </TableRow>
        ))}
      </TableCard>
    </div>
  );
}

// ─── Listings Tab ─────────────────────────────────────────────────────────────
function ListingsTab({ listings, onToggleActive }: { listings: AdminListing[]; onToggleActive: (id: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = filter === 'all' ? listings
    : filter === 'active' ? listings.filter(l => l.active)
    : listings.filter(l => !l.active);

  return (
    <div>
      <PageHeader title="숙소 관리" sub={`총 ${listings.length}개의 숙소가 등록되어 있습니다.`} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['all', '전체', listings.length], ['active', '활성', listings.filter(l => l.active).length], ['inactive', '비활성', listings.filter(l => !l.active).length]] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '7px 16px', borderRadius: 30,
              border: `1px solid ${filter === key ? 'var(--ink-1)' : 'var(--line-strong)'}`,
              background: filter === key ? 'var(--ink-1)' : '#fff',
              color: filter === key ? '#fff' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {label}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>{count}</span>
          </button>
        ))}
      </div>

      <TableCard>
        <TableHeader cols="2.5fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr">
          <span>숙소명</span>
          <span>지역</span>
          <span>호스트</span>
          <span>요금/박</span>
          <span>평점</span>
          <span>상태</span>
          <span>액션</span>
        </TableHeader>
        {filtered.map((l, i) => (
          <TableRow key={l.id} cols="2.5fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr" last={i === filtered.length - 1}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2, lineHeight: 1.4 }}>
                {l.title.length > 28 ? l.title.slice(0, 28) + '…' : l.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{l.roomType}</div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{l.loc}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{l.hostName}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{won(l.price)}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>
              <Icon name="star" size={13} color="var(--star)" fill="var(--star)" />
              {' '}{l.rating}
              <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}> ({l.reviews})</span>
            </span>
            <span>
              <span style={{
                padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 700,
                background: l.active ? '#F0FFF1' : 'var(--surface-alt-2)',
                color: l.active ? '#118917' : 'var(--ink-3)',
              }}>
                {l.active ? '활성' : '비활성'}
              </span>
            </span>
            <div>
              <button
                onClick={() => onToggleActive(l.id)}
                style={{
                  padding: '5px 12px', borderRadius: 7,
                  border: '1px solid var(--line-strong)', background: '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  color: l.active ? '#E84C60' : '#118917',
                  cursor: 'pointer', transition: 'all 120ms ease',
                }}
              >
                {l.active ? '비활성화' : '활성화'}
              </button>
            </div>
          </TableRow>
        ))}
      </TableCard>
    </div>
  );
}

// ─── Reservations Tab ─────────────────────────────────────────────────────────
function ReservationsTab({ reservations }: { reservations: AdminReservation[] }) {
  const [filter, setFilter] = useState<ReservationStatus | 'all'>('all');

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const statusOptions: [ReservationStatus | 'all', string][] = [
    ['all', '전체'],
    ['pending', '대기중'],
    ['confirmed', '확정'],
    ['completed', '완료'],
    ['cancelled', '취소'],
  ];

  return (
    <div>
      <PageHeader title="예약 관리" sub={`총 ${reservations.length}건의 예약이 있습니다.`} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {statusOptions.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '7px 16px', borderRadius: 30,
              border: `1px solid ${filter === key ? 'var(--ink-1)' : 'var(--line-strong)'}`,
              background: filter === key ? 'var(--ink-1)' : '#fff',
              color: filter === key ? '#fff' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {label}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {key === 'all' ? reservations.length : reservations.filter(r => r.status === key).length}
            </span>
          </button>
        ))}
      </div>

      <TableCard>
        <TableHeader cols="1fr 1.2fr 2fr 1.4fr 1fr 1fr">
          <span>예약 ID</span>
          <span>게스트</span>
          <span>숙소</span>
          <span>날짜</span>
          <span>금액</span>
          <span>상태</span>
        </TableHeader>
        {filtered.map((r, i) => (
          <TableRow key={r.id} cols="1fr 1.2fr 2fr 1.4fr 1fr 1fr" last={i === filtered.length - 1}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{r.id}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--surface-alt-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', flexShrink: 0,
              }}>
                {r.guestName.charAt(0)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{r.guestName}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 2 }}>
                {r.listingTitle.length > 26 ? r.listingTitle.slice(0, 26) + '…' : r.listingTitle}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r.listingLoc}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>{r.checkin} ~</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{r.checkout} <span style={{ color: 'var(--ink-4)' }}>({r.nights}박)</span></div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>{won(r.totalPrice)}</span>
            <span><ReservationBadge status={r.status} /></span>
          </TableRow>
        ))}
      </TableCard>
    </div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink-1)', marginBottom: 6 }}>
        {title}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>{sub}</p>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '24px',
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line-soft)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function TabAction({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 13, color: 'var(--brand-coral)', fontWeight: 600, cursor: 'pointer' }}>
      {label}
    </span>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line-soft)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function TableHeader({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols,
      padding: '12px 24px', background: 'var(--surface-alt)',
      borderBottom: '1px solid var(--line)',
      gap: 16,
    }}>
      {Array.isArray(children)
        ? children.map((child, i) => (
          <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {child}
          </div>
        ))
        : children}
    </div>
  );
}

function TableRow({ cols, last, children }: { cols: string; last: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols, padding: '16px 24px', gap: 16,
      borderBottom: last ? 'none' : '1px solid var(--line-soft)',
      alignItems: 'center',
      transition: 'background 100ms ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const cfg: Record<UserRole, { label: string; color: string; bg: string }> = {
    guest: { label: '게스트', color: '#4A7CF6', bg: '#EEF2FF' },
    host: { label: '호스트', color: '#E84C60', bg: '#FDEBEE' },
    admin: { label: '관리자', color: '#F59E0B', bg: '#FFFBEB' },
  };
  const c = cfg[role];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 700, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 700,
      color: status === 'active' ? '#118917' : '#E84C60',
      background: status === 'active' ? '#F0FFF1' : '#FDEBEE',
    }}>
      {status === 'active' ? '활성' : '정지'}
    </span>
  );
}

function ReservationBadge({ status }: { status: ReservationStatus }) {
  const cfg: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: '대기중', color: '#F59E0B', bg: '#FFFBEB' },
    confirmed: { label: '확정',   color: '#118917', bg: '#F0FFF1' },
    completed: { label: '완료',   color: '#4A7CF6', bg: '#EEF2FF' },
    cancelled: { label: '취소',   color: '#828282', bg: '#F5F5F5' },
  };
  const c = cfg[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 30, fontSize: 12, fontWeight: 700, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}
