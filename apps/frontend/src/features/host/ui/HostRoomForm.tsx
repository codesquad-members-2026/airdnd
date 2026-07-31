import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { SelectedLocation } from '../../maps/model/locationTypes';
import { LocationPicker } from '../../maps/ui/LocationPicker';
import { RoomLocationMap } from '../../maps/ui/RoomLocationMap';
import { RoomDetail } from '../../rooms/model/roomTypes';
import { AMENITY_OPTIONS } from '../../rooms/model/amenities';
import {
  HostRoomFormInput,
  HostRoomUpdateFormInput,
  HostRoomUpdateFormValues,
  hostRoomUpdateFormSchema,
} from '../model/hostRoomTypes';
import { RoomImageUploader } from './RoomImageUploader';

type HostRoomFormProps =
  | {
      mode: 'create';
      initialValue?: never;
      isSubmitting?: boolean;
      onSubmit: (input: HostRoomFormInput) => void;
    }
  | {
      mode: 'edit';
      initialValue: RoomDetail;
      isSubmitting?: boolean;
      onSubmit: (input: HostRoomUpdateFormInput) => void;
    };

const defaultValues: HostRoomUpdateFormValues = {
  name: '',
  description: '',
  pricePerNight: 100000,
  maxGuests: 2,
  imageUrls: [],
  allowsInfants: false,
  allowsPets: false,
  amenities: [],
};

export function HostRoomForm(props: HostRoomFormProps) {
  const { mode, isSubmitting = false } = props;
  const initialValue = props.mode === 'edit' ? props.initialValue : undefined;
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HostRoomUpdateFormValues, unknown, HostRoomUpdateFormInput>({
    resolver: zodResolver(hostRoomUpdateFormSchema),
    defaultValues,
  });

  const imageUrls = watch('imageUrls') ?? [];

  function handleImagesChange(urls: string[]) {
    setValue('imageUrls', urls, { shouldValidate: true, shouldDirty: true });
  }

  useEffect(() => {
    if (initialValue) {
      reset({
        name: initialValue.name,
        description: initialValue.description,
        pricePerNight: initialValue.pricePerNight,
        maxGuests: initialValue.maxGuests,
        // 대표 이미지를 맨 앞에 두고 나머지를 이어붙인다(중복 제거).
        imageUrls: [
          initialValue.imageUrl,
          ...(initialValue.imageUrls ?? []).filter((url) => url && url !== initialValue.imageUrl),
        ].filter(Boolean),
        amenities: initialValue.amenities ?? [],
        allowsInfants: initialValue.allowsInfants,
        allowsPets: initialValue.allowsPets,
      });
    }
  }, [initialValue, reset]);

  function submitForm(input: HostRoomUpdateFormInput) {
    if (props.mode === 'edit') {
      props.onSubmit(input);
      return;
    }

    if (!selectedLocation) {
      return;
    }

    props.onSubmit({
      ...input,
      ...selectedLocation,
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit(submitForm)}>
      <label>
        숙소 이름
        <input {...register('name')} />
        {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
      </label>
      <div className="host-location-field full-row">
        <div>
          <strong>숙소 위치</strong>
          <p className="muted">
            {mode === 'create'
              ? '주소 검색 결과를 선택하면 지역과 위치가 자동으로 설정됩니다.'
              : '숙소 위치는 등록 후 변경할 수 없습니다.'}
          </p>
        </div>
        {mode === 'create' ? (
          <LocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
            disabled={isSubmitting}
          />
        ) : (
          <div className="host-location-readonly">
            <div className="location-picker-details">
              <strong>{props.initialValue.address}</strong>
              <span>{props.initialValue.region}</span>
              <small>위치가 변경되었다면 기존 숙소를 수정하지 말고 새 숙소로 등록해주세요.</small>
            </div>
            <RoomLocationMap
              latitude={props.initialValue.latitude}
              longitude={props.initialValue.longitude}
              name={props.initialValue.name}
            />
          </div>
        )}
      </div>
      <label>
        1박 가격
        <input type="number" min={1} {...register('pricePerNight')} />
        {errors.pricePerNight ? (
          <span className="field-error">{errors.pricePerNight.message}</span>
        ) : null}
      </label>
      <label>
        최대 인원
        <input type="number" min={1} {...register('maxGuests')} />
        {errors.maxGuests ? <span className="field-error">{errors.maxGuests.message}</span> : null}
      </label>
      <div className="full-row">
        <strong>숙소 이미지</strong>
        <RoomImageUploader
          value={imageUrls}
          onChange={handleImagesChange}
          disabled={isSubmitting}
        />
        {errors.imageUrls ? (
          <span className="field-error">
            {errors.imageUrls.message ?? errors.imageUrls.root?.message}
          </span>
        ) : null}
      </div>
      <fieldset className="amenities-fieldset full-row">
        <legend>편의시설</legend>
        <div className="amenities-check-grid">
          {AMENITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.value} className="amenity-check">
                <input type="checkbox" value={option.value} {...register('amenities')} />
                <Icon size={18} strokeWidth={1.8} aria-hidden />
                <span>{option.value}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="checkbox-row full-row">
        <input type="checkbox" {...register('allowsInfants')} />
        <span>
          <strong>유아 동반 허용</strong>
          <small>유아 동반이 가능한 숙소인지 여부를 선택합니다.</small>
        </span>
      </label>
      <label className="checkbox-row full-row">
        <input type="checkbox" {...register('allowsPets')} />
        <span>
          <strong>반려동물 동반 허용</strong>
          <small>검색 필터에서 반려동물 가능 숙소로 노출됩니다.</small>
        </span>
      </label>
      <label className="full-row">
        설명 (선택)
        <textarea rows={6} {...register('description')} />
        {errors.description ? (
          <span className="field-error">{errors.description.message}</span>
        ) : null}
      </label>
      <button
        className="primary-button full-row"
        type="submit"
        disabled={isSubmitting || (mode === 'create' && !selectedLocation)}
      >
        {isSubmitting ? '저장 중...' : '숙소 저장'}
      </button>
    </form>
  );
}
