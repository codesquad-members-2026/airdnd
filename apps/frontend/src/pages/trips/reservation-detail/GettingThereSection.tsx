import { Section, ExpandableText, LinkRow } from './primitives';

export function GettingThereSection({ address }: { address: string }) {
  return (
    <Section title="찾아가는 길" id="getting-there">
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 22 }}>{address}</div>

      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>호스트가 알려주는 길</div>
      <ExpandableText text="정구바투의 ATM에서 사원이 나올 때까지 큰길을 따라가다가 T자 갈림길에서 좌회전하세요. 분홍색 표지판이 있는 호랑이 조각상 오른쪽으로 50m 걸어오시면 됩니다." />

      <div style={{ marginTop: 12 }}>
        <LinkRow icon="image" label="주소 복사" />
        <LinkRow icon="map-pin" label="길찾기" />
      </div>

      <div style={{ marginTop: 36 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>체크인</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>들어가는 방법</div>
        <div style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 4 }}>
          체크인 48시간 전에 입장 방법을 여기에서 안내해 드립니다.
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>와이파이</div>
        <div style={{ fontSize: 15, color: 'var(--ink-3)' }}>
          와이파이 로그인 정보가 체크인 48시간 전에 여기에 표시됩니다.
        </div>
      </div>
    </Section>
  );
}
