import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type ReviewSortKey = 'latest' | 'highest' | 'lowest';

export const REVIEW_SORT_OPTIONS: { key: ReviewSortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'highest', label: '평점 높은 순' },
  { key: 'lowest', label: '평점 낮은 순' },
];

interface ReviewSortDropdownProps {
  value: ReviewSortKey;
  onChange: (value: ReviewSortKey) => void;
}

export function ReviewSortDropdown({ value, onChange }: ReviewSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 / ESC 로 닫기
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentLabel =
    REVIEW_SORT_OPTIONS.find((option) => option.key === value)?.label ?? '최신순';

  return (
    <div ref={containerRef} className="review-sort">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="review-sort__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLabel}
        <ChevronDown size={16} className="review-sort__chevron" />
      </button>

      {open && (
        <div role="listbox" className="review-sort__menu">
          {REVIEW_SORT_OPTIONS.map((option) => {
            const isSelected = option.key === value;
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
                className={`review-sort__option${isSelected ? ' selected' : ''}`}
              >
                {option.label}
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
