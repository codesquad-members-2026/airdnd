import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

const RATING_LABELS = ['별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'];

// 별점 선택 — 마우스를 올리면 미리보기로 채워지고, 클릭하면 확정된다
export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="star-input">
      <div
        className="star-input__stars"
        role="radiogroup"
        aria-label="별점"
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const score = i + 1;
          const on = score <= active;
          return (
            <button
              key={score}
              type="button"
              className="star-input__star"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score}점 - ${RATING_LABELS[i]}`}
              disabled={disabled}
              onMouseEnter={() => setHovered(score)}
              onClick={() => onChange(score)}
            >
              <Star
                size={36}
                className={on ? 'is-on' : 'is-off'}
                fill={on ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      <span className="star-input__label">{active ? RATING_LABELS[active - 1] : '별점을 선택해 주세요'}</span>
    </div>
  );
}
