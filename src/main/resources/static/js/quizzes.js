const Quizzes = {
  async renderListPage(container) {
    container.innerHTML = `
      <h1>Available Quizzes</h1>
      <p class="subtitle">Pick a topic and test your knowledge.</p>
      <div id="quizList" class="quiz-list"><p class="muted">Loading quizzes...</p></div>
    `;

    try {
      const quizzes = await apiRequest('/quizzes');
      const listEl = document.getElementById('quizList');

      if (quizzes.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No quizzes available yet. Check back soon!</div>`;
        return;
      }

      listEl.innerHTML = quizzes.map(q => `
        <div class="card quiz-card">
          <div>
            <h2 style="margin:0 0 6px;">${escapeHtml(q.title)}</h2>
            <p class="muted" style="margin:0 0 8px;">${escapeHtml(q.description || '')}</p>
            <span class="badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
            <span class="badge">${q.questionCount} questions</span>
            ${q.timeLimitSeconds > 0 ? `<span class="badge">${Math.floor(q.timeLimitSeconds/60)} min</span>` : ''}
          </div>
          <button class="btn" onclick="Router.navigate('#/quiz/${q.id}')">Start Quiz</button>
        </div>
      `).join('');
    } catch (err) {
      document.getElementById('quizList').innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
