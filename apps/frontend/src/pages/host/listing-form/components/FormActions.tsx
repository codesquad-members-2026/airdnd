export function FormActions({
  isFirstStep,
  isLastStep,
  isEdit,
  isSubmitting,
  onBack,
  onPrev,
  onNext,
  onSubmit,
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  isEdit: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#fff',
      borderTop: '1px solid var(--line)',
      padding: '16px 48px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      zIndex: 30,
    }}>
      <button
        onClick={isFirstStep ? onBack : onPrev}
        style={{
          height: 48,
          padding: '0 28px',
          borderRadius: 10,
          border: '1px solid var(--line-strong)',
          background: '#fff',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--ink-1)',
          cursor: 'pointer',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
      >
        {isFirstStep ? '취소' : '이전'}
      </button>
      {isLastStep ? (
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{
            height: 48,
            padding: '0 36px',
            borderRadius: 10,
            border: 'none',
            background: isSubmitting ? 'var(--ink-4)' : 'var(--cta-dark)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 15,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => {
            if (!isSubmitting) e.currentTarget.style.background = '#3a3a3a';
          }}
          onMouseLeave={e => {
            if (!isSubmitting) e.currentTarget.style.background = 'var(--cta-dark)';
          }}
        >
          {isSubmitting ? '등록 중...' : isEdit ? '수정 완료' : '숙소 등록'}
        </button>
      ) : (
        <button
          onClick={onNext}
          style={{
            height: 48,
            padding: '0 36px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--cta-dark)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a3a3a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--cta-dark)')}
        >
          다음
        </button>
      )}
    </div>
  );
}
