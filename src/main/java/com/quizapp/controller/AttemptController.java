package com.quizapp.controller;

import com.quizapp.dto.AnswerResultDto;
import com.quizapp.dto.AnswerSubmitRequest;
import com.quizapp.dto.AttemptResultDto;
import com.quizapp.security.UserPrincipal;
import com.quizapp.service.AttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Handles taking a quiz: starting an attempt, submitting answers one at a time, and finishing. */
@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    @PostMapping("/start/{quizId}")
    public ResponseEntity<Map<String, Long>> startAttempt(@PathVariable Long quizId,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        Long attemptId = attemptService.startAttempt(quizId, principal.getId());
        return ResponseEntity.ok(Map.of("attemptId", attemptId));
    }

    @PostMapping("/{attemptId}/answer")
    public ResponseEntity<AnswerResultDto> submitAnswer(@PathVariable Long attemptId,
                                                         @Valid @RequestBody AnswerSubmitRequest request) {
        return ResponseEntity.ok(attemptService.submitAnswer(attemptId, request));
    }

    @PostMapping("/{attemptId}/complete")
    public ResponseEntity<AttemptResultDto> completeAttempt(@PathVariable Long attemptId) {
        return ResponseEntity.ok(attemptService.completeAttempt(attemptId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttemptResultDto>> getHistory(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(attemptService.getUserHistory(principal.getId()));
    }
}
