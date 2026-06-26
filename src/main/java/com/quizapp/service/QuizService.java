package com.quizapp.service;

import com.quizapp.dto.OptionDto;
import com.quizapp.dto.QuestionDto;
import com.quizapp.dto.QuizCreateRequest;
import com.quizapp.dto.QuizDto;
import com.quizapp.entity.Option;
import com.quizapp.entity.Question;
import com.quizapp.entity.Quiz;
import com.quizapp.exception.BadRequestException;
import com.quizapp.exception.ResourceNotFoundException;
import com.quizapp.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;

    @Transactional
    public QuizDto createQuiz(QuizCreateRequest request, Long adminId) {
        Quiz.Difficulty difficulty;
        try {
            difficulty = request.getDifficulty() == null
                    ? Quiz.Difficulty.MEDIUM
                    : Quiz.Difficulty.valueOf(request.getDifficulty().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid difficulty. Use EASY, MEDIUM or HARD");
        }

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .topic(request.getTopic())
                .difficulty(difficulty)
                .timeLimitSeconds(request.getTimeLimitSeconds())
                .createdBy(adminId)
                .build();
            final Quiz quizRef = quiz;

        List<Question> questions = request.getQuestions().stream().map(qReq -> {
            if (qReq.getOptions().stream().noneMatch(QuizCreateRequest.OptionCreateRequest::isCorrect)) {
                throw new BadRequestException("Question '" + qReq.getTitle() + "' must have at least one correct option");
            }
            Question question = Question.builder()
                    .quiz(quizRef)
                    .title(qReq.getTitle())
                    .multipleAnswers(qReq.isMultipleAnswers())
                    .build();
            List<Option> options = qReq.getOptions().stream()
                    .map(oReq -> Option.builder()
                            .question(question)
                            .text(oReq.getText())
                            .correct(oReq.isCorrect())
                            .build())
                    .collect(Collectors.toList());
            question.setOptions(options);
            return question;
        }).collect(Collectors.toList());

        quiz.setQuestions(questions);
        quiz = quizRepository.save(quiz);
        return toDto(quiz, true);
    }

    @Transactional
    public QuizDto updateQuiz(Long quizId, QuizCreateRequest request, Long adminId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        final Quiz quizRef = quiz;

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setTopic(request.getTopic());
        quiz.setTimeLimitSeconds(request.getTimeLimitSeconds());
        if (request.getDifficulty() != null) {
            try {
                quiz.setDifficulty(Quiz.Difficulty.valueOf(request.getDifficulty().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid difficulty. Use EASY, MEDIUM or HARD");
            }
        }

        // Replace questions entirely (simplest correct approach for an edit operation)
        quiz.getQuestions().clear();
        List<Question> questions = request.getQuestions().stream().map(qReq -> {
            if (qReq.getOptions().stream().noneMatch(QuizCreateRequest.OptionCreateRequest::isCorrect)) {
                throw new BadRequestException("Question '" + qReq.getTitle() + "' must have at least one correct option");
            }
            Question question = Question.builder()
                    .quiz(quizRef)
                    .title(qReq.getTitle())
                    .multipleAnswers(qReq.isMultipleAnswers())
                    .build();
            List<Option> options = qReq.getOptions().stream()
                    .map(oReq -> Option.builder()
                            .question(question)
                            .text(oReq.getText())
                            .correct(oReq.isCorrect())
                            .build())
                    .collect(Collectors.toList());
            question.setOptions(options);
            return question;
        }).collect(Collectors.toList());
        quiz.getQuestions().addAll(questions);

        quiz = quizRepository.save(quiz);
        return toDto(quiz, true);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        if (!quizRepository.existsById(quizId)) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }
        quizRepository.deleteById(quizId);
    }

    @Transactional(readOnly = true)
    public List<QuizDto> listQuizzes() {
        return quizRepository.findAll().stream()
                .map(q -> toDto(q, false))
                .collect(Collectors.toList());
    }

    /** Quiz with questions/options for taking it — correct flags stripped so users can't cheat by reading the payload. */
    @Transactional(readOnly = true)
    public QuizDto getQuizForTaking(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        return toDto(quiz, false);
    }

    /** Quiz with full details including correct answers — for admin editing only. */
    @Transactional(readOnly = true)
    public QuizDto getQuizForAdmin(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
        return toDto(quiz, true);
    }

    public Quiz getQuizEntity(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));
    }

    private QuizDto toDto(Quiz quiz, boolean includeCorrectFlag) {
        List<QuestionDto> questionDtos = quiz.getQuestions().stream().map(q -> QuestionDto.builder()
                .id(q.getId())
                .title(q.getTitle())
                .multipleAnswers(q.isMultipleAnswers())
                .options(q.getOptions().stream().map(o -> OptionDto.builder()
                        .id(o.getId())
                        .text(o.getText())
                        .correct(includeCorrectFlag ? o.isCorrect() : null)
                        .build()).collect(Collectors.toList()))
                .build()).collect(Collectors.toList());

        return QuizDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .topic(quiz.getTopic())
                .difficulty(quiz.getDifficulty().name())
                .timeLimitSeconds(quiz.getTimeLimitSeconds())
                .questionCount(quiz.getQuestions().size())
                .questions(questionDtos)
                .build();
    }
}
