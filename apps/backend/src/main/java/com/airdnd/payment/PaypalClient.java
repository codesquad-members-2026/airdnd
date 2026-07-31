package com.airdnd.payment;

import com.airdnd.common.error.ErrorCode;
import com.airdnd.common.exception.BusinessException;
import com.airdnd.config.PaypalProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PaypalClient {

    private final RestClient paypalRestClient;
    private final PaypalProperties props;

    public String getAccessToken() {
        String basic = Base64.getEncoder()
                .encodeToString((props.clientId() + ":" + props.clientSecret()).getBytes(StandardCharsets.UTF_8));

        TokenResponse token = paypalRestClient.post()
                .uri("/v1/oauth2/token")
                .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("grant_type=client_credentials")
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new BusinessException(ErrorCode.PAYMENT_CREATION_FAILED);
                })
                .body(TokenResponse.class);

        if (token == null || token.accessToken() == null) {
            throw new BusinessException(ErrorCode.PAYMENT_CREATION_FAILED);
        }
        return token.accessToken();
    }

    public String createOrder(BigDecimal amount) {
        CreateOrderRequest body = new CreateOrderRequest(
                "CAPTURE",
                List.of(new PurchaseUnit(new Amount(props.currency(), amount.toPlainString())))
        );

        OrderResponse order = paypalRestClient.post()
                .uri("/v2/checkout/orders")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new BusinessException(ErrorCode.PAYMENT_CREATION_FAILED);
                })
                .body(OrderResponse.class);

        if (order == null || order.id() == null) {
            throw new BusinessException(ErrorCode.PAYMENT_CREATION_FAILED);
        }
        return order.id();
    }


    public String getOrderStatus(String orderId) {
        OrderResponse order = paypalRestClient.get()
                .uri("/v2/checkout/orders/{orderId}", orderId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
                })
                .body(OrderResponse.class);

        if (order == null || order.status() == null) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND);
        }
        return order.status();
    }

    public void captureOrder(String orderId) {
        OrderResponse result = paypalRestClient.post()
                .uri("/v2/checkout/orders/{orderId}/capture", orderId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + getAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new BusinessException(ErrorCode.PAYMENT_CAPTURE_FAILED);
                })
                .body(OrderResponse.class);

        if (result == null || !"COMPLETED".equals(result.status())) {
            throw new BusinessException(ErrorCode.PAYMENT_CAPTURE_FAILED);
        }
    }

    private record TokenResponse(@JsonProperty("access_token") String accessToken) {}

    private record CreateOrderRequest(
            String intent,
            @JsonProperty("purchase_units") List<PurchaseUnit> purchaseUnits
    ) {}

    private record PurchaseUnit(Amount amount) {}

    private record Amount(@JsonProperty("currency_code") String currencyCode, String value) {}

    private record OrderResponse(String id, String status) {}
}
