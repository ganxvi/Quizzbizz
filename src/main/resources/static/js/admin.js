const Admin = {
  questionCounter: 0,

  async renderDashboard(container) {
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h1>Manage Quizzes</h1>
        <button class="btn" onclick="Router.navigate('#/admin/new')">+ New Quiz</button>
      </div>
      <div id="adminQuizList" class="quiz-list"><p class="muted">Loading...</p></div>
    `;

    try {
      const quizzes = await apiRequest('/quizzes');
      const el = document.getElementById('adminQuizList');
      if (quizzes.length === 0) {
        el.innerHTML = `<div class="empty-state">No quizzes yet. Create your first one!</div>`;
        return;
      }
      el.innerHTML = quizzes.map(q => `
        <div class="card quiz-card">
          <div>
            <h2 style="margin:0 0 6px;">${escapeHtml(q.title)}</h2>
            <span class="badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
            <span class="badge">${q.questionCount} questions</span>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('#/admin/edit/${q.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="Admin.deleteQuiz(${q.id})">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      document.getElementById('adminQuizList').innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
  },

  async deleteQuiz(quizId) {
    if (!confirm('Delete this quiz permanently? This cannot be undone.')) return;
    try {
      await apiRequest(`/admin/quizzes/${quizId}`, { method: 'DELETE' });
      showToast('Quiz deleted', 'success');
      Admin.renderDashboard(document.getElementById('app'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async renderForm(container, quizId = null) {
    let quiz = null;
    if (quizId) {
      try {
        quiz = await apiRequest(`/admin/quizzes/${quizId}`);
      } catch (err) {
        container.innerHTML = `<div class="error-msg">${err.message}</div>`;
        return;
      }
    }

    container.innerHTML = `
      <h1>${quiz ? 'Edit Quiz' : 'Create New Quiz'}</h1>
      <div class="card">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="quizTitle" value="${quiz ? escapeHtml(quiz.title) : ''}" placeholder="e.g. JavaScript Basics" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="quizDescription" rows="2" placeholder="Short description">${quiz ? escapeHtml(quiz.description || '') : ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Topic</label>
            <input type="text" id="quizTopic" value="${quiz ? escapeHtml(quiz.topic || '') : ''}" placeholder="e.g. Java" />
          </div>
          <div class="form-group">
            <label>Difficulty</label>
            <select id="quizDifficulty">
              ${['EASY','MEDIUM','HARD'].map(d => `<option value="${d}" ${quiz?.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Time Limit (seconds, 0 = none)</label>
            <input type="number" id="quizTimeLimit" value="${quiz ? quiz.timeLimitSeconds : 0}" min="0" />
          </div>
        </div>
      </div>

      <div id="questionsContainer"></div>

      <button class="btn btn-secondary" id="addQuestionBtn">+ Add Question</button>

      <div class="btn-row" style="margin-top:20px;">
        <button class="btn" id="saveQuizBtn">${quiz ? 'Save Changes' : 'Create Quiz'}</button>
        <button class="btn btn-secondary" onclick="Router.navigate('#/admin')">Cancel</button>
      </div>
      <div id="quizFormError" class="error-msg hidden"></div>
    `;

    this.questionCounter = 0;
    const qContainer = document.getElementById('questionsContainer');

    const addQuestionBlock = (questionData = null) => {
      const qId = this.questionCounter++;
      const block = document.createElement('div');
      block.className = 'card question-block';
      block.dataset.qId = qId;
      block.innerHTML = `
        <div style="display:flex;justify-content:space-between;">
          <strong>Question ${qId + 1}</strong>
          <button class="btn btn-danger btn-sm" onclick="this.closest('.question-block').remove()">Remove</button>
        </div>
        <div class="form-group">
          <label>Question Text</label>
          <input type="text" class="q-title" value="${questionData ? escapeHtml(questionData.title) : ''}" placeholder="Enter question" />
        </div>
        <div class="form-group">
          <label><input type="checkbox" class="q-multi" ${questionData?.multipleAnswers ? 'checked' : ''} /> Allow multiple correct answers</label>
        </div>
        <label>Options (check the box next to correct answer(s))</label>
        <div class="options-edit-list"></div>
        <button class="btn btn-secondary btn-sm add-option-btn" style="margin-top:6px;">+ Add Option</button>
      `;

      const optList = block.querySelector('.options-edit-list');
      const addOptionRow = (optData = null) => {
        const row = document.createElement('div');
        row.className = 'option-edit-row';
        row.innerHTML = `
          <input type="checkbox" class="opt-correct" ${optData?.correct ? 'checked' : ''} title="Correct answer" />
          <input type="text" class="opt-text" value="${optData ? escapeHtml(optData.text) : ''}" placeholder="Option text" />
          <button class="btn btn-danger btn-sm" onclick="this.closest('.option-edit-row').remove()">✕</button>
        `;
        optList.appendChild(row);
      };

      if (questionData && questionData.options.length) {
        questionData.options.forEach(o => addOptionRow(o));
      } else {
        addOptionRow(); addOptionRow();
      }

      block.querySelector('.add-option-btn').onclick = () => addOptionRow();
      qContainer.appendChild(block);
    };

    if (quiz && quiz.questions.length) {
      quiz.questions.forEach(q => addQuestionBlock(q));
    } else {
      addQuestionBlock();
    }

    document.getElementById('addQuestionBtn').onclick = () => addQuestionBlock();

    document.getElementById('saveQuizBtn').onclick = async () => {
      const errorEl = document.getElementById('quizFormError');
      errorEl.classList.add('hidden');

      const payload = {
        title: document.getElementById('quizTitle').value.trim(),
        description: document.getElementById('quizDescription').value.trim(),
        topic: document.getElementById('quizTopic').value.trim(),
        difficulty: document.getElementById('quizDifficulty').value,
        timeLimitSeconds: Number(document.getElementById('quizTimeLimit').value) || 0,
        questions: [],
      };

      const blocks = qContainer.querySelectorAll('.question-block');
      for (const block of blocks) {
        const title = block.querySelector('.q-title').value.trim();
        const multipleAnswers = block.querySelector('.q-multi').checked;
        const options = [];
        block.querySelectorAll('.option-edit-row').forEach(row => {
          const text = row.querySelector('.opt-text').value.trim();
          const correct = row.querySelector('.opt-correct').checked;
          if (text) options.push({ text, correct });
        });
        if (title && options.length >= 2) {
          payload.questions.push({ title, multipleAnswers, options });
        }
      }

      if (!payload.title) {
        errorEl.textContent = 'Quiz title is required';
        errorEl.classList.remove('hidden');
        return;
      }
      if (payload.questions.length === 0) {
        errorEl.textContent = 'Add at least one complete question with 2+ options';
        errorEl.classList.remove('hidden');
        return;
      }
      const missingCorrect = payload.questions.find(q => !q.options.some(o => o.correct));
      if (missingCorrect) {
        errorEl.textContent = `Question "${missingCorrect.title}" needs at least one correct answer marked`;
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        if (quiz) {
          await apiRequest(`/admin/quizzes/${quiz.id}`, { method: 'PUT', body: payload });
          showToast('Quiz updated', 'success');
        } else {
          await apiRequest('/admin/quizzes', { method: 'POST', body: payload });
          showToast('Quiz created', 'success');
        }
        Router.navigate('#/admin');
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    };
  },
};
