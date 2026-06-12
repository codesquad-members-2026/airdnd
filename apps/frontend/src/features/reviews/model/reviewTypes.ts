import { z } from 'zod';

export const reviewSummarySchema = z.object({
  rating: z.number(),
  reviewCount: z.number(),
});

export type ReviewSummary = z.infer<typeof reviewSummarySchema>;

export const reviewResponseSchema = z.object({
  id: z.number(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorName: z.string().nullable().optional(),
});

export type Review = z.infer<typeof reviewResponseSchema>;