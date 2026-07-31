package com.airdnd.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "aws")
public record AwsProperties (
        String region,
        Credentials credentials,
        S3 s3
) {
    public record Credentials (String accessKey, String secretKey) {}

    public record S3 (
            String bucket,
            String publicBaseUrl,
            @DefaultValue("300") long presignExpirySeconds
    ) {}
}
