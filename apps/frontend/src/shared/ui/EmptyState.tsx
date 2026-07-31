import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** 빈 상태에서 다음 행동을 유도하는 버튼/링크 (선택) */
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="state-box__action">{action}</div> : null}
    </div>
  );
}
