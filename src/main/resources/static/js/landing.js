const Landing = {
  // Cycled in order onto however many real topics exist — not a fixed category list.
  cardColors: ["c1", "c2", "c3", "c4", "c5", "c6"],
  topicIcons: {
    technology: "💻",
    tech: "💻",
    science: "🔬",
    history: "📜",
    sports: "⚽",
    movies: "🎬",
    film: "🎬",
    music: "🎵",
    java: "☕",
    programming: "💻",
    math: "➗",
    mathematics: "➗",
    geography: "🌍",
    art: "🎨",
    literature: "📚",
    general: "🧠",
    gk: "🧠",
  },

  async render(container) {
    const loggedIn = Auth.isLoggedIn();

    container.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="hero-eyebrow"> Play. Learn. Climb the board.</span>
          <h1 class="hero-title">Learn playfully.<br/>Win <span class="accent">proudly.</span></h1>
          <p class="hero-sub">Bite-sized quizzes across every topic our community adds — with instant feedback, streaks, and a leaderboard worth bragging about.</p>
          <div class="btn-row">
            ${
              loggedIn
                ? `<button class="btn" onclick="Router.navigate('#/quizzes')">Browse All Quizzes</button>`
                : `<button class="btn" onclick="Router.navigate('#/register')">Get Started Free</button>
                 <button class="btn btn-secondary" onclick="Router.navigate('#/login')">Log In</button>`
            }
          </div>
        </div>
        <div class="hero-art">
          <div class="blob b1"></div>
          <div class="blob b2"></div>
          <div class="float-card score">9/10 score</div>
          <div class="float-card cat">Quiz time</div>
          <div class="float-card streak">7-day streak</div>
        </div>
      </section>

      <h2 style="margin-bottom:4px;">Pick your arena</h2>
      <p class="subtitle">Live categories, built from whatever's actually in the quiz library.</p>
      <div class="category-grid" id="categoryGrid">
        <p class="muted">Loading categories...</p>
      </div>

      <div class="card" style="text-align:center;background:var(--ink);color:#fff;">
        <h2 style="color:#fff;">Ready to test your brain?</h2>
        <p class="muted" style="color:rgba(255,255,255,0.7);margin-top:8px;">
          ${loggedIn ? "Pick a category above and start playing." : "Create a free account in seconds — Google sign-in included."}
        </p>
        ${!loggedIn ? `<button class="btn" style="background:var(--coral);" onclick="Router.navigate('#/register')">Sign Up Free</button>` : ""}
      </div>
    `;

    await this.loadCategories(loggedIn);
  },
   async loadCategories(loggedIn) {
    const gridEl = document.getElementById('categoryGrid');

    if (!loggedIn) {
      gridEl.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align:center;">
          <p class="muted" style="margin-bottom:14px;">Log in to see the live categories and quiz counts.</p>
          <button class="btn btn-secondary" onclick="Router.navigate('#/login')">Log In</button>
        </div>
      `;
      return;
    }

    try {
      const quizzes = await apiRequest('/quizzes');
const counts = {};

quizzes.forEach(q => {
    const topic = (q.topic || "").trim();

    if (!topic) return;

    if (!counts[topic]) {
        counts[topic] = 0;
    }

    counts[topic]++;
});

      const topics = Object.keys(counts);
      if (topics.length === 0) {
        gridEl.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No quizzes yet — categories will appear here as soon as one is created.</div>`;
        return;
      }

      gridEl.innerHTML = topics.map((topic, i) => {
        const icon = this.topicIcons[topic.toLowerCase()] || '🧩';
        const colorCls = this.cardColors[i % this.cardColors.length];
        return `
          <div class="cat-card ${colorCls}" onclick="Landing.openCategory('${encodeURIComponent(topic)}')">
            <span class="cat-icon">${icon}</span>
            <div>
              <div>${escapeHtml(topic)}</div>
              <div class="muted" style="color:inherit;opacity:0.85;font-weight:600;font-size:0.8rem;margin-top:2px;">
                ${counts[topic]} quiz${counts[topic] === 1 ? '' : 'zes'}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      gridEl.innerHTML = `<div class="error-msg" style="grid-column: 1 / -1;">${err.message}</div>`;
    }
  },
openCategory(encodedTopic) {
    Router.navigate(`#/quizzes/${encodedTopic}`);
},
};
