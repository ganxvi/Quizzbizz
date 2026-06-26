package com.quizapp.controller;

import com.quizapp.dto.QuizCreateRequest;
import com.quizapp.dto.QuizDto;
import com.quizapp.security.UserPrincipal;
import com.quizapp.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Admin-only CRUD for quizzes. Secured via hasRole("ADMIN") in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/quizzes")
@RequiredArgsConstructor
public class AdminQuizController {

    private final QuizService quizService;

    @PostMapping
    public ResponseEntity<QuizDto> createQuiz(@Valid @RequestBody QuizCreateRequest request,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.createQuiz(request, principal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizDto> updateQuiz(@PathVariable Long id,
                                               @Valid @RequestBody QuizCreateRequest request,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.updateQuiz(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    /** Admin view includes the correct-answer flags so the quiz can be edited safely. */
    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> getQuizForEditing(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizForAdmin(id));
    }
}
