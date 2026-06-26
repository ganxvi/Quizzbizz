const Router = {
  routes: [],

  register(pattern, handler) {
    // pattern like '#/quiz/:id' -> regex with capture groups
    const paramNames = [];
    const regexStr = pattern.replace(/:[^/]+/g, (match) => {
      paramNames.push(match.slice(1));
      return '([^/]+)';
    });
    this.routes.push({ regex: new RegExp(`^${regexStr}$`), paramNames, handler });
  },

  navigate(hash) {
    location.hash = hash;
  },

  async resolve() {
    const hash = location.hash || '#/quizzes';
    const container = document.getElementById('app');

    for (const route of this.routes) {
      const match = hash.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => (params[name] = match[i + 1]));
        await route.handler(container, params);
        renderNav();
        return;
      }
    }
    container.innerHTML = `<div class="empty-state">Page not found.</div>`;
  },
};

function renderNav() {
  const navEl = document.getElementById('navLinks');
  if (!Auth.isLoggedIn()) {
    navEl.innerHTML = `<a href="#/login">Log In</a><a href="#/register">Register</a>`;
    return;
  }
  const user = Auth.currentUser();
  let links = `<a href="#/quizzes">Quizzes</a><a href="#/history">History</a><a href="#/leaderboard">Leaderboard</a>`;
  if (Auth.isAdmin()) links += `<a href="#/admin">Manage Quizzes</a>`;
  links += `<span class="muted" style="color:#fff;opacity:0.85;">Hi, ${escapeHtml(user.username)}</span>`;
  links += `<button onclick="Auth.logout()">Log Out</button>`;
  navEl.innerHTML = links;
}
