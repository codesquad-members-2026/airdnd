import { z } from 'zod';
import {
  countryCodeSchema,
  latitudeSchema,
  longitudeSchema,
} from '../../maps/model/locationTypes';
import { roomDetailSchema } from '../../rooms/model/roomTypes';

export const hostRoomStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']);

export const hostRoomSchema = roomDetailSchema.extend({
  countryCode: countryCodeSchema,
  status: hostRoomStatusSchema,
});

export const hostRoomUpdateFormSchema = z.object({
  name: z.string().min(1, '숙소 이름을 입력하세요.'),
  description: z.string().optional(),
  pricePerNight: z.coerce
    .number()
    .int('가격은 정수로 입력하세요.')
    .min(1, '가격은 1원 이상이어야 합니다.')
    .max(50_000_000, '가격은 50,000,000원 이하여야 합니다.'),
  maxGuests: z.coerce
    .number()
    .int('최대 인원은 정수로 입력하세요.')
    .min(1, '최대 인원은 1명 이상이어야 합니다.'),
  // 업로드된 이미지의 publicUrl 목록. 첫 번째 항목이 대표 이미지다.
  imageUrls: z.array(z.string().url()).min(1, '이미지를 최소 한 장 이상 업로드하세요.'),
  allowsInfants: z.boolean().optional(),
  allowsPets: z.boolean().optional(),
  amenities: z.array(z.string()).default([]),
});

export const hostRoomFormSchema = hostRoomUpdateFormSchema.extend({
  region: z.string().min(1, '지역을 입력하세요.'),
  address: z.string().min(1, '주소를 입력하세요.'),
  countryCode: countryCodeSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export type HostRoomStatus = z.infer<typeof hostRoomStatusSchema>;
export type HostRoom = z.infer<typeof hostRoomSchema>;
export type HostRoomFormInput = z.infer<typeof hostRoomFormSchema>;
export type HostRoomFormValues = z.input<typeof hostRoomFormSchema>;
export type HostRoomUpdateFormInput = z.infer<typeof hostRoomUpdateFormSchema>;
export type HostRoomUpdateFormValues = z.input<typeof hostRoomUpdateFormSchema>;
