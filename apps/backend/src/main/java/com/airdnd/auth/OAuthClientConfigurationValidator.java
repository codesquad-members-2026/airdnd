package com.airdnd.auth;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OAuthClientConfigurationValidator {
    private final String googleClientId;
    private final String googleClientSecret;

    public OAuthClientConfigurationValidator(
            @Value("${spring.security.oauth2.client.registration.google.client-id}") String googleClientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret}") String googleClientSecret
    ) {
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
    }

    @PostConstruct
    void validate() {
        validateCredential("OAUTH2_GOOGLE_CLIENT_ID", googleClientId);
        validateCredential("OAUTH2_GOOGLE_CLIENT_SECRET", googleClientSecret);
    }

    static void validateCredential(String environmentVariable, String value) {
        if (value == null || value.isBlank() || value.contains("${") || value.startsWith("<")) {
            throw new IllegalStateException(
                    environmentVariable + " must contain the real Google OAuth credential, not a placeholder"
            );
        }
    }
}
