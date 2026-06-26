import { Section, ExpandableText, InfoField, LinkRow } from './primitives';

interface HostSectionProps {
  hostName: string;
  hostProfileUrl?: string;
  amountPaid: string;
}

export function HostSection({ hostName, hostProfileUrl, amountPaid }: HostSectionProps) {
  return (
    <>
      <Section
        title={`호스트: ${hostName}님`}
        action={<HostAvatar hostName={hostName} hostProfileUrl={hostProfileUrl} />}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>호스트 소개</div>
        <ExpandableText text="저희 숙소는 응우라라이 공항에서 35km 떨어진 렘봉안 섬에 있습니다. 정구바투 항구·하버에서 걸어서 2분 거리이며, 합리적인 가격에 점심과 저녁을 즐길 수 있는 카페도 운영하고 있습니다." />

        <div style={{ marginTop: 12 }}>
          <LinkRow icon="message-circle" label="호스트에게 전화" />
          <LinkRow icon="book-open" label="호스트의 가이드북" />
        </div>
      </Section>

      <Section title="결제 정보">
        <InfoField label="결제 금액" value={amountPaid} />
        <LinkRow icon="credit-card" label="영수증 받기" />
      </Section>

      <Section title="지원">
        <LinkRow icon="message-circle" label="에어비앤비 지원팀에 문의하기" />
        <LinkRow icon="shield" label="도움말 센터 방문하기" />
      </Section>
    </>
  );
}

function HostAvatar({ hostName, hostProfileUrl }: { hostName: string; hostProfileUrl?: string }) {
  const size = 56;
  if (hostProfileUrl) {
    return (
      <img
        src={hostProfileUrl}
        alt={hostName}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'var(--ink-2)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {hostName.charAt(0).toUpperCase()}
    </div>
  );
}
