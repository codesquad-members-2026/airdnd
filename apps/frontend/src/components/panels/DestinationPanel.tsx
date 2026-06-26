import type { SearchState } from '../../types';
import { MAJOR_CITIES, searchRegions, regionLabel, regionIcon, regionTint, type RegionOption } from '../../shared/regions';

interface DestinationPanelProps {
  value: SearchState;
  onChange: (v: SearchState) => void;
  // 여행지 입력값(타이핑) — 있으면 검색, 없으면 주요 도시
  query?: string;
  // 선택 후 팝오버 닫기/다음 단계로
  onPick?: () => void;
}

// 지역 선택: UI는 지역명, API 전송은 sido/sigungu 코드
export function DestinationPanel({ value, onChange, query = '', onPick }: DestinationPanelProps) {
  const searching = query.trim().length > 0;
  const items = searching ? searchRegions(query) : MAJOR_CITIES;

  const select = (r: RegionOption) => {
    onChange({
      ...value,
      region: { sidoCode: r.sidoCode, sigunguCode: r.sigunguCode },
      destination: regionLabel(r.sidoCode, r.sigunguCode),
    });
    onPick?.();
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 16 }}>
        {searching ? '검색 결과' : '주요 도시'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '12px 8px', fontSize: 14, color: 'var(--ink-3)' }}>
            검색 결과가 없어요.
          </div>
        ) : (
          items.map((r) => (
            <div
              key={`${r.sidoCode}-${r.sigunguCode ?? 'all'}`}
              onClick={() => select(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '10px 8px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: r.tint ?? regionTint(r.sidoCode),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {r.icon ?? regionIcon(r.label, r.sidoCode)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>{r.label}</div>
                {r.desc && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{r.desc}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
