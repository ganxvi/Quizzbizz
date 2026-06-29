package com.quizapp.service;

import com.quizapp.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Verifies a Google "ID token" by asking Google's own tokeninfo endpoint to validate it.
 * This avoids pulling in the full google-api-client SDK just for a class project; for a
 * production system, verifying the JWT signature locally against Google's published keys
 * (via the google-api-client or nimbus-jose-jwt library) would be the more efficient approach.
 */
@Service
public class GoogleTokenVerifierService {

    @Value("${app.google.client-id:}")
    private String expectedClientId;

    private final RestClient restClient = RestClient.create();

    public GoogleUserInfo verify(String idToken) {
        Map<String, Object> payload;
        try {
            payload = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid or expired Google token");
        }

        if (payload == null) {
            throw new BadRequestException("Invalid Google token");
        }

        String audience = String.valueOf(payload.get("aud"));
        if (expectedClientId != null && !expectedClientId.isBlank() && !expectedClientId.equals(audience)) {
            throw new BadRequestException("Google token was not issued for this application");
        }

        String email = (String) payload.get("email");
        String emailVerified = String.valueOf(payload.get("email_verified"));
        String name = (String) payload.getOrDefault("name", email);

        if (email == null || !"true".equalsIgnoreCase(emailVerified)) {
            throw new BadRequestException("Google account email is not verified");
        }

        return new GoogleUserInfo(email, name);
    }

    public record GoogleUserInfo(String email, String name) {}
}
