package codesquad.airdnd.domain.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.OffsetDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TossCancelResponse(
        String orderId,
        String orderName,
        String status,
        List<Cancel> cancels
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cancel(
            String cancelReason,
            OffsetDateTime canceledAt,
            Integer cancelAmount
    ) {}

    public String cancelReason(){
        return cancels.getLast().cancelReason();
    }

    public OffsetDateTime canceledAt(){
        return cancels.getLast().canceledAt();
    }

    public Integer cancelAmount(){
        return cancels.getLast().cancelAmount();
    }
}
