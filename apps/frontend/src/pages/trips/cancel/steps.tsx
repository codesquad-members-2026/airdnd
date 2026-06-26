import { useState, useRef, useEffect } from 'react';
import { Icon } from '../../../shared/Icon';
import { won } from './CancelSummaryCard';

export const CANCEL_REASONS = [
  { value: 'DATE_CHANGE', label: '여행 날짜·일정이 변경되었어요' },
  { value: 'CHEAPER', label: '더 좋은 숙소를 찾았어요' },
  { value: 'LISTING', label: '숙소가 마음에 들지 않아요' },
  { value: 'OTHER', label: '기타' },
];

const titleStyle = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, marginBottom: 28 } as const;

interface SelectReasonStepProps {
  reason: string;
  setReason: (v: string) => void;
  dateChoice: 'yes' | 'no' | null;
  setDateChoice: (v: 'yes' | 'no') => void;
}

export function SelectReasonStep({ reason, setReason, dateChoice, setDateChoice }: SelectReasonStepProps) {
  return (
    <div>
      <h1 style={titleStyle}>취소하시려는 이유가 무엇인가요?</h1>

      <ReasonDropdown reason={reason} setReason={setReason} />

      {reason === 'DATE_CHANGE' && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>날짜를 변경하시겠어요?</div>
          <div style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 6, marginBottom: 16 }}>
            취소 대신 호스트에게 예약 날짜 변경을 요청할 수 있어요.
          </div>
          <RadioRow
            label="네, 날짜를 변경할게요"
            checked={dateChoice === 'yes'}
            onClick={() => setDateChoice('yes')}
          />
          <RadioRow
            label="아니요, 계속 취소할게요"
            checked={dateChoice === 'no'}
            onClick={() => setDateChoice('no')}
          />
        </div>
      )}
    </div>
  );
}

function ReasonDropdown({ reason, setReason }: { reason: string; setReason: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CANCEL_REASONS.find(r => r.value === reason);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          height: 56,
          padding: '0 16px',
          borderRadius: 10,
          border: `1px solid ${open ? 'var(--ink-1)' : 'var(--line-strong)'}`,
          fontSize: 16,
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: selected ? 'var(--ink-1)' : 'var(--ink-3)',
        }}
      >
        {selected ? selected.label : '사유를 선택해주세요'}
        <Icon name="chevron-down" size={20} color="var(--ink-3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {CANCEL_REASONS.map(r => {
            const isSel = r.value === reason;
            return (
              <button
                key={r.value}
                onClick={() => {
                  setReason(r.value);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 16px',
                  border: 'none',
                  background: isSel ? 'var(--surface-alt-2)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 16,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = isSel ? 'var(--surface-alt-2)' : '#fff')}
              >
                {r.label}
                {isSel && <Icon name="check" size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RadioRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        padding: '12px 0',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${checked ? 'var(--ink-1)' : 'var(--line-strong)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {checked && (
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--ink-1)' }} />
        )}
      </span>
      <span style={{ fontSize: 16 }}>{label}</span>
    </button>
  );
}

export function ConfirmStep({
  total,
  refund,
}: {
  total: number | undefined;
  refund: number | undefined;
}) {
  return (
    <div>
      <h1 style={titleStyle}>취소 확인</h1>

      <div style={{ display: 'flex', gap: 64, marginBottom: 28 }}>
        <Amount label="결제하신 금액" value={won(total)} />
        <Amount label="환불 금액" value={won(refund)} />
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>환불 세부 정보</div>
        <RefundRow label="숙박비" sub="전액 환불" value={won(refund)} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 16,
            fontWeight: 700,
            borderTop: '1px solid var(--line)',
            marginTop: 16,
            paddingTop: 16,
          }}
        >
          <span>총 환불액</span>
          <span>{won(refund)}</span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 24 }}>
        예약이 즉시 취소되며, 환불금은 영업일 기준 10일 이내에 원결제수단으로 지급됩니다.
      </p>
    </div>
  );
}

function Amount({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function RefundRow({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 15 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{sub}</div>
      </div>
      <span style={{ fontSize: 15 }}>{value}</span>
    </div>
  );
}
