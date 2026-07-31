package com.airdnd.reservation;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ReservationExpirationSweeper {
    private static final Logger logger = LoggerFactory.getLogger(ReservationExpirationSweeper.class);
    private final ReservationRepository repository;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void sweepExpiredReservations(){
        LocalDateTime now = LocalDateTime.now();
        int expiredRows = repository.bulkCancelExpiredReservations(now);
        if(expiredRows > 0){
            logger.info("Cancelled {} reservations due to non-payments", expiredRows);
        }
    }
}
