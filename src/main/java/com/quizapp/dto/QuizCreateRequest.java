package com.quizapp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class QuizCreateRequest {
    @NotBlank
    private String title;

    private String description;
    private String topic;
    private String difficulty; // EASY / MEDIUM / HARD
    private int timeLimitSeconds;

    @NotEmpty
    @Valid
    private List<QuestionCreateRequest> questions;

    @Data
    public static class QuestionCreateRequest {
        @NotBlank
        private String title;
        private boolean multipleAnswers;

        @NotEmpty
        @Valid
        private List<OptionCreateRequest> options;
    }

    @Data
    public static class OptionCreateRequest {
        @NotBlank
        private String text;
        private boolean correct;
    }
}
