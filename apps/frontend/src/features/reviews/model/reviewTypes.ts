import { z } from 'zod';

export const reviewResponseSchema = z.object({
  id: z.number(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorName: z.string().nullable().optional(),
});

export type Review = z.infer<typeof reviewResponseSchema>;

// 리뷰 작성 폼 검증 스키마 — 별점(1~5)과 후기 내용
export const REVIEW_COMMENT_MAX_LENGTH = 1000;

export const createReviewFormSchema = z.object({
  rating: z
    .number({ message: '별점을 선택해 주세요.' })
    .int()
    .min(1, '별점을 선택해 주세요.')
    .max(5),
  comment: z
    .string()
    .trim()
    .min(10, '후기는 최소 10자 이상 작성해 주세요.')
    .max(REVIEW_COMMENT_MAX_LENGTH, `후기는 최대 ${REVIEW_COMMENT_MAX_LENGTH}자까지 작성할 수 있습니다.`),
});

export type CreateReviewFormValues = z.infer<typeof createReviewFormSchema>;