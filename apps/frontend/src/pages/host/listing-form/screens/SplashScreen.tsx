import step1 from '../../../../assets/listing-step/step-1.png';
import step2 from '../../../../assets/listing-step/step-2.png';
import step3 from '../../../../assets/listing-step/step-3.png';

const STEPS = [
  {
    img: step1,
    title: '숙소 정보 입력',
    desc: '위치와 수용 인원 등 기본 정보를 알려주세요.',
  },
  {
    img: step2,
    title: '돋보이게 만들기',
    desc: '사진 5장 이상과 제목·설명을 추가하세요.',
  },
  {
    img: step3,
    title: '등록 완료 및 게시',
    desc: '요금을 정하고 세부 정보를 확인한 뒤 게시하세요.',
  },
];

export function SplashScreen() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 72,
        alignItems: 'center',
        maxWidth: 1080,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.15,
        }}
      >
        에어비앤비로 손쉽게
        <br />
        시작하세요
      </h1>

      <div>
        {STEPS.map((s, i) => (
          <div key={s.title}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', padding: '20px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, width: 16 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                  {s.desc}
                </div>
              </div>
              <img
                src={s.img}
                alt=""
                style={{ width: 150, height: 150, objectFit: 'contain', flexShrink: 0 }}
              />
            </div>
            {i < STEPS.length - 1 && <div style={{ height: 1, background: 'var(--line)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
