import { RoomDetail } from '../model/roomTypes';
import { RoomLocationMap } from '../../maps/ui/RoomLocationMap';

export function RoomLocation({ room }: { room: RoomDetail }) {
  return (
    <section className="room-location">
      <h2 className="room-location__title">숙소 위치</h2>
      <p className="room-location__address">{room.address}</p>

      <RoomLocationMap latitude={room.latitude} longitude={room.longitude} name={room.name} />
    </section>
  );
}
