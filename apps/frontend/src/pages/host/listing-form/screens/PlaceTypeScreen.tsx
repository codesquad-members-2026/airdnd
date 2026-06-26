import { Icon } from '../../../../shared/Icon';
import type { RoomType } from '../../../../types';

const OPTIONS: { value: RoomType; icon: string; desc: string }[] = [
  { value: '집 전체', icon: 'home', desc: '게스트가 숙소 전체를 단독으로 사용합니다.' },
  { value: '개인실', icon: 'door-open', desc: '개인 방을 사용하고 일부 공간을 공유합니다.' },
  { value: '다인실', icon: 'users', desc: '여러 명이 함께 쓰는 공용 공간에서 묵습니다.' },
];

export function PlaceTypeScreen({
  value,
  onChange,
}: {
  value: RoomType;
  onChange: (v: RoomType) => void;
}) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 30,
          textAlign: 'center',
          marginBottom: 36,
        }}
      >
        게스트가 사용할 공간 유형은 무엇인가요?
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OPTIONS.map(o => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                textAlign: 'left',
                padding: '20px 24px',
                borderRadius: 14,
                border: `2px solid ${selected ? 'var(--ink-1)' : 'var(--line-strong)'}`,
                background: selected ? 'var(--surface-alt-2)' : '#fff',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{o.value}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 4 }}>{o.desc}</div>
              </div>
              <Icon name={o.icon} size={28} color="var(--ink-1)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
