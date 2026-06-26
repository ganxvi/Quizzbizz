package com.quizapp.service;

import com.quizapp.dto.AnswerResultDto;
import com.quizapp.dto.AnswerSubmitRequest;
import com.quizapp.dto.AttemptResultDto;
import com.quizapp.entity.*;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuestionRepository;
import com.quizapp.repository.QuizAttemptRepository;
import com.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptService {

    private final QuizAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final QuizService quizService;

    /** Starts a new attempt for the given quiz so answers can be recorded against it. */
    @Transactional
    public Long startAttempt(Long quizId, Long userId) {
        Quiz quiz = quizService.getQuizEntity(quizId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .totalQuestions(quiz.getQuestions().size())
                .score(0)
                .build();
        attempt = attemptRepository.save(attempt);
        return attempt.getId();
    }

    /** Grades a single question immediately, giving the "instant feedback" required by the spec. */
    @Transactional
    public AnswerResultDto submitAnswer(Long attemptId, AnswerSubmitRequest request) {
        QuizAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        Set<Long> correctOptionIds = question.getOptions().stream()
                .filter(Option::isCorrect)
                .map(Option::getId)
                .collect(Collectors.toSet());

        Set<Long> selected = Set.copyOf(request.getSelectedOptionIds());
        boolean isCorrect = selected.equals(correctOptionIds);

        UserAnswer answer = UserAnswer.builder()
                .attempt(attempt)
                .question(question)
                .selectedOptionIds(request.getSelectedOptionIds().stream()
                        .map(String::valueOf).collect(Collectors.joining(",")))
                .correct(isCorrect)
                .build();
        attempt.getAnswers().add(answer);

        if (isCorrect) {
            attempt.setScore(attempt.getScore() + 1);
        }
        attemptRepository.save(attempt);

        return AnswerResultDto.builder()
                .questionId(question.getId())
                .correct(isCorrect)
                .correctOptionIds(List.copyOf(correctOptionIds))
                .build();
    }

    /** Finalizes the attempt and returns the final score summary. */
    @Transactional
    public AttemptResultDto completeAttempt(Long attemptId) {
        QuizAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found: " + attemptId));

        if (attempt.getCompletedAt() != null) {
            throw new BadRequestException("This attempt has already been completed");
        }

        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);
        return toDto(attempt);
    }

    @Transactional(readOnly = true)
    public List<AttemptResultDto> getUserHistory(Long userId) {
        return attemptRepository.findByUserIdOrderByStartedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private AttemptResultDto toDto(QuizAttempt attempt) {
        double percentage = attempt.getTotalQuestions() == 0 ? 0 :
                (attempt.getScore() * 100.0) / attempt.getTotalQuestions();
        return AttemptResultDto.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .percentage(Math.round(percentage * 100) / 100.0)
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .build();
    }
}
