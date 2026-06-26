import { listingImage } from '../../reservation/utils';

export function won(amount: number | undefined): string {
  if (amount == null) return '₩0';
  return `₩${Number(amount).toLocaleString('ko-KR')}`;
}

interface CancelSummaryCardProps {
  img: string;
  title: string;
  hostName: string;
  dateRange: string;
  guests: string;
  total: number | undefined;
  refund: number | undefined;
}

export function CancelSummaryCard({
  img,
  title,
  hostName,
  dateRange,
  guests,
  total,
  refund,
}: CancelSummaryCardProps) {
  return (
    <aside
      style={{
        position: 'sticky',
        top: 104,
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-md)',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', gap: 14 }}>
        <img
          src={listingImage(img)}
          alt={title}
          style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>집 전체</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>호스트 {hostName}님</div>
        </div>
      </div>

      <Divider />

      <Row label="날짜" value={dateRange} />
      <Row label="게스트" value={guests} />

      <Divider />

      <Row label="기존 총액" value={won(total)} />
      <Row label="결제 금액" value={won(total)} />
      <Row label="총 환불액" value={won(refund)} bold />

      <Divider />

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>취소 정책</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        전액 환불: 결제하신 금액의 100%를 돌려받습니다.
      </div>
    </aside>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 10 }}>
      <span style={{ color: bold ? 'var(--ink-1)' : 'var(--ink-2)', fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '18px 0' }} />;
}
