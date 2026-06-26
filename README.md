# Online Quiz Application

A full-stack quiz platform built with **Spring Boot 3.3.4** (backend/API) and a lightweight **HTML/CSS/vanilla JS** single-page frontend (served as static files by Spring Boot — no separate frontend server needed).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.3.4, Spring Web, Spring Data JPA |
| Security | Spring Security 6, JWT (jjwt 0.12), BCrypt password hashing |
| Database | H2 (file-based, zero setup) — switchable to MySQL via Spring profile |
| Frontend | Plain HTML/CSS/JavaScript (hash-router SPA), calls the REST API with `fetch` |
| Build | Maven |

## Project Structure

```
src/main/java/com/quizapp/
├── OnlineQuizApplication.java     # main class
├── entity/                       # JPA entities: User, Quiz, Question, Option, QuizAttempt, UserAnswer
├── repository/                    # Spring Data JPA repositories
├── dto/                           # request/response DTOs
├── service/                       # business logic: AuthService, QuizService, AttemptService, LeaderboardService
├── controller/                    # REST controllers
├── security/                      # JWT filter, JwtService, UserDetails implementation
├── config/                        # SecurityConfig, DataSeeder (demo data)
└── exception/                     # GlobalExceptionHandler + custom exceptions

src/main/resources/
├── application.yml                # H2 by default; --spring.profiles.active=mysql to switch
└── static/                         # the frontend (index.html, css/, js/)
```

## Requirements Coverage

1. **User Authentication** — `/api/auth/register`, `/api/auth/login`. Passwords hashed + salted with BCrypt. JWT issued on login/register and required on protected endpoints.
2. **Quiz Management (Admin)** — `/api/admin/quizzes` (POST/PUT/DELETE/GET), restricted to `ROLE_ADMIN` via Spring Security. Each question has a title, options, and one-or-more correct answers.
3. **Quiz Taking** — `/api/quizzes/{id}` returns the quiz with options but **without** the `correct` flag, so the frontend can't be inspected to cheat. The UI shows one question at a time, with the correct/incorrect answer revealed immediately after submission.
4. **Scoring & Progress Tracking** — Each attempt is persisted (`QuizAttempt` + `UserAnswer`), the score is calculated server-side, and `/api/attempts/history` lets a user view all past attempts.
5. **Leaderboard** — `/api/leaderboard/quiz/{id}` and `/api/leaderboard/overall`, ranked by best score / average percentage.
6. **UI** — Single-page app with a simple top nav, cards, progress bar, and color-coded feedback for correct/incorrect answers.
7. **Data Persistence** — JPA/Hibernate over H2 by default; a `mysql` Spring profile is pre-configured if you want a "real" database.
8. **Error Handling** — `GlobalExceptionHandler` returns consistent JSON error bodies; Bean Validation (`@Valid`) on all incoming DTOs.
9. **Security** — BCrypt hashing (automatically salted per-user), JWT-based stateless auth, role-based authorization (`USER` / `ADMIN`).
10. **Documentation** — this README, plus inline Javadoc-style comments on non-obvious logic.

**Bonus features included:** per-quiz time limits with a live countdown timer, difficulty levels (EASY/MEDIUM/HARD), multi-answer (checkbox-style) questions in addition to single-answer (radio-style) ones.

## Running Locally

### Prerequisites
- Java 17+
- Maven 3.8+ (or use your IDE's built-in Maven support)

### Steps
```bash
# from the project root
mvn spring-boot:run
```
The app will start on **http://localhost:8080**. Open that URL in your browser — the frontend is served automatically.

On first run, `DataSeeder` creates two demo accounts and one sample quiz so you can explore immediately:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `demo`  | `demo123`  | USER  |

### Using MySQL instead of H2
1. Create a database (or let `createDatabaseIfNotExist=true` do it for you).
2. Update credentials in `application.yml` under the `mysql` profile if needed.
3. Run with:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=mysql
   ```

### H2 Console (for inspecting data during development)
Visit `http://localhost:8080/h2-console` with JDBC URL `jdbc:h2:file:./data/quizdb`, user `sa`, blank password.

## API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | create account, returns JWT |
| POST | `/api/auth/login` | public | log in, returns JWT |
| GET | `/api/quizzes` | user | list all quizzes |
| GET | `/api/quizzes/{id}` | user | get quiz for taking (no correct-answer flags) |
| POST | `/api/attempts/start/{quizId}` | user | start an attempt, returns `attemptId` |
| POST | `/api/attempts/{attemptId}/answer` | user | submit one answer, get instant feedback |
| POST | `/api/attempts/{attemptId}/complete` | user | finalize attempt, get final score |
| GET | `/api/attempts/history` | user | view your past attempts |
| GET | `/api/leaderboard/quiz/{id}` | user | leaderboard for one quiz |
| GET | `/api/leaderboard/overall` | user | overall leaderboard |
| POST | `/api/admin/quizzes` | admin | create a quiz |
| PUT | `/api/admin/quizzes/{id}` | admin | edit a quiz |
| DELETE | `/api/admin/quizzes/{id}` | admin | delete a quiz |
| GET | `/api/admin/quizzes/{id}` | admin | get quiz including correct answers (for editing) |

All endpoints except `/api/auth/**` require an `Authorization: Bearer <token>` header.

## Assumptions & Limitations

- A "correct" submission for a multi-answer question requires selecting **exactly** the full set of correct options (no partial credit) — a common, simple grading rule for MCQ apps.
- The frontend is intentionally framework-free (vanilla JS) to keep the project approachable and dependency-light; it can be swapped for React/Angular without touching the backend, since it's a pure REST API.
- There is no email verification or password-reset flow — out of scope for this assignment.
- `ddl-auto: update` is fine for development/demo purposes; a real production setup would use versioned migrations (Flyway/Liquibase) instead.
- The leaderboard's "average percentage" is computed across all of a user's *completed* attempts (in-progress attempts are excluded).
