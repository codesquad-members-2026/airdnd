package com.airdnd.notification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class NotificationEmitterRegistry {
    private static final long TIMEOUT = 60 * 60 * 1000;

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long memberId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT);
        emitters.computeIfAbsent(memberId,k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(memberId, emitter));
        emitter.onTimeout(() -> remove(memberId, emitter));
        emitter.onError((e) -> remove(memberId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connect").data("connected"));
        } catch (Exception e) {
            remove(memberId, emitter);
        }
        return emitter;
    }

    public void send(Long memberId, Object data) {
        List<SseEmitter> targets = emitters.get(memberId);
        if (targets == null) return;
        for (SseEmitter emitter : targets) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(data));
            }
            catch (Exception e) {
                remove(memberId, emitter);
            }
        }
    }

    // 주기적으로 ping(주석 이벤트)을 보내 끊긴 연결을 조기 감지·정리한다.
    // 주석 이벤트(": ping")는 프런트의 onmessage/이벤트 핸들러를 거치지 않으므로 클라이언트 코드에 영향이 없고,
    // 전송이 실패하면(IOException 등) 그 자리에서 emitter 를 제거해 맵 누수를 막는다.
    // 이게 없으면 브라우저를 닫은 클라이언트도 다음 알림이 발생할 때까지(최대 1시간) 맵에 남는다.
    @Scheduled(fixedDelay = 30_000)
    public void heartbeat() {
        emitters.forEach((memberId, targets) -> {
            for (SseEmitter emitter : targets) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    remove(memberId, emitter);
                }
            }
        });
    }

    private void remove(Long memberId, SseEmitter emitter) {
        // compute 로 원자화: 빈 리스트가 되면 키 자체를 제거하되, 그 사이 다른 스레드가
        // 같은 키에 새 emitter 를 추가한 경우(subscribe 의 computeIfAbsent)에는 키를 지우지 않는다.
        emitters.compute(memberId, (id, targets) -> {
            if (targets == null) return null;
            targets.remove(emitter);
            return targets.isEmpty() ? null : targets;
        });
    }

}
