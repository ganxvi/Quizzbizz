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
  const navLinksEl = document.getElementById('navLinks');
  const navUserEl = document.getElementById('navUser');

  if (!Auth.isLoggedIn()) {
    navLinksEl.innerHTML = `<a href="#/">Home</a>`;
    navUserEl.innerHTML = `<a href="#/login">Log In</a><a href="#/register">Sign Up</a>`;
    return;
  }

  const user = Auth.currentUser();
  const currentHash = location.hash || '#/quizzes';

  const links = [
    { href: '#/', label: 'Home' },
    { href: '#/quizzes', label: 'Quizzes' },
    { href: '#/history', label: 'History' },
    { href: '#/leaderboard', label: 'Leaderboard' },
  ];
  if (Auth.isAdmin()) links.push({ href: '#/admin', label: 'Manage Quizzes' });

  navLinksEl.innerHTML = links.map(l =>
    `<a href="${l.href}" class="${currentHash === l.href ? 'active' : ''}">${l.label}</a>`
  ).join('');

  navUserEl.innerHTML = `
    <span class="muted" style="font-weight:600;">Hi, ${escapeHtml(user.username)}</span>
    <button onclick="Auth.logout()">Log Out</button>
  `;
}
