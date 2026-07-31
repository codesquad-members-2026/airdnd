import { describe, expect, it } from 'vitest';
import { hostRoomFormSchema, hostRoomUpdateFormSchema } from './hostRoomTypes';

const validForm = {
  name: '성수 스테이',
  region: '서울',
  address: '서울특별시 성동구 성수동',
  countryCode: 'KR',
  latitude: 37.5446,
  longitude: 127.0557,
  pricePerNight: 145000,
  maxGuests: 4,
  imageUrls: ['https://example.com/room.jpg'],
};

describe('hostRoomFormSchema location contract', () => {
  it('accepts a valid Places-generated location', () => {
    expect(() => hostRoomFormSchema.parse(validForm)).not.toThrow();
  });

  it('requires coordinates and a country code', () => {
    const missingLocation = {
      name: validForm.name,
      region: validForm.region,
      address: validForm.address,
      pricePerNight: validForm.pricePerNight,
      maxGuests: validForm.maxGuests,
      imageUrls: validForm.imageUrls,
    };

    expect(hostRoomFormSchema.safeParse(missingLocation).success).toBe(false);
  });

  it('rejects invalid coordinate ranges and country codes', () => {
    expect(
      hostRoomFormSchema.safeParse({
        ...validForm,
        countryCode: 'kr',
        latitude: 91,
        longitude: -181,
      }).success,
    ).toBe(false);
  });

  it('rejects numeric values that cannot be read by the backend integer fields', () => {
    expect(
      hostRoomFormSchema.safeParse({
        ...validForm,
        pricePerNight: 1.5,
        maxGuests: 2.5,
      }).success,
    ).toBe(false);

    expect(
      hostRoomFormSchema.safeParse({
        ...validForm,
        pricePerNight: 50_000_001,
      }).success,
    ).toBe(false);
  });

  it('allows edit payloads without immutable location fields', () => {
    const editableFields = {
      name: validForm.name,
      pricePerNight: validForm.pricePerNight,
      maxGuests: validForm.maxGuests,
      imageUrls: validForm.imageUrls,
    };

    expect(hostRoomUpdateFormSchema.safeParse(editableFields).success).toBe(true);
    expect(editableFields).not.toHaveProperty('region');
    expect(editableFields).not.toHaveProperty('address');
    expect(editableFields).not.toHaveProperty('countryCode');
    expect(editableFields).not.toHaveProperty('latitude');
    expect(editableFields).not.toHaveProperty('longitude');
  });
});
