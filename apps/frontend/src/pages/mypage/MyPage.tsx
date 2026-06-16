import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HostHeader } from '../../components/HostHeader';
import { Icon } from '../../shared/Icon';
import { won } from '../../shared/utils';

import listing1 from '../../assets/listing-1.png';
import listing2 from '../../assets/listing-2.png';
import listing3 from '../../assets/listing-3.png';

// ─── Types ────────────────────────────────────────────────────────────────────
type MyPageTab = 'profile' | 'trips' | 'connections';
type TripStatus = 'completed' | 'upcoming' | 'cancelled';

interface Trip {
  id: string;
  title: string;
  loc: string;
  img: string;
  checkin: string;
  checkout: string;
  nights: number;
  price: number;
  status: TripStatus;
  hostName: string;
  rated: boolean;
}

interface Connection {
  id: string;
  name: string;
  initial: string;
  trips: number;
  listing: string;
  location: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ME = { name: '지수', initial: '지', role: '게스트', joined: '2021년 3월' };

const MY_TRIPS: Trip[] = [
  {
    id: '1',
    title: 'Spacious and Comfortable cozy house #4',
    loc: '서초구, 서울',
    img: listing1,
    checkin: '2021-05-17',
    checkout: '2021-05-20',
    nights: 3,
    price: 263859,
    status: 'completed',
    hostName: '김민수',
    rated: true,
  },
  {
    id: '2',
    title: '#자가격리 #공부 #강남 #선릉역3분',
    loc: '강남구, 서울',
    img: listing2,
    checkin: '2021-06-10',
    checkout: '2021-06-12',
    nights: 2,
    price: 219522,
    status: 'completed',
    hostName: '최수현',
    rated: false,
  },
  {
    id: '3',
    title: '[장기 임대 할인] 강남 양재천 실평수 30평',
    loc: '서초구, 서울',
    img: listing3,
    checkin: '2021-07-01',
    checkout: '2021-07-03',
    nights: 2,
    price: 237254,
    status: 'upcoming',
    hostName: '임성민',
    rated: false,
  },
];

const MY_CONNECTIONS: Connection[] = [
  { id: '1', name: '김민수', initial: '김', trips: 1, listing: 'Spacious and Comfortable cozy house #4', location: '서울' },
  { id: '2', name: '최수현', initial: '최', trips: 1, listing: '#자가격리 #공부 #강남 #선릉역3분', location: '서울' },
  { id: '3', name: '임성민', initial: '임', trips: 1, listing: '[장기 임대 할인] 강남 양재천 실평수 30평', location: '서울' },
];

const NAV_ITEMS: { key: MyPageTab; label: string }[] = [
  { key: 'profile', label: '자기소개' },
  { key: 'trips', label: '이전 여행' },
  { key: 'connections', label: '인연' },
];

// ─── Root Component ───────────────────────────────────────────────────────────
export function MyPage() {
  const navigate = useNavigate();
  const onLogo = () => navigate('/');
  const onHosting = () => navigate('/host');
  const onWishlists = () => navigate('/wishlists');
  const [tab, setTab] = useState<MyPageTab>('profile');

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <HostHeader
        onLogo={onLogo}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onHosting}
              style={{
                background: 'none', border: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-1)', cursor: 'pointer', padding: '0 8px',
              }}
            >
              호스팅 하기
            </button>
            <button
              onClick={onWishlists}
              style={{
                height: 40, padding: '0 18px', borderRadius: 10,
                border: '1px solid var(--line-strong)', background: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-2)', cursor: 'pointer',
              }}
            >
              위시리스트
            </button>
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

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: 370,
          padding: '64px 56px 80px 80px',
          borderRight: '1px solid var(--line)',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 700,
            color: 'var(--ink-1)',
            marginBottom: 32,
          }}>
            프로필
          </h1>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map(item => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: 'none',
                    background: active ? 'var(--surface-alt-2)' : 'transparent',
                    fontFamily: 'var(--font-sans)', fontSize: 16,
                    fontWeight: active ? 700 : 500,
                    color: 'var(--ink-1)', cursor: 'pointer', textAlign: 'left',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-alt-2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <NavIcon tabKey={item.key} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: '64px 80px 100px' }}>
          {tab === 'profile'     && <ProfileTab />}
          {tab === 'trips'       && <TripsTab />}
          {tab === 'connections' && <ConnectionsTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar Icon ─────────────────────────────────────────────────────────────
function NavIcon({ tabKey }: { tabKey: MyPageTab }) {
  if (tabKey === 'profile') {
    return (
      <span style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'var(--brand-coral-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color: 'var(--brand-coral)',
        flexShrink: 0,
      }}>
        {ME.initial}
      </span>
    );
  }
  return (
    <span style={{
      width: 38, height: 38, borderRadius: '50%',
      background: 'var(--surface-alt-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon
        name={tabKey === 'trips' ? 'briefcase' : 'users'}
        size={18}
        color="var(--ink-2)"
      />
    </span>
  );
}

// ─── 자기소개 Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink-1)' }}>
          자기소개
        </h2>
        <button
          onClick={() => setEditing(v => !v)}
          style={{
            padding: '7px 20px', borderRadius: 8,
            border: '1px solid var(--ink-1)', background: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
            color: 'var(--ink-1)', cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          수정
        </button>
      </div>

      {/* Profile card */}
      <div style={{
        display: 'flex',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 36,
      }}>
        {/* Left: avatar block */}
        <div style={{
          width: 260, flexShrink: 0,
          padding: '52px 32px',
          borderRight: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--brand-coral-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, fontWeight: 700, color: 'var(--brand-coral)',
            marginBottom: 18,
          }}>
            {ME.initial}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 5 }}>
            {ME.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>{ME.role}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 6 }}>
            가입일 {ME.joined}
          </div>
        </div>

        {/* Right: completion CTA or bio editor */}
        <div style={{ flex: 1, padding: '52px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {editing ? (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--ink-1)' }}>
                자기소개 작성
              </h3>
              <textarea
                className="host-input"
                placeholder="여행을 좋아하시나요? 나를 소개해보세요."
                value={bio}
                onChange={e => setBio(e.target.value)}
                style={{
                  height: 'auto', minHeight: 120, padding: '14px 16px',
                  resize: 'vertical', lineHeight: 1.7, fontSize: 14,
                }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: 'var(--cta-dark)', color: '#fff',
                    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  저장
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    border: '1px solid var(--line-strong)', background: '#fff',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              </div>
            </>
          ) : bio ? (
            <>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 8 }}>자기소개</div>
              <p style={{ fontSize: 16, color: 'var(--ink-1)', lineHeight: 1.8 }}>{bio}</p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 14 }}>
                프로필 작성 완료하기
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.8, marginBottom: 28 }}>
                프로필은 에어비앤비를 통한 예약 과정에서 중요한 역할을 합니다.
                다른 호스트와 게스트에게 나를 알릴 수 있도록 프로필 작성을 완료해 주세요.
              </p>
              <button
                onClick={() => setEditing(true)}
                style={{
                  alignSelf: 'flex-start',
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'var(--brand-coral)', color: '#fff',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', transition: 'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-coral-press)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand-coral)')}
              >
                시작하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reviews link */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', color: 'var(--ink-1)',
          }}
        >
          <Icon name="message-circle" size={22} color="var(--ink-1)" />
          <span style={{
            fontSize: 16, fontWeight: 600,
            textDecoration: 'underline', textDecorationColor: 'var(--ink-4)',
          }}>
            내가 작성한 후기 보기
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 이전 여행 Tab ─────────────────────────────────────────────────────────────
function TripsTab() {
  const completed = MY_TRIPS.filter(t => t.status === 'completed').length;
  const upcoming = MY_TRIPS.filter(t => t.status === 'upcoming').length;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
        이전 여행
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 36 }}>
        완료된 여행 {completed}건 · 예정된 여행 {upcoming}건
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {MY_TRIPS.map((trip, i) => (
          <TripCard key={trip.id} trip={trip} last={i === MY_TRIPS.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TripCard({ trip, last }: { trip: Trip; last: boolean }) {
  const STATUS_CFG: Record<TripStatus, { label: string; color: string; bg: string }> = {
    completed: { label: '완료',  color: '#118917', bg: '#F0FFF1' },
    upcoming:  { label: '예정',  color: '#4A7CF6', bg: '#EEF2FF' },
    cancelled: { label: '취소',  color: '#828282', bg: '#F5F5F5' },
  };
  const sc = STATUS_CFG[trip.status];

  return (
    <div style={{
      display: 'flex', gap: 24,
      padding: '28px 0',
      borderBottom: last ? 'none' : '1px solid var(--line)',
    }}>
      <img
        src={trip.img}
        alt={trip.title}
        style={{
          width: 200, height: 140, borderRadius: 14,
          objectFit: 'cover', flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 5 }}>{trip.loc}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', lineHeight: 1.3 }}>
                {trip.title}
              </div>
            </div>
            <span style={{
              padding: '4px 13px', borderRadius: 30, fontSize: 12, fontWeight: 700,
              color: sc.color, background: sc.bg, flexShrink: 0, marginLeft: 16,
            }}>
              {sc.label}
            </span>
          </div>

          {/* Meta */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: 14, color: 'var(--ink-3)', marginTop: 12,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="clock" size={14} color="var(--ink-4)" />
              {trip.checkin} ~ {trip.checkout} · {trip.nights}박
            </span>
            <span>호스트: <b style={{ color: 'var(--ink-2)' }}>{trip.hostName}</b></span>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>{won(trip.price)}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 5 }}>총액</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {trip.status === 'completed' && !trip.rated && (
              <button style={{
                padding: '8px 20px', borderRadius: 9,
                border: '1px solid var(--ink-1)', background: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                color: 'var(--ink-1)', cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                후기 작성
              </button>
            )}
            {trip.status === 'completed' && trip.rated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--ink-3)' }}>
                <Icon name="star" size={14} color="var(--star)" fill="var(--star)" />
                후기 작성 완료
              </div>
            )}
            {trip.status === 'upcoming' && (
              <button style={{
                padding: '8px 20px', borderRadius: 9,
                border: 'none', background: 'var(--cta-dark)',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
                color: '#fff', cursor: 'pointer',
              }}>
                예약 상세
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 인연 Tab ─────────────────────────────────────────────────────────────────
function ConnectionsTab() {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
        인연
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 36 }}>
        함께한 호스트 {MY_CONNECTIONS.length}명
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {MY_CONNECTIONS.map(c => <ConnectionCard key={c.id} conn={c} />)}
      </div>
    </div>
  );
}

function ConnectionCard({ conn }: { conn: Connection }) {
  return (
    <div
      style={{
        border: '1px solid var(--line)', borderRadius: 18,
        padding: '36px 24px 28px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'box-shadow 160ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Avatar */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--surface-alt-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, color: 'var(--ink-2)',
        margin: '0 auto 16px',
      }}>
        {conn.initial}
      </div>

      {/* Name */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 8 }}>
        {conn.name}
      </div>

      {/* Role badge */}
      <span style={{
        display: 'inline-block',
        padding: '4px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700,
        color: '#E84C60', background: '#FDEBEE',
        marginBottom: 16,
      }}>
        호스트
      </span>

      {/* Listing */}
      <div style={{
        fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5,
        marginBottom: 10,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {conn.listing}
      </div>

      {/* Stats */}
      <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
        {conn.location} · {conn.trips}번 함께한 여행
      </div>

      {/* Message button */}
      <button style={{
        marginTop: 20, width: '100%', height: 40, borderRadius: 10,
        border: '1px solid var(--line-strong)', background: '#fff',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        color: 'var(--ink-1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'background 120ms ease',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
      >
        <Icon name="message-circle" size={15} color="var(--ink-2)" />
        메시지 보내기
      </button>
    </div>
  );
}
