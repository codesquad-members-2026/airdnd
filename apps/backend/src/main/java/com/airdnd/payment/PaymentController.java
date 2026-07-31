package com.airdnd.payment;

import com.airdnd.auth.AuthMemberPrincipal;
import com.airdnd.payment.dto.CaptureResponse;
import com.airdnd.payment.dto.CreateOrderResponse;
import com.airdnd.payment.dto.PaymentOrderRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;

    @PostMapping("/orders")
    public ResponseEntity<CreateOrderResponse> createNewOrder(
            @AuthenticationPrincipal AuthMemberPrincipal principal,
            @Valid @RequestBody PaymentOrderRequest request) {
        String orderId = service.createOrder(request, principal.getMemberId());
        return ResponseEntity.ok(new CreateOrderResponse(orderId));
    }

    @PostMapping("/orders/{orderId}/capture")
    public ResponseEntity<CaptureResponse> captureOrder(@AuthenticationPrincipal AuthMemberPrincipal principal, @PathVariable String orderId) {
        CaptureResponse reservationId = service.capture(orderId, principal.getMemberId());
        return ResponseEntity.ok(reservationId);
    }
}
