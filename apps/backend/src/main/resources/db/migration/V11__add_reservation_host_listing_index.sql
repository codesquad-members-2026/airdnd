-- Host reservation listing (GET /api/host/rooms/{roomId}/reservations) paginates by
-- cursor: `WHERE room_id = ? [AND status = ?] AND id < :lastId ORDER BY id DESC LIMIT n`.
--
-- A status-filtered tab (확정/대기/취소) without this index can only use the room_id prefix
-- of idx_res_room_dates, then filter status and filesort by id for every page. This
-- composite turns the filtered + deep-pagination case into a pure backward range seek:
-- room_id and status are equality-matched, and the trailing id column serves both the
-- `id < :lastId` range and the `ORDER BY id DESC` without a filesort.
--
-- The 전체 tab (no status) still rides the existing idx_res_room_dates room_id prefix; a
-- single room's reservation set is small, so ordering it by id is cheap and needs no extra
-- index. The status summary (GROUP BY status) is also covered by this index.
CREATE INDEX idx_res_room_status_id
    ON reservations (room_id, status, id);
