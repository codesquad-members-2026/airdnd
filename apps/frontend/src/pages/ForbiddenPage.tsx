import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="stack">
      <p className="eyebrow">403</p>
      <h1>접근 권한이 없습니다.</h1>
      <p className="muted">현재 계정으로는 요청한 화면에 접근할 수 없습니다.</p>
      <Link className="primary-button inline-action" to="/">
        홈으로 이동
      </Link>
    </section>
  );
}
