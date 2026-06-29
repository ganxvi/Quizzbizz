function requireAuth(handler) {
  return async (container, params) => {
    if (!Auth.isLoggedIn()) {
      Router.navigate('#/login');
      return;
    }
    await handler(container, params);
  };
}

function requireAdmin(handler) {
  return async (container, params) => {
    if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
      Router.navigate('#/quizzes');
      showToast('Admin access required', 'error');
      return;
    }
    await handler(container, params);
  };
}

Router.register('#/', async (c) => Landing.render(c));
Router.register('#/login', async (c) => Auth.renderLoginPage(c));
Router.register('#/register', async (c) => Auth.renderRegisterPage(c));
Router.register('#/quizzes', requireAuth(async (c) => Quizzes.renderListPage(c)));
Router.register('#/quiz/:id', requireAuth(async (c, p) => TakeQuiz.renderQuizPage(c, p.id)));
Router.register('#/history', requireAuth(async (c) => History.renderPage(c)));
Router.register('#/leaderboard', requireAuth(async (c) => Leaderboard.renderPage(c, null)));
Router.register('#/leaderboard/:quizId', requireAuth(async (c, p) => Leaderboard.renderPage(c, p.quizId)));
Router.register('#/admin', requireAdmin(async (c) => Admin.renderDashboard(c)));
Router.register('#/admin/new', requireAdmin(async (c) => Admin.renderForm(c)));
Router.register('#/admin/edit/:id', requireAdmin(async (c, p) => Admin.renderForm(c, p.id)));
Router.register('#/quizzes/:topic',requireAuth(async (c, p) =>Quizzes.renderListPage(c, decodeURIComponent(p.topic))))
Router.register('#/quizzes/:topic',requireAuth(async (c, p) => Quizzes.renderListPage(c, decodeURIComponent(p.topic)))
);

window.addEventListener('hashchange', () => Router.resolve());
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = Auth.isLoggedIn() ? '#/quizzes' : '#/';
  Router.resolve();
});