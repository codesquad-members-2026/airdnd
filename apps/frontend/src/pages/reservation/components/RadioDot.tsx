interface RadioDotProps {
  selected: boolean;
}

export function RadioDot({ selected }: RadioDotProps) {
  return (
    <span
      style={{
        marginTop: 2,
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        border: selected ? '7px solid var(--cta-dark)' : '2px solid var(--line-strong)',
        boxSizing: 'border-box',
        transition: 'border 120ms ease',
      }}
    />
  );
}
