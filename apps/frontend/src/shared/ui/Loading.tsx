export function Loading({ message = '불러오는 중입니다.' }: { message?: string }) {
  return (
    <div className="state-box" role="status">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
