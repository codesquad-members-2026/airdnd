package com.airdnd.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 알림 전용 비동기 실행기.
     * 알림 저장/SSE 전송을 요청 스레드(예약 확정·취소·리뷰 커밋 스레드)에서 떼어내기 위한 풀이다.
     * - 유계 큐(queueCapacity)로 폭주 시 무한 적재를 막고,
     * - 큐까지 가득 차면 CallerRunsPolicy 로 호출 스레드가 직접 처리해 백프레셔를 건다(알림 유실 방지).
     * 이름을 지정하지 않은 @Async 는 SimpleAsyncTaskExecutor(요청마다 새 스레드, 무한)를 쓰므로
     * 반드시 이 빈을 @Async("notificationExecutor") 로 명시해서 사용한다.
     */
    @Bean("notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("noti-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        return executor;
    }
}
