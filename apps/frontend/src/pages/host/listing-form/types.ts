import type { Dispatch, SetStateAction } from 'react';
import type { ListingFormData } from '../../../types';

export type ListingFormErrors = Partial<Record<keyof ListingFormData, string>>;
export type SetListingFormErrors = Dispatch<SetStateAction<ListingFormErrors>>;
export type SetListingFormValue = <K extends keyof ListingFormData>(key: K, val: ListingFormData[K]) => void;
