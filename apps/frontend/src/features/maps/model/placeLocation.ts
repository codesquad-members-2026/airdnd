import { selectedLocationSchema, SelectedLocation } from './locationTypes';

type PlaceLocationSource = {
  formattedAddress?: string | null;
  location?: {
    lat(): number;
    lng(): number;
  } | null;
  addressComponents?: Array<{
    shortText: string | null;
    longText?: string | null;
    types: string[];
  }>;
};

const REGION_COMPONENT_TYPES = [
  'locality',
  'postal_town',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'sublocality_level_1',
] as const;

export function getSelectedLocation(place: PlaceLocationSource): SelectedLocation | null {
  const countryCode = place.addressComponents
    ?.find((component) => component.types.includes('country'))
    ?.shortText?.toUpperCase();
  const region = getRegion(place.addressComponents);

  const result = selectedLocationSchema.safeParse({
    address: place.formattedAddress,
    region,
    countryCode,
    latitude: place.location?.lat(),
    longitude: place.location?.lng(),
  });

  return result.success ? result.data : null;
}

function getRegion(addressComponents: PlaceLocationSource['addressComponents']) {
  for (const type of REGION_COMPONENT_TYPES) {
    const component = addressComponents?.find((candidate) => candidate.types.includes(type));
    const name = component?.longText?.trim() || component?.shortText?.trim();

    if (name) {
      return name;
    }
  }

  return undefined;
}
