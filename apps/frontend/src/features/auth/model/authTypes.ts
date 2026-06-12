import { z } from 'zod';

export const userRoleSchema = z.enum(['GUEST', 'HOST', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().url().optional(),
});

export type User = z.infer<typeof userSchema>;
