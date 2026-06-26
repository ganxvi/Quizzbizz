const Leaderboard = {
  async renderPage(container, quizId) {
    container.innerHTML = `
      <h1>Leaderboard</h1>
      <div class="tabs">
        <button class="tab-btn ${quizId ? 'active' : ''}" id="quizTab">This Quiz</button>
        <button class="tab-btn ${!quizId ? 'active' : ''}" id="overallTab">Overall</button>
      </div>
      <div id="leaderboardContent" class="card"><p class="muted">Loading...</p></div>
    `;

    document.getElementById('overallTab').onclick = () => Router.navigate('#/leaderboard');
    document.getElementById('quizTab').onclick = () => {
      if (quizId) Router.navigate(`#/leaderboard/${quizId}`);
    };
    if (!quizId) document.getElementById('quizTab').style.display = 'none';

    try {
      const path = quizId ? `/leaderboard/quiz/${quizId}` : '/leaderboard/overall';
      const entries = await apiRequest(path);
      const el = document.getElementById('leaderboardContent');

      if (entries.length === 0) {
        el.innerHTML = `<div class="empty-state">No completed attempts yet.</div>`;
        return;
      }

      el.innerHTML = `
        <table>
          <thead><tr><th>Rank</th><th>User</th><th>Best Score</th><th>Avg %</th><th>Attempts</th></tr></thead>
          <tbody>
            ${entries.map(e => `
              <tr>
                <td>${e.rank === 1 ? '^.^' : e.rank === 2 ? '^^.^^' : e.rank === 3 ? '^^^.^^^' : e.rank}</td>
                <td>${escapeHtml(e.username)}</td>
                <td>${e.bestScore}/${e.totalQuestions}</td>
                <td>${e.averagePercentage}%</td>
                <td>${e.attemptsCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      document.getElementById('leaderboardContent').innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },
};
