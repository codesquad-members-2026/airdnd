import { useState } from 'react';
import { TripEditModal, type TripEditType } from './TripEditModal';
import type { SearchState } from '../../../types';

interface TripInfoSectionProps {
  search: SearchState;
  onChange: (v: SearchState) => void;
}

export function TripInfoSection({ search, onChange }: TripInfoSectionProps) {
  const [edit, setEdit] = useState<TripEditType | null>(null);

  function handleSave(v: SearchState) {
    onChange(v);
    setEdit(null);
  }

  return (
    <div>
      <TripRow label="날짜" value={search.dates || '날짜 미정'} onEdit={() => setEdit('date')} />
      <div style={{ height: 1, background: 'var(--line)' }} />
      <TripRow label="게스트" value={search.guestLabel || '성인 1명'} onEdit={() => setEdit('guest')} />

      {edit && (
        <TripEditModal type={edit} search={search} onSave={handleSave} onClose={() => setEdit(null)} />
      )}
    </div>
  );
}

function TripRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div
      style={{
        padding: '20px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-1)' }}>{value}</div>
      </div>
      <button
        onClick={onEdit}
        style={{
          border: 'none',
          borderRadius: 8,
          background: 'var(--surface-alt-2)',
          padding: '10px 18px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          color: 'var(--ink-1)',
        }}
      >
        변경
      </button>
    </div>
  );
}
