package com.airdnd.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.math.BigDecimal;
import java.time.Duration;

@ConfigurationProperties(prefix = "paypal")
public record PaypalProperties(
        String clientId,
        String clientSecret,
        String baseUrl,
        String currency,
        BigDecimal exchangeRate,
        @DefaultValue("5s") Duration connectTimeout,
        @DefaultValue("10s") Duration readTimeout
) {}
