-- 시드 숙소 데이터 (재실행 안전)
-- 기존 방 1·2·3의 "내용만" 덮어쓴다. ID를 유지하므로 reservations/reviews FK가 그대로 보존된다.
-- host_id는 건드리지 않아 기존 호스트가 유지된다.
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────────────────────
-- 방 1: 제주 바다 전망 독채 펜션
-- ──────────────────────────────────────────────────────────────
UPDATE rooms SET
  name = '제주 바다 전망 독채 펜션',
  region = '제주',
  description = '제주 동쪽 성산 일대에 자리한 독채 펜션입니다. 거실 통창 너머로 탁 트인 바다가 펼쳐지고, 아침이면 성산일출봉 위로 떠오르는 해를 침대에서 그대로 감상할 수 있어요. 4인까지 편안하게 머물 수 있는 넓은 공간에 취사 가능한 주방, 보송한 침구, 프라이빗 테라스를 갖추고 있습니다. 반려동물도 함께할 수 있으니 가족 모두와 특별한 제주의 밤을 보내보세요. 근처 해안 산책로와 맛집까지 도보 10분 거리입니다.',
  address = '제주특별자치도 서귀포시 성산읍 해맞이해안로 1234',
  country_code = 'KR',
  latitude = 33.458700000000,
  longitude = 126.942600000000,
  price_per_night = 285000,
  max_capacity = 4,
  allows_infants = TRUE,
  allows_pets = TRUE,
  is_active = TRUE,
  is_deleted = FALSE
WHERE id = 1;

DELETE FROM room_amenities WHERE room_id = 1;
INSERT INTO room_amenities (room_id, amenity) VALUES
(1,'와이파이'),(1,'무료 주차'),(1,'주방'),(1,'에어컨'),(1,'TV'),
(1,'세탁기'),(1,'전망'),(1,'테라스'),(1,'침구'),(1,'조식');

DELETE FROM room_images WHERE room_id = 1;
INSERT INTO room_images (room_id, image_url, is_representative) VALUES
(1,'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',TRUE),
(1,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',FALSE),
(1,'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',FALSE),
(1,'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',FALSE),
(1,'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80',FALSE);

-- ──────────────────────────────────────────────────────────────
-- 방 2: 서울 한강뷰 모던 아파트
-- ──────────────────────────────────────────────────────────────
UPDATE rooms SET
  name = '서울 한강뷰 모던 아파트',
  region = '서울',
  description = '홍대와 합정 사이, 한강이 내려다보이는 모던한 아파트입니다. 9호선과 2호선이 모두 가까워 어디로든 이동이 편리하고, 양화한강공원까지 걸어서 5분이면 닿습니다. 깔끔하게 관리된 풀옵션 주방과 드럼 세탁기, 분리형 욕조가 있어 장기 숙박에도 불편함이 없어요. 야경이 아름다운 창가에서 여유로운 서울의 밤을 즐겨보세요. 공동현관 보안과 CCTV가 갖춰져 있어 1인 여행객도 안심하고 머무실 수 있습니다.',
  address = '서울특별시 마포구 양화로 45',
  country_code = 'KR',
  latitude = 37.555900000000,
  longitude = 126.914500000000,
  price_per_night = 195000,
  max_capacity = 3,
  allows_infants = TRUE,
  allows_pets = FALSE,
  is_active = TRUE,
  is_deleted = FALSE
WHERE id = 2;

DELETE FROM room_amenities WHERE room_id = 2;
INSERT INTO room_amenities (room_id, amenity) VALUES
(2,'와이파이'),(2,'주방'),(2,'에어컨'),(2,'난방'),(2,'TV'),
(2,'세탁기'),(2,'냉장고'),(2,'전자레인지'),(2,'욕조'),(2,'보안/CCTV');

DELETE FROM room_images WHERE room_id = 2;
INSERT INTO room_images (room_id, image_url, is_representative) VALUES
(2,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',TRUE),
(2,'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',FALSE),
(2,'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',FALSE),
(2,'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',FALSE),
(2,'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80',FALSE);

-- ──────────────────────────────────────────────────────────────
-- 방 3: 가평 숲속 감성 통나무집
-- ──────────────────────────────────────────────────────────────
UPDATE rooms SET
  name = '가평 숲속 감성 통나무집',
  region = '가평',
  description = '가평 청평호 인근 숲으로 둘러싸인 통나무 독채입니다. 마당에는 작은 수영장과 바비큐 공간이 있어 여름철 가족·친구 모임에 안성맞춤이에요. 최대 6명까지 묵을 수 있는 복층 구조에 따뜻한 난방과 포근한 침구를 완비했습니다. 반려동물 동반이 가능하며, 넓은 정원에서 마음껏 뛰어놀 수 있어요. 밤이면 도심에서 보기 힘든 별이 쏟아지고, 아침엔 새소리에 잠에서 깨는 진짜 숲속 휴식을 경험하실 수 있습니다.',
  address = '경기도 가평군 청평면 호반로 567',
  country_code = 'KR',
  latitude = 37.737600000000,
  longitude = 127.422200000000,
  price_per_night = 240000,
  max_capacity = 6,
  allows_infants = TRUE,
  allows_pets = TRUE,
  is_active = TRUE,
  is_deleted = FALSE
WHERE id = 3;

DELETE FROM room_amenities WHERE room_id = 3;
INSERT INTO room_amenities (room_id, amenity) VALUES
(3,'와이파이'),(3,'무료 주차'),(3,'주방'),(3,'난방'),(3,'정원/마당'),
(3,'수영장'),(3,'헬스장'),(3,'침구'),(3,'반려동물 동반'),(3,'전망');

DELETE FROM room_images WHERE room_id = 3;
INSERT INTO room_images (room_id, image_url, is_representative) VALUES
(3,'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',TRUE),
(3,'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',FALSE),
(3,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',FALSE),
(3,'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',FALSE),
(3,'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',FALSE);
