const History = {
  async renderPage(container) {
    container.innerHTML = `
      <h1>Your Quiz History</h1>
      <p class="subtitle">Track your past attempts and scores.</p>
      <div id="historyContent" class="card"><p class="muted">Loading...</p></div>
    `;

    try {
      const attempts = await apiRequest('/attempts/history');
      const el = document.getElementById('historyContent');

      if (attempts.length === 0) {
        el.innerHTML = `<div class="empty-state">You haven't attempted any quizzes yet.</div>`;
        return;
      }

      el.innerHTML = `
        <table>
          <thead>
            <tr><th>Quiz</th><th>Score</th><th>Percentage</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${attempts.map(a => `
              <tr>
                <td>${escapeHtml(a.quizTitle)}</td>
                <td>${a.score}/${a.totalQuestions}</td>
                <td>${a.percentage}%</td>
                <td>${new Date(a.startedAt).toLocaleString()}</td>
                <td>${a.completedAt ? '✅ Completed' : '⏳ In progress'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      document.getElementById('historyContent').innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },
};
