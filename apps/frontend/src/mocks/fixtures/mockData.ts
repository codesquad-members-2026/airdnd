import { AdminDashboard, AdminUser, WaitlistSnapshot } from '../../features/admin/model/adminTypes';
import { User } from '../../features/auth/model/authTypes';
import { HostRoom } from '../../features/host/model/hostRoomTypes';
import { Notification } from '../../features/notifications/model/notificationTypes';
import { Reservation } from '../../features/reservations/model/reservationTypes';
import { RoomDetail } from '../../features/rooms/model/roomTypes';

export const mockUsers: Record<User['role'], User> = {
  GUEST: {
    id: 1,
    name: '게스트 사용자',
    email: 'guest@airdnd.test',
    role: 'GUEST',
  },
  HOST: {
    id: 2,
    name: '호스트 사용자',
    email: 'host@airdnd.test',
    role: 'HOST',
  },
  ADMIN: {
    id: 3,
    name: '관리자 사용자',
    email: 'admin@airdnd.test',
    role: 'ADMIN',
  },
};

export const mockRooms: HostRoom[] = [
  {
    id: 101,
    name: '성수 루프탑 스테이',
    region: '서울',
    address: '서울특별시 성동구 성수동',
    pricePerNight: 145000,
    maxGuests: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1f552a0a20?auto=format&fit=crop&w=1200&q=80',
    ],
    isAvailable: true,
    allowsPets: false,
    description:
      '성수동 카페 거리와 가까운 루프탑 숙소입니다. 업무와 휴식을 함께 하기 좋은 넓은 거실과 야외 테라스를 제공합니다.',
    amenities: ['와이파이', '주방', '세탁기', '루프탑', '업무 공간'],
    hostName: '호스트 사용자',
    latitude: 37.5446,
    longitude: 127.0557,
    status: 'ACTIVE',
  },
  {
    id: 102,
    name: '부산 오션뷰 하우스',
    region: '부산',
    address: '부산광역시 해운대구 우동',
    pricePerNight: 220000,
    maxGuests: 6,
    imageUrl:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    allowsPets: false,
    description:
      '해운대 바다가 보이는 고층 숙소입니다. 가족 여행과 장기 숙박에 적합한 넉넉한 공간을 제공합니다.',
    amenities: ['오션뷰', '주차', '엘리베이터', '주방', '욕조'],
    hostName: '호스트 사용자',
    latitude: 35.1631,
    longitude: 129.1635,
    status: 'ACTIVE',
  },
  {
    id: 103,
    name: '제주 귤밭 독채',
    region: '제주',
    address: '제주특별자치도 서귀포시 남원읍',
    pricePerNight: 180000,
    maxGuests: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    allowsPets: true,
    description:
      '귤밭 사이에 있는 조용한 독채 숙소입니다. 마당과 바비큐 공간을 사용할 수 있습니다.',
    amenities: ['독채', '마당', '바비큐', '주차', '반려동물 가능'],
    hostName: '호스트 사용자',
    latitude: 33.2799,
    longitude: 126.7203,
    status: 'PENDING_APPROVAL',
  },
];

export const mockWishlists = [
  { id: 1, name: '가고 싶은 곳', rooms: [mockRooms[0], mockRooms[2]] },
  { id: 2, name: '바다 근처 숙소', rooms: [mockRooms[1]] },
];

export const mockReservations: Reservation[] = [
  {
    id: 9001,
    roomId: 101,
    roomName: '성수 루프탑 스테이',
    roomImageUrl: mockRooms[0].imageUrl,
    region: '서울',
    checkIn: '2026-07-10',
    checkOut: '2026-07-12',
    guests: 2,
    totalPrice: 290000,
    status: 'CONFIRMED',
    guestName: '게스트 사용자',
    createdAt: '2026-06-01T10:30:00+09:00',
  },
];

export const mockAdminDashboard: AdminDashboard = {
  pendingRooms: 4,
  activeUsers: 128,
  reservationsToday: 12,
  waitQueueSize: 37,
};

export const mockAdminUsers: AdminUser[] = [
  {
    ...mockUsers.GUEST,
    reservationCount: 3,
    joinedAt: '2026-05-02',
    status: 'ACTIVE',
  },
  {
    ...mockUsers.HOST,
    reservationCount: 0,
    joinedAt: '2026-05-12',
    status: 'ACTIVE',
  },
  {
    ...mockUsers.ADMIN,
    reservationCount: 0,
    joinedAt: '2026-05-01',
    status: 'ACTIVE',
  },
];

export const mockWaitlistSnapshot: WaitlistSnapshot = {
  status: 'OPEN',
  waitingUsers: 37,
  averageWaitMinutes: 6,
  admissionRatePerMinute: 12,
  updatedAt: '2026-06-02T11:00:00+09:00',
};

export const mockNotifications: Notification[] = [
  {
    id: 801,
    type: 'RESERVATION',
    title: '예약이 확정되었습니다.',
    message: '성수 루프탑 스테이 예약이 확정되었습니다.',
    read: false,
    createdAt: '2026-06-02T09:30:00+09:00',
  },
  {
    id: 802,
    type: 'HOST',
    title: '숙소 승인 대기',
    message: '제주 귤밭 독채가 관리자 승인을 기다리고 있습니다.',
    read: false,
    createdAt: '2026-06-01T16:20:00+09:00',
  },
  {
    id: 803,
    type: 'SYSTEM',
    title: '대기열 상태 정상',
    message: '현재 대기열은 정상적으로 입장 처리를 진행 중입니다.',
    read: true,
    createdAt: '2026-06-01T11:05:00+09:00',
  },
];

export function toRoomDetail(room: HostRoom): RoomDetail {
  return room;
}
