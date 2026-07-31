CREATE INDEX idx_res_room_dates
    ON reservations (room_id, check_out_date, check_in_date);