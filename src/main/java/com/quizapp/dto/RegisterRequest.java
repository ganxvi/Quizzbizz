package com.quizapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

   @NotBlank
    @Email
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@gmail\\.com$", message = "Email must be a valid gmail.com address")
    private String email;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>_\\-+=]).+$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, and one special character"
    )
    private String password;
}
