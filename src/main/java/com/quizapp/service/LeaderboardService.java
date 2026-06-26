package com.quizapp.service;

import com.quizapp.dto.LeaderboardEntryDto;
import com.quizapp.entity.QuizAttempt;
import com.quizapp.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final QuizAttemptRepository attemptRepository;

    /** Leaderboard for one specific quiz, ranked by best score then best percentage. */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getQuizLeaderboard(Long quizId) {
        List<QuizAttempt> attempts = attemptRepository.findByQuizIdOrderByScoreDesc(quizId).stream()
                .filter(a -> a.getCompletedAt() != null)
                .collect(Collectors.toList());

        Map<String, List<QuizAttempt>> byUser = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getUsername()));

        return buildRankedList(byUser);
    }

    /** Overall leaderboard across all quizzes, ranked by average percentage score. */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getOverallLeaderboard() {
        List<QuizAttempt> attempts = attemptRepository.findAll().stream()
                .filter(a -> a.getCompletedAt() != null)
                .collect(Collectors.toList());

        Map<String, List<QuizAttempt>> byUser = attempts.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getUsername()));

        return buildRankedList(byUser);
    }

    private List<LeaderboardEntryDto> buildRankedList(Map<String, List<QuizAttempt>> byUser) {
        List<LeaderboardEntryDto> entries = byUser.entrySet().stream().map(entry -> {
            String username = entry.getKey();
            List<QuizAttempt> userAttempts = entry.getValue();

            int bestScore = userAttempts.stream().mapToInt(QuizAttempt::getScore).max().orElse(0);
            int totalQuestions = userAttempts.get(0).getTotalQuestions();
            double avgPercentage = userAttempts.stream()
                    .mapToDouble(a -> a.getTotalQuestions() == 0 ? 0 : (a.getScore() * 100.0) / a.getTotalQuestions())
                    .average().orElse(0);

            return LeaderboardEntryDto.builder()
                    .username(username)
                    .bestScore(bestScore)
                    .totalQuestions(totalQuestions)
                    .averagePercentage(Math.round(avgPercentage * 100) / 100.0)
                    .attemptsCount(userAttempts.size())
                    .build();
        })
        .sorted(Comparator.comparingDouble(LeaderboardEntryDto::getAveragePercentage).reversed())
        .collect(Collectors.toList());

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }
        return entries;
    }
}
