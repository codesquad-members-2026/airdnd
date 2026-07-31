import { z } from 'zod';

// 커서 기반 페이지. items 한 페이지 + 다음 커서. hasNext=false 면 nextCursor=null.
// totalCount: 현재 조건에 매칭되는 전체 수. 첫 페이지에서만 채워지고 이후엔 null인 경우가 많다
// (매 페이지 COUNT 를 피하려는 최적화). 도메인별 item 스키마를 받아 페이지 스키마를 만든다.
export const cursorPageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
    totalCount: z.number().int().nonnegative().nullish(),
  });
