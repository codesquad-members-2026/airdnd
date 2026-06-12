import { z } from 'zod';
import { roomDetailSchema } from '../../rooms/model/roomTypes';

export const hostRoomStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']);

export const hostRoomSchema = roomDetailSchema.extend({
  status: hostRoomStatusSchema,
});

export const hostRoomFormSchema = z.object({
  name: z.string().min(1, '숙소 이름을 입력하세요.'),
  region: z.string().min(1, '지역을 입력하세요.'),
  address: z.string().min(1, '주소를 입력하세요.'),
  description: z.string().optional(),
  pricePerNight: z.coerce.number().min(1, '가격은 1원 이상이어야 합니다.'),
  maxGuests: z.coerce.number().min(1, '최대 인원은 1명 이상이어야 합니다.'),
  imageUrl: z.string().url('올바른 대표 이미지 URL을 입력하세요.'),
  imageUrlsText: z.string().optional(),
  allowsInfants: z.boolean().optional(),
  allowsPets: z.boolean().optional(),
  amenitiesText: z.string().optional(),
});

export type HostRoomStatus = z.infer<typeof hostRoomStatusSchema>;
export type HostRoom = z.infer<typeof hostRoomSchema>;
export type HostRoomFormInput = z.infer<typeof hostRoomFormSchema>;
export type HostRoomFormValues = z.input<typeof hostRoomFormSchema>;
