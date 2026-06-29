const TakeQuiz = {
  state: null, // { quiz, attemptId, currentIndex, selected: Set, answered: bool, timerInterval, secondsLeft }

  async renderQuizPage(container, quizId) {
    container.innerHTML = `<p class="muted">Loading quiz...</p>`;
    try {
      const quiz = await apiRequest(`/quizzes/${quizId}`);
      const { attemptId } = await apiRequest(`/attempts/start/${quizId}`, { method: 'POST' });

      this.state = {
        quiz,
        attemptId,
        currentIndex: 0,
        selected: new Set(),
        answered: false,
        secondsLeft: quiz.timeLimitSeconds > 0 ? quiz.timeLimitSeconds : null,
        timerInterval: null,
      };

      if (this.state.secondsLeft != null) {
        this.state.timerInterval = setInterval(() => {
          this.state.secondsLeft--;
          const timerEl = document.getElementById('quizTimer');
          if (timerEl) timerEl.textContent = formatTime(this.state.secondsLeft);
          if (this.state.secondsLeft <= 0) {
            clearInterval(this.state.timerInterval);
            this.finishQuiz(container);
          }
        }, 1000);
      }

      this.renderQuestion(container);
    } catch (err) {
      container.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },

  renderQuestion(container) {
    const { quiz, currentIndex, selected, answered } = this.state;
    const question = quiz.questions[currentIndex];
    const progress = ((currentIndex) / quiz.questions.length) * 100;

    container.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="muted">Question ${currentIndex + 1} of ${quiz.questions.length}</span>
          ${this.state.secondsLeft != null ? `<span class="badge" id="quizTimer">${formatTime(this.state.secondsLeft)}</span>` : ''}
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%"></div></div>

        <h2>${escapeHtml(question.title)}</h2>
        ${question.multipleAnswers ? '<p class="muted">Select all that apply</p>' : ''}

        <div id="feedbackBanner"></div>

        <div class="option-list" id="optionList">
          ${question.options.map(o => `
            <div class="option-item" data-option-id="${o.id}" onclick="TakeQuiz.toggleOption(${o.id})">
              ${escapeHtml(o.text)}
            </div>
          `).join('')}
        </div>

        <div class="btn-row">
          <button class="btn" id="submitAnswerBtn" onclick="TakeQuiz.submitAnswer()">Submit Answer</button>
        </div>
      </div>
    `;
  },

  toggleOption(optionId) {
    if (this.state.answered) return; // locked after submission
    const question = this.state.quiz.questions[this.state.currentIndex];
    const el = document.querySelector(`[data-option-id="${optionId}"]`);

    if (!question.multipleAnswers) {
      this.state.selected.clear();
      document.querySelectorAll('.option-item').forEach(e => e.classList.remove('selected'));
    }

    if (this.state.selected.has(optionId)) {
      this.state.selected.delete(optionId);
      el.classList.remove('selected');
    } else {
      this.state.selected.add(optionId);
      el.classList.add('selected');
    }
  },

  async submitAnswer() {
    if (this.state.answered) {
      this.nextQuestion();
      return;
    }
    if (this.state.selected.size === 0) {
      showToast('Please select an answer', 'error');
      return;
    }

    const question = this.state.quiz.questions[this.state.currentIndex];
    try {
      const result = await apiRequest(`/attempts/${this.state.attemptId}/answer`, {
        method: 'POST',
        body: {
          questionId: question.id,
          selectedOptionIds: Array.from(this.state.selected),
        },
      });

      this.state.answered = true;

      // Visually mark correct/incorrect options
      document.querySelectorAll('.option-item').forEach(el => {
        const id = Number(el.dataset.optionId);
        if (result.correctOptionIds.includes(id)) el.classList.add('correct');
        else if (this.state.selected.has(id)) el.classList.add('incorrect');
      });

      const banner = document.getElementById('feedbackBanner');
      banner.innerHTML = `<div class="feedback-banner ${result.correct ? 'correct' : 'incorrect'}">
        ${result.correct ? 'Correct!' : ' Incorrect.'}
      </div>`;

      const isLast = this.state.currentIndex === this.state.quiz.questions.length - 1;
      const btn = document.getElementById('submitAnswerBtn');
      btn.textContent = isLast ? 'Finish Quiz' : 'Next Question';
      btn.onclick = isLast ? () => this.finishQuiz(document.getElementById('app')) : () => this.nextQuestion();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  nextQuestion() {
    this.state.currentIndex++;
    this.state.selected = new Set();
    this.state.answered = false;
    this.renderQuestion(document.getElementById('app'));
  },

  async finishQuiz(container) {
    if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    try {
      const result = await apiRequest(`/attempts/${this.state.attemptId}/complete`, { method: 'POST' });
      container.innerHTML = `
        <div class="card" style="text-align:center;">
          <h1>Quiz Complete!</h1>
          <div class="score-circle">${result.score}/${result.totalQuestions}</div>
          <p style="font-size:1.1rem;">You scored <b>${result.percentage}%</b> on "${escapeHtml(result.quizTitle)}"</p>
          <div class="btn-row" style="justify-content:center;">
            <button class="btn" onclick="Router.navigate('#/quizzes')">Back to Quizzes</button>
            <button class="btn btn-secondary" onclick="Router.navigate('#/history')">View History</button>
            <button class="btn btn-secondary" onclick="Router.navigate('#/leaderboard/${result.quizId}')">Leaderboard</button>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },
};

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
