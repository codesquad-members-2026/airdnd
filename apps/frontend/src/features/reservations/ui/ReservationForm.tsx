import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentUserQuery } from '../../auth/api/authQueries';
import { RoomDetail } from '../../rooms/model/roomTypes';
import { getStayNights } from '../../../shared/lib/date';
import { formatCurrency } from '../../../shared/lib/format';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import {
  CreateReservationFormValues,
  CreateReservationInput,
  createReservationSchema,
} from '../model/reservationTypes';
import { useCreateReservationMutation } from '../api/reservationsQueries';
import { GuestSelector } from './GuestSelector';

export function ReservationForm({ room }: { room: RoomDetail }) {
  const location = useLocation();
  const { data: user } = useCurrentUserQuery();
  const createMutation = useCreateReservationMutation(room.id);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReservationFormValues, unknown, CreateReservationInput>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      roomId: room.id,
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0,
      infants: 0,
      pets: 0,
    },
  });

  const checkIn = useWatch({ control, name: 'checkIn' });
  const checkOut = useWatch({ control, name: 'checkOut' });
  const nights = getStayNights(checkIn, checkOut);
  const totalPrice = nights * room.pricePerNight;

  function onSubmit(input: CreateReservationInput) {
    if (!user) return;
    
    createMutation.mutate({
      guestId: user.id,
      roomId: room.id,
      checkInDate: input.checkIn,
      checkOutDate: input.checkOut,
      totalPrice,
      adultCount: input.adults,
      childCount: input.children,
      infantCount: input.infants,
      hasPets: input.pets > 0,
    });
  }

  if (!user) {
    return (
      <aside className="reservation-panel">
        <h2>예약하기</h2>
        <p className="muted">예약하려면 로그인이 필요합니다.</p>
        <Link className="primary-button full-width" to="/login" state={{ from: location }}>
          로그인하고 예약하기
        </Link>
      </aside>
    );
  }

  return (
    <aside className="reservation-panel">
      <h2>예약하기</h2>
      <p className="room-price">
        {formatCurrency(room.pricePerNight)}
        <span> / 박</span>
      </p>
      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" value={room.id} {...register('roomId', { valueAsNumber: true })} />
        <label>
          체크인
          <input type="date" {...register('checkIn')} />
          {errors.checkIn ? <span className="field-error">{errors.checkIn.message}</span> : null}
        </label>
        <label>
          체크아웃
          <input type="date" {...register('checkOut')} />
          {errors.checkOut ? <span className="field-error">{errors.checkOut.message}</span> : null}
        </label>
        
        <GuestSelector 
          maxGuests={room.maxGuests} 
          allowsPets={room.allowsPets} 
          setValue={setValue} 
          watch={watch} 
        />
        {errors.adults ? <span className="field-error">{errors.adults.message}</span> : null}

        <div className="price-summary">
          <span>{nights}박 예상 금액</span>
          <strong>{formatCurrency(totalPrice)}</strong>
        </div>
        {createMutation.error ? <ErrorMessage error={createMutation.error} /> : null}
        {createMutation.isSuccess ? (
          <div className="state-box success" role="status">
            예약이 생성되었습니다. 예약 목록에서 확인할 수 있습니다.
          </div>
        ) : null}
        <button className="primary-button full-width" type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '예약 중...' : '예약 요청'}
        </button>
      </form>
    </aside>
  );
}
