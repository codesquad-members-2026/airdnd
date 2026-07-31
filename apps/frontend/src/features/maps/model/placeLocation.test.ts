import { describe, expect, it } from 'vitest';
import { getSelectedLocation } from './placeLocation';

describe('getSelectedLocation', () => {
  it('uses the administrative area as the region for Seoul', () => {
    expect(
      getSelectedLocation({
        formattedAddress: '서울특별시 성동구 성수동',
        location: {
          lat: () => 37.5446,
          lng: () => 127.0557,
        },
        addressComponents: [
          {
            shortText: '서울',
            longText: '서울특별시',
            types: ['administrative_area_level_1'],
          },
          { shortText: 'kr', types: ['country', 'political'] },
        ],
      }),
    ).toEqual({
      address: '서울특별시 성동구 성수동',
      region: '서울특별시',
      countryCode: 'KR',
      latitude: 37.5446,
      longitude: 127.0557,
    });
  });

  it('prefers locality as the region for Los Angeles', () => {
    expect(
      getSelectedLocation({
        formattedAddress: 'Los Angeles, CA, USA',
        location: {
          lat: () => 34.0522,
          lng: () => -118.2437,
        },
        addressComponents: [
          { shortText: 'Los Angeles', types: ['locality', 'political'] },
          { shortText: 'CA', longText: 'California', types: ['administrative_area_level_1'] },
          { shortText: 'US', types: ['country', 'political'] },
        ],
      }),
    ).toEqual({
      address: 'Los Angeles, CA, USA',
      region: 'Los Angeles',
      countryCode: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
    });
  });

  it('returns null when required place fields are missing', () => {
    expect(
      getSelectedLocation({
        formattedAddress: '서울특별시 성동구 성수동',
        addressComponents: [
          { shortText: '서울', types: ['administrative_area_level_1'] },
          { shortText: 'KR', types: ['country'] },
        ],
      }),
    ).toBeNull();
  });

  it('returns null for coordinates outside the valid range', () => {
    expect(
      getSelectedLocation({
        formattedAddress: '잘못된 위치',
        location: {
          lat: () => 91,
          lng: () => 181,
        },
        addressComponents: [
          { shortText: '서울', types: ['administrative_area_level_1'] },
          { shortText: 'KR', types: ['country'] },
        ],
      }),
    ).toBeNull();
  });

  it('returns null when Places does not provide a usable region', () => {
    expect(
      getSelectedLocation({
        formattedAddress: 'Unknown place',
        location: {
          lat: () => 37,
          lng: () => 127,
        },
        addressComponents: [{ shortText: 'KR', types: ['country'] }],
      }),
    ).toBeNull();
  });
});
