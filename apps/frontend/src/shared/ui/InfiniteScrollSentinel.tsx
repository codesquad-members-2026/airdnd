import { useEffect, useRef } from 'react';

interface InfiniteScrollSentinelProps {
  // 다음 페이지가 있고, 화면 끝 센티넬이 보이면 호출됩니다.
  onReachEnd: () => void;
  hasNext: boolean;
  isFetching: boolean;
}

// 리스트 끝에 두는 보이지 않는 관찰 지점. 뷰포트에 들어오면 다음 페이지를 요청합니다.
export function InfiniteScrollSentinel({ onReachEnd, hasNext, isFetching }: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNext) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetching) {
        onReachEnd();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [onReachEnd, hasNext, isFetching]);

  if (!hasNext) return null;
  return <div ref={ref} className="infinite-sentinel" aria-hidden="true" />;
}
