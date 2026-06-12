package com.airdnd.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.assertThatNoException;

class OAuthClientConfigurationValidatorTest {

    @Test
    void acceptsRealCredential() {
        assertThatNoException()
                .isThrownBy(() -> OAuthClientConfigurationValidator.validateCredential(
                        "OAUTH2_GOOGLE_CLIENT_ID",
                        "real-client-id.apps.googleusercontent.com"
                ));
    }

    @Test
    void rejectsLiteralSpringPlaceholder() {
        assertThatIllegalStateException()
                .isThrownBy(() -> OAuthClientConfigurationValidator.validateCredential(
                        "OAUTH2_GOOGLE_CLIENT_ID",
                        "${OAUTH2_GOOGLE_CLIENT_ID}"
                ))
                .withMessageContaining("OAUTH2_GOOGLE_CLIENT_ID");
    }

    @Test
    void rejectsDocumentationPlaceholder() {
        assertThatIllegalStateException()
                .isThrownBy(() -> OAuthClientConfigurationValidator.validateCredential(
                        "OAUTH2_GOOGLE_CLIENT_SECRET",
                        "<google-client-secret>"
                ))
                .withMessageContaining("OAUTH2_GOOGLE_CLIENT_SECRET");
    }
}
