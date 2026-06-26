import { Icon } from '../../shared/Icon';

interface DetailThingsToKnowProps {
  checkIn: string | null; // yyyy-MM-dd. 없으면 데모로 내일 기준
  maxGuests?: number;
}

function fmt(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 레퍼런스: "알아두어야 할 사항" 3열 (환불 정책/이용규칙/안전)
export function DetailThingsToKnow({ checkIn, maxGuests = 4 }: DetailThingsToKnowProps) {
  // 환불 정책: 체크인 전날까지 무료 취소 (체크인 미선택 시 데모로 내일을 체크인으로)
  const checkInDate = checkIn ? new Date(checkIn) : new Date(Date.now() + 86400000);
  const prevDay = new Date(checkInDate.getTime() - 86400000);

  return (
    <div style={{ padding: '40px 0 8px', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 28 }}>알아두어야 할 사항</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
        <Column
          icon="calendar-x"
          title="환불 정책"
          lines={[
            `${fmt(prevDay)} 오후 3:00 전까지 무료 취소가 가능합니다.`,
            `${fmt(checkInDate)} 체크인 전에 취소하면 부분 환불을 받으실 수 있습니다.`,
            '자세한 내용은 호스트의 환불 정책 전문을 참고하세요.',
          ]}
        />
        <Column
          icon="door-open"
          title="숙소 이용규칙"
          lines={['체크인 가능 시간: 오후 3:00 이후', `게스트 정원 ${maxGuests}명`]}
        />
        <Column
          icon="shield"
          title="안전 및 공간"
          lines={['일산화탄소 경보기 설치 여부 정보 없음', '부지 내 실외 보안 카메라', '화재경보기']}
        />
      </div>
    </div>
  );
}

function Column({ icon, title, lines }: { icon: string; title: string; lines: string[] }) {
  return (
    <div>
      <Icon name={icon} size={28} color="var(--ink-1)" />
      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>{title}</div>
      {lines.map((t, i) => (
        <div key={i} style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {t}
        </div>
      ))}
      <button
        style={{
          marginTop: 8,
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--ink-1)',
          textDecoration: 'underline',
        }}
      >
        자세히 알아보기
      </button>
    </div>
  );
}
