package com.quizapp.controller;

import com.quizapp.dto.QuizDto;
import com.quizapp.security.UserPrincipal;
import com.quizapp.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Endpoints used by logged-in users to browse and take quizzes. */
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping
    public ResponseEntity<List<QuizDto>> listQuizzes() {
        return ResponseEntity.ok(quizService.listQuizzes());
    }

    /** Returns quiz + questions + options WITHOUT revealing which options are correct. */
    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> getQuiz(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getQuizForTaking(id));
    }
}
