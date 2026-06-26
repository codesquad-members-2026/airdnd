import { Icon } from '../../shared/Icon';

interface DetailReviewsProps {
  reviews: number; // 총 후기 수(개요와 동일 값, 현재 목)
}

interface MockReview {
  name: string;
  meta: string;
  date: string;
  text: string;
  stars: number;
}

// 후기 목업
const MOCK_REVIEWS: MockReview[] = [
  { name: '현희', meta: '에어비앤비 가입 기간 5년', date: '2026년 2월', stars: 5, text: '4인 가족 잠시 여행 및 일정이 있어 홍대쪽에 왔어요. 이동 편하고요~~4인 가족 넉넉하게 푸욱 잘 자고 갑니다. 다음에 올 기회가 있다면 또 예약하겠습니다.' },
  { name: 'Sungmoon', meta: 'Tallahassee, 플로리다주', date: '2026년 1월', stars: 3, text: '장점: 위치 훌륭, 침대 깨끗하고 편했음. 안방에 햇볕이 잘 들고 아늑한 느낌. 단점: 첫날은 괜찮았으나 둘째날부터 화장실에서 하수구 냄새가 났습니다.' },
  { name: '태경', meta: '에어비앤비 가입 기간 4년', date: '2025년 12월', stars: 5, text: '홍대번화가 한복판이라 찾기도 쉽고 접근성도 좋았습니다. 숙소도 깨끗하고 방이 2개, 침대 3개인 점도 좋았습니다 ^^' },
  { name: '도영', meta: '에어비앤비 가입 기간 10년', date: '2025년 9월', stars: 5, text: '숙소가 예쁘고 깔끔하고 깨끗하게 준비되어 있어서 편안하게 잘 쉬었습니다. 원하는 곳 모두 도보로 이동 가능해서 위치도 너무 좋았고 세심하게 안내해 주셨어요.' },
  { name: '준서', meta: '에어비앤비 가입 기간 2년', date: '2025년 8월', stars: 4, text: '머물기 좋은 곳이에요. 깔끔하고 조용해서 휴식하기 딱 좋았습니다. 다음에 또 방문하고 싶어요.' },
  { name: 'Sena', meta: '에어비앤비 가입 기간 7개월', date: '2025년 7월', stars: 5, text: '숙소는 사진과 동일했고 교통이 편리했습니다. 근처 산책길이 있어 가볍게 산책하기도 넘 좋았습니다. 다음에도 이용하고 싶습니다. ^^' },
];

// 레퍼런스: 후기 2열 그리드 + 모두 보기
export function DetailReviews({ reviews }: DetailReviewsProps) {
  return (
    <div style={{ padding: '40px 0', borderTop: '1px solid var(--line)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 64,
          rowGap: 36,
        }}
      >
        {MOCK_REVIEWS.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>

      <button
        style={{
          marginTop: 40,
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
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        후기 {reviews}개 모두 보기
      </button>
    </div>
  );
}

function ReviewCard({ review }: { review: MockReview }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--ink-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="user" size={18} color="#fff" />
        </span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{review.name}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{review.meta}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', marginBottom: 6 }}>
        <span style={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon
              key={i}
              name="star"
              size={10}
              color="var(--ink-1)"
              fill={i < review.stars ? 'var(--ink-1)' : 'none'}
            />
          ))}
        </span>
        <span>·</span>
        <span>{review.date}</span>
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-1)', lineHeight: 1.6 }}>{review.text}</div>
    </div>
  );
}
