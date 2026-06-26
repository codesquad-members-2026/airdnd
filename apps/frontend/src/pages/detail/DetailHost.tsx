import { Icon } from '../../shared/Icon';

interface DetailHostProps {
  hostName: string;
  rating: number; // 개요와 동일 값(현재 목)
  reviews: number;
  profileUrl?: string | null;
}

// 레퍼런스: "호스트 소개" — 프로필 카드 + 통계 + 소개/응대 정보
export function DetailHost({ hostName, rating, reviews, profileUrl }: DetailHostProps) {
  return (
    <div id="detail-host" style={{ padding: '40px 0', borderTop: '1px solid var(--line)', scrollMarginTop: 100 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>호스트 소개</h2>

      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 프로필 카드 */}
        <div
          style={{
            width: 360,
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: 24,
            border: '1px solid var(--line)',
            borderRadius: 20,
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            {/* 바깥 wrapper(overflow visible) — 원형 클립은 inner, 배지는 바깥에 */}
            <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto' }}>
              <span
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--ink-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {profileUrl ? (
                  <img src={profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="user" size={40} color="#fff" />
                )}
              </span>
              <span
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--brand-coral)',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={13} color="#fff" />
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>{hostName}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>슈퍼호스트</div>
          </div>

          <div style={{ flex: 1 }}>
            <HostStat value={String(reviews)} label="후기" />
            <Divider />
            <HostStat value={rating.toFixed(2)} label="평점" stars />
            <Divider />
            <HostStat value="5" label="호스팅 경력(년)" />
          </div>
        </div>

        {/* 소개 */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {hostName}님은 슈퍼호스트예요
          </div>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 20 }}>
            슈퍼호스트는 풍부한 경험과 높은 평점을 갖춘, 게스트에게 훌륭한 숙박을 제공하기 위해 노력하는 호스트예요.
          </p>

          <div style={{ fontSize: 15, marginBottom: 4 }}>
            <b>응답률</b> 100%
          </div>
          <div style={{ fontSize: 15, marginBottom: 20 }}>
            <b>응답 시간</b> 1시간 이내
          </div>

          <button
            style={{
              height: 48,
              padding: '0 24px',
              border: '1px solid var(--ink-1)',
              borderRadius: 10,
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--ink-1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            호스트에게 메시지 보내기
          </button>
        </div>
      </div>
    </div>
  );
}

function HostStat({ value, label, stars }: { value: string; label: string; stars?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
        {label}
        {stars && <Icon name="star" size={10} color="var(--ink-1)" fill="var(--ink-1)" />}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />;
}
