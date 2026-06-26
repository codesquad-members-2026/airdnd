ALTER TABLE listing_image
DROP INDEX idx_listing_image_listing_id,
DROP COLUMN is_cover,
ADD INDEX idx_listing_image_listing_sort (listing_id, sort_order);