import { useNavigate } from 'react-router-dom';
import { Section, ExpandableText, LinkRow } from './primitives';

const HOUSE_RULES = ['게스트 최대 2명', '반려동물 동반 불가', '파티나 행사 불가'];

export function RulesSection({ listingId }: { listingId?: number }) {
  const navigate = useNavigate();
  return (
    <Section title="이용 수칙">
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>숙소 이용 안내</div>
      <ExpandableText text="비밀번호는 와이파이마다 다릅니다. 물이 나오지 않으면 앞쪽에서 직원과 상의해 주세요. 가스를 함께 쓰기 때문에 가끔 가스가 떨어질 수 있으니 그럴 때도 직원에게 알려주세요." />

      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 12 }}>숙소 이용규칙</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {HOUSE_RULES.map(r => (
          <li key={r} style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 8 }}>
            {r}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        <LinkRow
          icon="building-2"
          label="숙소 보기"
          onClick={() => listingId != null && navigate(`/listings/${listingId}`)}
        />
      </div>

      {/* 여행자 보험 */}
      <div
        style={{
          marginTop: 32,
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>여행자 보험</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>₩20,000로 안심하세요</div>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 8 }}>
          질병, 항공편 지연 등으로 예약을 취소해도 환급받을 수 있습니다. 응급 상황 시 지원
          서비스도 제공됩니다.
        </p>
        <button
          style={{
            marginTop: 4,
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--ink-1)',
            textDecoration: 'underline',
          }}
        >
          보장 내용
        </button>
        <div>
          <button
            style={{
              marginTop: 20,
              border: 'none',
              borderRadius: 10,
              background: 'var(--ink-1)',
              color: '#fff',
              padding: '12px 22px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            여행에 추가
          </button>
        </div>
      </div>
    </Section>
  );
}
