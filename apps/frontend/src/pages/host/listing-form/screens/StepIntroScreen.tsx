import intro1 from '../../../../assets/listing-step/intro-1.png';
import intro2 from '../../../../assets/listing-step/intro-2.png';
import intro3 from '../../../../assets/listing-step/intro-3.png';

const PHASE_CONTENT: Record<number, { img: string; title: string; desc: string }> = {
  1: {
    img: intro1,
    title: '숙소에 대해 알려주세요',
    desc: '이 단계에서는 숙소 유형과 게스트가 예약할 공간, 위치, 수용 인원을 입력합니다.',
  },
  2: {
    img: intro2,
    title: '숙소를 돋보이게 만들기',
    desc: '편의시설과 사진 5장 이상, 그리고 제목과 설명을 추가합니다.',
  },
  3: {
    img: intro3,
    title: '등록 마무리 및 게시',
    desc: '요금을 설정하고 세부 정보를 확인한 뒤 숙소를 게시합니다.',
  },
};

export function StepIntroScreen({ phase }: { phase: number }) {
  const c = PHASE_CONTENT[phase];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr',
        gap: 56,
        alignItems: 'center',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 16 }}>
          {phase}단계
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.15,
          }}
        >
          {c.title}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-3)', marginTop: 20, lineHeight: 1.6 }}>
          {c.desc}
        </p>
      </div>

      <img
        src={c.img}
        alt=""
        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain' }}
      />
    </div>
  );
}
