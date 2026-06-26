package codesquad.airdnd.domain.payment.dto.request;

public record TossCancelRequest (
        String cancelReason,
        Integer cancelAmount
){
}