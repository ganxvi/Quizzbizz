const Auth = {
  isLoggedIn: () => !!Storage.getToken(),
  isAdmin: () => Storage.getUser()?.role === 'ADMIN',
  currentUser: () => Storage.getUser(),

  logout() {
    Storage.clearToken();
    Storage.clearUser();
    location.hash = '#/login';
  },

  async login(username, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: { username, password },
    });
    Storage.setToken(data.token);
    Storage.setUser({ id: data.userId, username: data.username, role: data.role });
    return data;
  },

  async register(username, email, password) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      auth: false,
      body: { username, email, password },
    });
    Storage.setToken(data.token);
    Storage.setUser({ id: data.userId, username: data.username, role: data.role });
    return data;
  },

  renderLoginPage(container) {
    container.innerHTML = `
      <div class="card" style="max-width:420px;margin:40px auto;">
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to take quizzes and track your progress.</p>
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="loginUsername" placeholder="e.g. demo" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="loginPassword" placeholder="••••••••" />
        </div>
        <div id="loginError" class="error-msg hidden"></div>
        <button class="btn btn-block" id="loginBtn">Log In</button>
        <p class="muted" style="margin-top:14px;">
          No account? <a href="#/register">Register here</a>
        </p>
      </div>
    `;

    document.getElementById('loginBtn').onclick = async () => {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      errorEl.classList.add('hidden');
      try {
        await Auth.login(username, password);
        showToast('Logged in successfully', 'success');
        Router.navigate('#/quizzes');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    };
  },

  renderRegisterPage(container) {
    container.innerHTML = `
      <div class="card" style="max-width:420px;margin:40px auto;">
        <h1>Create your account</h1>
        <p class="subtitle">Sign up to start taking quizzes.</p>
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="regUsername" placeholder="Choose a username" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="regEmail" placeholder="yourname@gmail.com" />
          <p class="muted" style="margin:4px 0 0;">Must be a gmail.com address</p>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="regPassword" placeholder="At least 8 characters" />
          <p class="muted" style="margin:4px 0 0;">Must include uppercase, lowercase, and a special character</p>
        </div>
        <div id="regError" class="error-msg hidden"></div>
        <button class="btn btn-block" id="regBtn">Register</button>
        <p class="muted" style="margin-top:14px;">
          Already have an account? <a href="#/login">Log in</a>
        </p>
      </div>
    `;

    document.getElementById('regBtn').onclick = async () => {
      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const errorEl = document.getElementById('regError');
      errorEl.classList.add('hidden');

      if (!email.toLowerCase().endsWith('@gmail.com')) {
        errorEl.textContent = 'Email must be a gmail.com address';
        errorEl.classList.remove('hidden');
        return;
      }
      const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,}$/;
      if (!strongPassword.test(password)) {
        errorEl.textContent = 'Password must be 8+ characters with uppercase, lowercase, and a special character';
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        await Auth.register(username, email, password);
        showToast('Account created!', 'success');
        Router.navigate('#/quizzes');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    };
  },
};
  // <p class="muted">Demo accounts: <b>admin/admin123</b> (admin), <b>demo/demo123</b> (user)</p>