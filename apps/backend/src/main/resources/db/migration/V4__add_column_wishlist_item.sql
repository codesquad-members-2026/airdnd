ALTER TABLE wishlist_item
    ADD COLUMN note VARCHAR(250) NULL
    AFTER listing_id;