import { z } from 'zod';

export const roomSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string(),
  address: z.string(),
  pricePerNight: z.number(),
  maxGuests: z.number(),
  imageUrl: z.string().url().or(z.literal('')),
  isAvailable: z.boolean(),
  allowsPets: z.boolean(),
});

export const roomDetailSchema = roomSummarySchema.extend({
  description: z.string(),
  amenities: z.array(z.string()),
  imageUrls: z.array(z.string().url()).optional(),
  hostName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const roomSearchParamsSchema = z.object({
  region: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  infants: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  allowsPets: z.boolean().optional(),
});

export type RoomSummary = z.infer<typeof roomSummarySchema>;
export type RoomDetail = z.infer<typeof roomDetailSchema>;
export type RoomSearchParams = z.infer<typeof roomSearchParamsSchema>;
