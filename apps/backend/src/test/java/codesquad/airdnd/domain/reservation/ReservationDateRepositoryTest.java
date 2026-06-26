package codesquad.airdnd.domain.reservation;

import static org.assertj.core.api.Assertions.*;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import codesquad.airdnd.domain.reservation.entity.ReservationDate;

@DataJpaTest
class ReservationDateRepositoryTest {

	@Autowired
	private ReservationDateRepository resDateRepository;

	@Autowired
	private TestEntityManager em;

	private static final Long LISTING_ID = 10L;
	private static final LocalDate STAY_DATE = LocalDate.of(2026, 7, 1);

	private ReservationDate reservationDate(Long listingId, LocalDate stayDate, Long reservationId) {
		// ReservationDate 생성자가 private이므로 리플렉션으로 인스턴스 구성
		ReservationDate instance = newInstance();
		ReflectionTestUtils.setField(instance, "listingId", listingId);
		ReflectionTestUtils.setField(instance, "stayDate", stayDate);
		ReflectionTestUtils.setField(instance, "reservationId", reservationId);
		return instance;
	}

	private ReservationDate newInstance() {
		try {
			var ctor = ReservationDate.class.getDeclaredConstructor();
			ctor.setAccessible(true);
			return ctor.newInstance();
		} catch (ReflectiveOperationException e) {
			throw new IllegalStateException(e);
		}
	}

	@Test
	@DisplayName("같은 숙소의 같은 날짜를 두 번 저장하면 제약 위반으로 동시 예약이 차단된다")
	void rejectsDuplicateListingAndDate() {
		// given - 첫 예약 날짜 저장
		em.persist(reservationDate(LISTING_ID, STAY_DATE, 1L));
		em.flush();

		// when & then - 같은 숙소/날짜 재저장 시 UNIQUE 제약 위반 기대
		// 리포지토리(saveAndFlush)는 Spring 예외 변환을 거쳐 DataIntegrityViolationException으로 변환된다.
		// (TestEntityManager.flush()는 변환 없이 JPA 원시 예외를 던지므로 리포지토리를 사용한다)
		ReservationDate duplicate = reservationDate(LISTING_ID, STAY_DATE, 2L);
		assertThatThrownBy(() -> resDateRepository.saveAndFlush(duplicate))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("다른 날짜의 같은 숙소 예약 날짜는 함께 저장된다")
	void allowsDifferentDatesForSameListing() {
		// given
		em.persist(reservationDate(LISTING_ID, STAY_DATE, 1L));
		em.persist(reservationDate(LISTING_ID, STAY_DATE.plusDays(1), 1L));

		// when & then
		assertThatCode(() -> em.flush()).doesNotThrowAnyException();
	}
}
