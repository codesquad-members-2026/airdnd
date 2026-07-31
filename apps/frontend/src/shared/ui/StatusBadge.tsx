export type StatusBadgeTone = 'brand' | 'success' | 'warning' | 'neutral' | 'danger';

type StatusBadgeProps = {
  children: string;
  tone?: StatusBadgeTone;
};

export function StatusBadge({ children, tone = 'brand' }: StatusBadgeProps) {
  const toneClass = tone === 'brand' ? '' : ` status-badge--${tone}`;
  return <span className={`status-badge${toneClass}`}>{children}</span>;
}
