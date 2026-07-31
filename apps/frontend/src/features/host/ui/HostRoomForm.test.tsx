import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectedLocation } from '../../maps/model/locationTypes';
import { RoomDetail } from '../../rooms/model/roomTypes';
import { HostRoomForm } from './HostRoomForm';

vi.mock('../api/hostApi', () => ({
  uploadRoomImage: vi.fn().mockResolvedValue('https://cdn.example.com/rooms/1/uploaded.jpg'),
}));

const selectedLocation: SelectedLocation = {
  address: '서울특별시 성동구 성수동',
  region: '서울특별시',
  countryCode: 'KR',
  latitude: 37.5446,
  longitude: 127.0557,
};

vi.mock('../../maps/ui/LocationPicker', () => ({
  LocationPicker: ({
    value,
    onChange,
  }: {
    value: SelectedLocation | null;
    onChange: (location: SelectedLocation) => void;
  }) => (
    <div>
      <span>{value ? value.address : '선택된 위치 없음'}</span>
      <button type="button" onClick={() => onChange(selectedLocation)}>
        테스트 위치 선택
      </button>
    </div>
  ),
}));

vi.mock('../../maps/ui/RoomLocationMap', () => ({
  RoomLocationMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div>
      읽기 전용 지도 {latitude}, {longitude}
    </div>
  ),
}));

describe('HostRoomForm location integration', () => {
  it('blocks submit until a location is selected', () => {
    render(<HostRoomForm mode="create" onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: '숙소 저장' })).toBeDisabled();
    expect(screen.queryByRole('textbox', { name: '주소' })).not.toBeInTheDocument();
  });

  it('submits the selected address, country code, and coordinates', async () => {
    const onSubmit = vi.fn();
    render(<HostRoomForm mode="create" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole('textbox', { name: '숙소 이름' }), {
      target: { value: '성수 스테이' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '1박 가격' }), {
      target: { value: '145000' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '최대 인원' }), {
      target: { value: '4' },
    });

    const imageFile = new File(['image-bytes'], 'room.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('숙소 이미지 업로드'), {
      target: { files: [imageFile] },
    });
    await waitFor(() => expect(screen.getByAltText('숙소 이미지 1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '테스트 위치 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '숙소 저장' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(selectedLocation)));
    expect(screen.queryByRole('textbox', { name: '지역' })).not.toBeInTheDocument();
  });

  it('shows the existing location as read-only in edit mode', async () => {
    const onSubmit = vi.fn();
    const initialValue: RoomDetail = {
      id: 101,
      name: '성수 스테이',
      region: '서울',
      address: selectedLocation.address,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      description: '',
      pricePerNight: 145000,
      maxGuests: 4,
      imageUrl: 'https://example.com/room.jpg',
      imageUrls: [],
      isAvailable: true,
      allowsPets: false,
      allowsInfants: false,
      amenities: [],
      hostName: '호스트',
    };

    render(<HostRoomForm mode="edit" initialValue={initialValue} onSubmit={onSubmit} />);

    expect(screen.getByText(selectedLocation.address)).toBeInTheDocument();
    expect(screen.getByText(/읽기 전용 지도/)).toBeInTheDocument();
    expect(screen.getByText(/새 숙소로 등록해주세요/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '테스트 위치 선택' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '지역' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '숙소 저장' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: '숙소 저장' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted).not.toHaveProperty('region');
    expect(submitted).not.toHaveProperty('address');
    expect(submitted).not.toHaveProperty('countryCode');
    expect(submitted).not.toHaveProperty('latitude');
    expect(submitted).not.toHaveProperty('longitude');
  });
});
