import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationPicker } from './LocationPicker';

const mapsState = vi.hoisted(() => ({ configured: false }));

vi.mock('../config/mapsConfig', () => ({
  DEFAULT_KOREA_CENTER: { lat: 36.5, lng: 127.8 },
  DETAIL_MAP_ZOOM: 16,
  get isMapsConfigured() {
    return mapsState.configured;
  },
  mapsConfig: { apiKey: '', mapId: '' },
  ROOM_DETAIL_PIN_ANCHOR: { left: '-50%', top: '-56px' },
}));

vi.mock('@vis.gl/react-google-maps', () => ({
  AdvancedMarker: ({
    children,
    draggable,
  }: {
    children: ReactNode;
    draggable?: boolean;
  }) => (
    <div data-testid="location-marker" data-draggable={String(draggable)}>
      {children}
    </div>
  ),
  APILoadingStatus: {
    AUTH_FAILURE: 'AUTH_FAILURE',
    FAILED: 'FAILED',
  },
  Map: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <div data-testid="location-map" data-clickable={String(Boolean(onClick))}>
      {children}
    </div>
  ),
  useApiLoadingStatus: () => 'LOADED',
  useMap: () => null,
  useMapsLibrary: () => null,
}));

afterEach(() => {
  mapsState.configured = false;
});

describe('LocationPicker', () => {
  it('shows a usable fallback when Google Maps is not configured', () => {
    render(<LocationPicker value={null} onChange={vi.fn()} />);

    expect(
      screen.getByText('Google Maps 설정이 필요하여 위치를 선택할 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('does not allow map clicks or marker dragging to change the selected Place location', () => {
    mapsState.configured = true;

    render(
      <LocationPicker
        value={{
          address: 'Los Angeles, CA, USA',
          region: 'Los Angeles',
          countryCode: 'US',
          latitude: 34.0522,
          longitude: -118.2437,
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('location-map')).toHaveAttribute('data-clickable', 'false');
    expect(screen.getByTestId('location-marker')).toHaveAttribute('data-draggable', 'false');
    expect(screen.getByText(/등록 후 변경할 수 없습니다/)).toBeInTheDocument();
  });
});
