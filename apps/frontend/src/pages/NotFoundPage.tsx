import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="stack">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p className="muted">주소가 바뀌었거나 존재하지 않는 화면입니다.</p>
      <Link className="primary-button inline-action" to="/">
        숙소 목록 보기
      </Link>
    </section>
  );
}
