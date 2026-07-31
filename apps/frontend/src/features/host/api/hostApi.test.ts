import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostRoomFormInput } from '../model/hostRoomTypes';
import { createHostRoom } from './hostApi';

const input: HostRoomFormInput = {
  name: '부산 오션 스테이',
  region: '부산',
  address: '부산광역시 해운대구 우동',
  description: '바다가 보이는 숙소',
  pricePerNight: 220000,
  maxGuests: 6,
  imageUrls: [
    'https://example.com/room.jpg',
    'https://example.com/room-2.jpg',
    'https://example.com/room-3.jpg',
  ],
  amenities: ['와이파이'],
  allowsInfants: true,
  allowsPets: false,
  countryCode: 'KR',
  latitude: 35.1631,
  longitude: 129.1635,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createHostRoom location payload', () => {
  it('maps the first image to imageUrl and the rest to imageUrls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(321, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createHostRoom(input)).resolves.toBe(321);

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(requestInit.body as string);

    expect(body).toMatchObject({
      address: input.address,
      countryCode: input.countryCode,
      latitude: input.latitude,
      longitude: input.longitude,
      allowsInfants: true,
      allowsPets: false,
      imageUrl: 'https://example.com/room.jpg',
      imageUrls: ['https://example.com/room-2.jpg', 'https://example.com/room-3.jpg'],
      amenities: ['와이파이'],
    });
    expect(body).not.toHaveProperty('imageUrlsText');
  });

  it('defaults optional backend-required booleans to false', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(322, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createHostRoom({
      ...input,
      allowsInfants: undefined,
      allowsPets: undefined,
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(requestInit.body as string);

    expect(body.allowsInfants).toBe(false);
    expect(body.allowsPets).toBe(false);
  });
});
