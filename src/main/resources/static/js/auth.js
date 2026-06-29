const Auth = {
  isLoggedIn: () => !!Storage.getToken(),
  isAdmin: () => Storage.getUser()?.role === 'ADMIN',
  currentUser: () => Storage.getUser(),

  logout() {
    Storage.clearToken();
    Storage.clearUser();
    location.hash = '#/';
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

  /** Sends the ID token from Google's account picker to our backend, which finds-or-creates the user. */
  async loginWithGoogleToken(idToken) {
    const data = await apiRequest('/auth/google', {
      method: 'POST',
      auth: false,
      body: { idToken },
    });
    Storage.setToken(data.token);
    Storage.setUser({ id: data.userId, username: data.username, role: data.role });
    return data;
  },

  /** Renders Google's real account-chooser button into the given element, or a setup hint if no Client ID is configured. */
  renderGoogleButton(containerId, onSuccess) {
    const el = document.getElementById(containerId);
    if (!GOOGLE_CLIENT_ID) {
      el.innerHTML = `
        <button class="btn-google" id="googleSetupBtn" type="button">
          ${googleIcon()} Continue with Google
        </button>
        <p class="muted" style="text-align:center;margin-top:8px;">
          Google Sign-In needs a Client ID — see <code>js/config.js</code>
        </p>
      `;
      document.getElementById('googleSetupBtn').onclick = () => {
        showToast('Add your Google Client ID in js/config.js to enable this', 'error');
      };
      return;
    }

    if (!window.google?.accounts?.id) {
      // Google's script may still be loading
      setTimeout(() => Auth.renderGoogleButton(containerId, onSuccess), 300);
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          await Auth.loginWithGoogleToken(response.credential);
          showToast('Signed in with Google', 'success');
          onSuccess();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
    });

    el.innerHTML = '';
    google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: el.parentElement.offsetWidth || 360,
      text: 'continue_with',
    });
  },

  renderLoginPage(container) {
    container.innerHTML = `
      <div class="card" style="max-width:440px;margin:40px auto;border-radius:32px;">
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to keep your streak going.</p>

        <div id="googleLoginBtn"></div>
        <div class="divider-row">or log in with username</div>

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
        <p class="muted" style="margin-top:16px;text-align:center;">
          No account? <a href="#/register" style="color:var(--coral);font-weight:700;text-decoration:none;">Sign up free</a>
      </div>
    `;

    Auth.renderGoogleButton('googleLoginBtn', () => Router.navigate('#/'));

    document.getElementById('loginBtn').onclick = async () => {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      errorEl.classList.add('hidden');
      try {
        await Auth.login(username, password);
        showToast('Logged in successfully', 'success');
        Router.navigate('#/');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    };
  },

  renderRegisterPage(container) {
    container.innerHTML = `
      <div class="card" style="max-width:440px;margin:40px auto;border-radius:32px;">
        <h1>Create your account</h1>
        <p class="subtitle">Join and start collecting points today.</p>

        <div id="googleRegisterBtn"></div>
        <div class="divider-row">or sign up with email</div>

        <div class="form-group">
          <label>Username</label>
          <input type="text" id="regUsername" placeholder="Choose a username" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="regEmail" placeholder="yourname@gmail.com" />
          <p class="muted" style="margin:6px 0 0;">Must be a gmail.com address</p>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="regPassword" placeholder="At least 8 characters" />
          <p class="muted" style="margin:6px 0 0;">Must include uppercase, lowercase, and a special character</p>
        </div>
        <div id="regError" class="error-msg hidden"></div>
        <button class="btn btn-block" id="regBtn">Create Account</button>
        <p class="muted" style="margin-top:16px;text-align:center;">
          Already have an account? <a href="#/login" style="color:var(--coral);font-weight:700;text-decoration:none;">Log in</a>
        </p>
      </div>
    `;

    Auth.renderGoogleButton('googleRegisterBtn', () => Router.navigate('#/quizzes'));

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
        Router.navigate('#/');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    };
  },
};

function googleIcon() {
  return `<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.7 34.6 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.6 5.6C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>`;
}

//<p class="muted" style="text-align:center;">Demo: <b>admin/admin123</b> · <b>demo/demo123</b></p>