package com.quizapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {
    /** The ID token returned by Google Identity Services on the frontend after the user picks their Gmail account. */
    @NotBlank
    private String idToken;
}
