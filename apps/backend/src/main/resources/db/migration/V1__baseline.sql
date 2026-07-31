CREATE TABLE members (
     id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Surrogate Key',
     email VARCHAR(255) NOT NULL UNIQUE,
     nickname VARCHAR(100) NOT NULL,
     role VARCHAR(20) NOT NULL COMMENT 'GUEST, HOST, ADMIN',
     oauth_provider VARCHAR(20) NOT NULL COMMENT 'GITHUB, GOOGLE',
     oauth_id VARCHAR(255) NOT NULL UNIQUE,
     is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제(탈퇴) 여부'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rooms (
       id BIGINT AUTO_INCREMENT PRIMARY KEY,
       host_id BIGINT NOT NULL,
       host_name VARCHAR(255) NOT NULL,
       name VARCHAR(255) NOT NULL,
       region VARCHAR(100) NOT NULL COMMENT '지역 (검색 및 필터링용)',
       description TEXT,
       address VARCHAR(500) NOT NULL COMMENT '전체 주소 텍스트',
       country_code VARCHAR(5) NOT NULL COMMENT 'ISO 국가 코드 (예: KR, US, FR)',
       latitude DECIMAL(15, 12) NOT NULL COMMENT '위도',
       longitude DECIMAL(15, 12) NOT NULL COMMENT '경도',
       price_per_night INT NOT NULL,
       max_capacity INT NOT NULL,
       allows_infants BOOLEAN NOT NULL DEFAULT TRUE,
       allows_pets BOOLEAN NOT NULL DEFAULT FALSE COMMENT '반려동물 동반 가능 여부',
       is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'true: 노출, false: 숨김',
       is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Soft Delete',
       FOREIGN KEY (host_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_amenities (
                                room_id BIGINT NOT NULL,
                                amenity VARCHAR(255) NOT NULL,
                                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_images (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             room_id BIGINT NOT NULL,
                             image_url VARCHAR(500) NOT NULL,
                             is_representative BOOLEAN NOT NULL DEFAULT FALSE COMMENT '대표 이미지 여부',
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (room_id) REFERENCES rooms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      guest_id BIGINT NOT NULL,
      room_id BIGINT NOT NULL,
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      total_price INT NOT NULL,
      adult_count INT NOT NULL DEFAULT 1 COMMENT '성인 수',
      child_count INT NOT NULL DEFAULT 0 COMMENT '어린이 수',
      infant_count INT NOT NULL DEFAULT 0 COMMENT '유아 수',
      has_pets BOOLEAN NOT NULL DEFAULT FALSE COMMENT '반려동물 동반 여부',
      status VARCHAR(20) NOT NULL COMMENT 'PENDING, CONFIRMED, CANCELED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL COMMENT 'Soft Delete',
      FOREIGN KEY (guest_id) REFERENCES members(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     member_id BIGINT NOT NULL,
     reservation_id BIGINT NOT NULL,
     rating INT NOT NULL COMMENT '1 ~ 5점',
     comment TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     deleted_at TIMESTAMP NULL COMMENT 'Soft Delete',
     FOREIGN KEY (reservation_id) REFERENCES reservations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlists (
       id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Surrogate Key',
       member_id BIGINT NOT NULL,
       name VARCHAR(100) NOT NULL COMMENT '폴더 이름 (기본값: 가고 싶은 곳)',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '최신순 정렬용',
       FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist_rooms (
        id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Surrogate Key',
        wishlist_id BIGINT NOT NULL,
        room_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '최신 찜한순 정렬용',
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
       id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Surrogate Key',
       member_id BIGINT NOT NULL COMMENT '수신자 ID',
       type VARCHAR(50) NOT NULL COMMENT '알림 유형 (RESERVATION, REVIEW 등)',
       title VARCHAR(255) NOT NULL,
       content TEXT NOT NULL,
       redirect_url VARCHAR(500) COMMENT '클릭 시 이동할 프론트 URL (예: /reservations/12)',
       is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '읽음 여부',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '알림 발생 시간(정렬용)',
       FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;