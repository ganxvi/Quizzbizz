package com.quizapp.controller;

import com.quizapp.dto.LeaderboardEntryDto;
import com.quizapp.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<LeaderboardEntryDto>> quizLeaderboard(@PathVariable Long quizId) {
        return ResponseEntity.ok(leaderboardService.getQuizLeaderboard(quizId));
    }

    @GetMapping("/overall")
    public ResponseEntity<List<LeaderboardEntryDto>> overallLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getOverallLeaderboard());
    }
}
