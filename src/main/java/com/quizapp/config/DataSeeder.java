package com.quizapp.config;

import com.quizapp.entity.*;
import com.quizapp.repository.QuizRepository;
import com.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds an initial admin user and a sample quiz on first run, purely so the
 * application is immediately demoable. Safe to remove for production use.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded
        }

        User admin = User.builder()
                .username("admin")
                .email("admin@quizapp.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build();
        admin = userRepository.save(admin);

        User demoUser = User.builder()
                .username("demo")
                .email("demo@quizapp.com")
                .password(passwordEncoder.encode("demo123"))
                .role(Role.USER)
                .build();
        userRepository.save(demoUser);

        Quiz quiz = Quiz.builder()
                .title("Java Fundamentals")
                .description("Test your knowledge of core Java concepts")
                .topic("Java")
                .difficulty(Quiz.Difficulty.EASY)
                .timeLimitSeconds(300)
                .createdBy(admin.getId())
                .build();

        Question q1 = Question.builder().quiz(quiz).title("Which keyword is used to inherit a class in Java?").build();
        q1.setOptions(List.of(
                Option.builder().question(q1).text("extends").correct(true).build(),
                Option.builder().question(q1).text("implements").correct(false).build(),
                Option.builder().question(q1).text("inherits").correct(false).build(),
                Option.builder().question(q1).text("super").correct(false).build()
        ));

        Question q2 = Question.builder().quiz(quiz).title("Which of these are valid access modifiers in Java? (select all that apply)").multipleAnswers(true).build();
        q2.setOptions(List.of(
                Option.builder().question(q2).text("public").correct(true).build(),
                Option.builder().question(q2).text("private").correct(true).build(),
                Option.builder().question(q2).text("protected").correct(true).build(),
                Option.builder().question(q2).text("internal").correct(false).build()
        ));

        Question q3 = Question.builder().quiz(quiz).title("What is the default value of a boolean in Java?").build();
        q3.setOptions(List.of(
                Option.builder().question(q3).text("true").correct(false).build(),
                Option.builder().question(q3).text("false").correct(true).build(),
                Option.builder().question(q3).text("null").correct(false).build(),
                Option.builder().question(q3).text("0").correct(false).build()
        ));

        quiz.setQuestions(List.of(q1, q2, q3));
        quizRepository.save(quiz);
    }
}
