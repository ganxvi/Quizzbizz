package com.quizapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizDto {
    private Long id;
    private String title;
    private String description;
    private String topic;
    private String difficulty;
    private int timeLimitSeconds;
    private int questionCount;
    private List<QuestionDto> questions; // populated only when taking/editing a quiz
}
