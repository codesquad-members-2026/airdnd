import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROOM_DETAIL_PIN_ANCHOR } from '../config/mapsConfig';
import { RoomDetailPin } from './RoomDetailPin';

describe('RoomDetailPin', () => {
  it('can render without the secondary pulse marker', () => {
    const { container } = render(<RoomDetailPin showPulse={false} />);

    expect(container.querySelector('.detail-pin__shape')).toBeInTheDocument();
    expect(container.querySelector('.detail-pin__pulse')).not.toBeInTheDocument();
  });

  it('anchors the coordinate at the teardrop tip', () => {
    expect(ROOM_DETAIL_PIN_ANCHOR).toEqual({
      left: '-50%',
      top: '-56px',
    });
  });
});
